import { Queue, Worker } from 'bullmq';
import redis from '../config/redis.js';
import {
  handleSuccessfulPayment,
  handleRecurringPayment,
  handleSubscriptionCanceled,
  handleFailedPayment,
  handleDraftInvoice,
  handleInvoiceStatusChange,
  processPidUpdates,
} from '../handlers/stripeHandlers.js';

// Configurazione della coda
const queueConfig = {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100, // Mantieni solo gli ultimi 100 job completati
    removeOnFail: 50, // Mantieni solo gli ultimi 50 job falliti
    attempts: 3, // Numero massimo di tentativi
    backoff: {
      type: 'exponential',
      delay: 2000, // Delay iniziale di 2 secondi
    },
  },
};

// Crea la coda per gli eventi Stripe
export const stripeQueue = new Queue('stripe-events', queueConfig);

// Mappa degli handler per tipo di evento
const eventHandlers = {
  'checkout.session.completed': handleSuccessfulPayment,
  'invoice.payment_succeeded': handleRecurringPayment,
  'customer.subscription.deleted': handleSubscriptionCanceled,
  'invoice.payment_failed': handleFailedPayment,
  'invoice.created': handleDraftInvoice,
  'invoice.updated': handleInvoiceStatusChange,
};

// Worker per processare i job della coda
export const stripeWorker = new Worker(
  'stripe-events',
  async (job) => {
    const { eventType, eventData, eventId } = job.data;

    console.log(`🔄 Processando evento: ${eventType} (ID: ${eventId})`);

    const handler = eventHandlers[eventType];

    if (!handler) {
      console.log(`ℹ️ Nessun handler per evento: ${eventType}`);
      // Anche se non c'è handler, processa gli aggiornamenti PID
      await processPidUpdates();
      return;
    }

    try {
      await handler(eventData, eventId); // Cambiato da eventData.object a eventData
      console.log(`✅ Evento processato con successo: ${eventType}`);

      // Processa gli aggiornamenti PID dopo ogni evento
      await processPidUpdates();
    } catch (error) {
      console.error(`❌ Errore nel processare evento ${eventType}:`, error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5, // Processa fino a 5 job contemporaneamente
  }
);

// Event listeners per il worker
stripeWorker.on('completed', (job) => {
  console.log(`✅ Job completato: ${job.id}`);
});

stripeWorker.on('failed', (job, err) => {
  console.error(`❌ Job fallito: ${job.id}`, err.message);
});

stripeWorker.on('error', (err) => {
  console.error('❌ Errore worker:', err);
});

// Funzione helper per aggiungere eventi alla coda
export async function addStripeEventToQueue(event) {
  const jobData = {
    eventType: event.type,
    eventData: event.data.object,
    eventId: event.id,
    timestamp: new Date().toISOString(),
  };

  const job = await stripeQueue.add(`stripe-${event.type}`, jobData, {
    // Job specifico options
    priority: getEventPriority(event.type),
    delay: 0, // Processa immediatamente
  });

  console.log(`📝 Evento aggiunto alla coda: ${event.type} (Job ID: ${job.id})`);
  return job;
}

// Funzione per determinare la priorità degli eventi
function getEventPriority(eventType) {
  const priorities = {
    'checkout.session.completed': 1, // Alta priorità
    'invoice.payment_succeeded': 1, // Alta priorità
    'invoice.payment_failed': 2, // Media priorità
    'customer.subscription.deleted': 2, // Media priorità
    'invoice.created': 3, // Bassa priorità
    'invoice.updated': 3, // Bassa priorità
  };

  return priorities[eventType] || 5; // Priorità di default
}

export default { stripeQueue, stripeWorker, addStripeEventToQueue };
