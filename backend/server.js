import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import paymentsRouter from './routes/payments.js';
import subscriptionsRouter from './routes/subscriptions.js';
import process from 'process';

// Configura dotenv
dotenv.config();

import { supabase } from './supabase.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Per i webhook di Stripe, dobbiamo usare raw body
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

// Per tutti gli altri endpoint
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/payments', paymentsRouter);
app.use('/api/subscriptions', subscriptionsRouter);

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`❌ Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`✅ Webhook ricevuto: ${event.type}`);

  // Gestisci gli eventi
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('🎉 Pagamento completato:', session.id);
        await handleSuccessfulPayment(session);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('💰 Pagamento ricorrente riuscito:', invoice.id);
        await handleRecurringPayment(invoice);
        break;

      case 'customer.subscription.created':
        const newSubscription = event.data.object;
        console.log('📝 Nuovo abbonamento creato:', newSubscription.id);
        await handleSubscriptionCreated(newSubscription);
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        console.log('🔄 Abbonamento aggiornato:', updatedSubscription.id);
        await handleSubscriptionUpdated(updatedSubscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        console.log('❌ Abbonamento cancellato:', deletedSubscription.id);
        await handleSubscriptionCanceled(deletedSubscription);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('⚠️ Pagamento fallito:', failedInvoice.id);
        await handleFailedPayment(failedInvoice);
        break;

      default:
        console.log(`ℹ️ Evento non gestito: ${event.type}`);
    }
  } catch (error) {
    console.error('❌ Errore nel processare il webhook:', error);
    return res.status(500).send('Errore interno del server');
  }

  res.json({ received: true });
});

// Funzioni per gestire gli eventi webhook
async function handleSuccessfulPayment(session) {
  try {
    // Recupera i dettagli completi della sessione
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'customer', 'subscription'],
    });

    const paymentDetails = {
      sessionId: fullSession.id,
      customerId: fullSession.customer,
      customerEmail: fullSession.customer_details?.email,
      amount: fullSession.amount_total,
      currency: fullSession.currency,
      paymentStatus: fullSession.payment_status,
      subscriptionId: fullSession.subscription,
      mode: fullSession.mode,
      lineItems: fullSession.line_items?.data || [],
    };

    console.log('📊 Dettagli pagamento:', paymentDetails);

    // Qui puoi salvare nel database
    // await savePaymentToDatabase(paymentDetails);

    // Invia email di conferma
    // await sendConfirmationEmail(paymentDetails);

    // Attiva l'accesso dell'utente se è un abbonamento
    if (fullSession.mode === 'subscription' && fullSession.subscription) {
      await activateUserSubscription(fullSession.customer, fullSession.subscription);
    }
  } catch (error) {
    console.error('❌ Errore nel processare il pagamento:', error);
  }
}

async function handleRecurringPayment(invoice) {
  try {
    console.log('💰 Pagamento ricorrente per:', {
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      period: {
        start: new Date(invoice.period_start * 1000),
        end: new Date(invoice.period_end * 1000),
      },
    });

    // Estendi l'accesso dell'utente
    // await extendUserAccess(invoice.customer, invoice.subscription);
  } catch (error) {
    console.error('❌ Errore nel processare il pagamento ricorrente:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    console.log('📝 Nuovo abbonamento:', {
      id: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    });

    // Salva l'abbonamento nel database
    // await saveSubscriptionToDatabase(subscription);
  } catch (e) {
    console.error(e);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('🔄 Abbonamento aggiornato:', {
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    // Aggiorna il profilo nel database Supabase
    const { error } = await supabase
      .from('profiles')
      .update({
        plan: subscription.status === 'active' && !subscription.cancel_at_period_end ? 'pro' : 'free',
        subscription_status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('stripe_id', subscription.customer);

    if (error) {
      console.error('Errore aggiornamento profilo:', error);
    }
  } catch (e) {
    console.error(e);
  }
}

async function handleSubscriptionCanceled(subscription) {
  try {
    console.log('❌ Abbonamento cancellato:', {
      id: subscription.id,
      customerId: subscription.customer,
      canceledAt: new Date(subscription.canceled_at * 1000),
    });

    // Aggiorna il profilo a piano gratuito
    const { error } = await supabase
      .from('profiles')
      .update({
        plan: 'free',
        subscription_status: 'canceled',
        stripe_id: null,
        canceled_at: new Date(subscription.canceled_at * 1000).toISOString(),
      })
      .eq('stripe_id', subscription.customer);

    if (error) {
      console.error('Errore aggiornamento profilo:', error);
    }
  } catch (e) {
    console.error(e);
  }
}

async function handleFailedPayment(invoice) {
  try {
    console.log('⚠️ Pagamento fallito:', {
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_due,
      attemptCount: invoice.attempt_count,
    });

    // Invia email di avviso
    // await sendPaymentFailedEmail(invoice.customer);

    // Se è il terzo tentativo fallito, sospendi l'accesso
    if (invoice.attempt_count >= 3) {
      // await suspendUserAccess(invoice.customer);
    }
  } catch (error) {
    console.error('❌ Errore nel gestire il pagamento fallito:', error);
  }
}

// Funzioni helper (da implementare con il tuo database)
async function activateUserSubscription(customerId, subscriptionId) {
  // Implementa la logica per attivare l'abbonamento dell'utente
  console.log(`🔓 Attivazione accesso per customer: ${customerId}`);
}

// Endpoint di test per verificare che il server funzioni
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Endpoint per ottenere informazioni sul server
app.get('/api/info', (req, res) => {
  res.json({
    name: 'QR Generator Backend',
    version: '1.0.0',
    stripe: {
      connected: !!process.env.STRIPE_SECRET_KEY,
      webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
    },
  });
});

// Gestione errori globale
app.use((err, req, res, next) => {
  console.error('❌ Errore non gestito:', err);
  res.status(500).json({
    error: 'Errore interno del server',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Qualcosa è andato storto',
  });
});

// Gestione route non trovate
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trovata',
    path: req.originalUrl,
  });
});

// Avvio del server
app.listen(PORT, () => {
  console.log(`🚀 Server in esecuzione sulla porta ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`💳 Stripe configurato: ${!!process.env.STRIPE_SECRET_KEY}`);
  console.log(`🔗 Webhook configurato: ${!!process.env.STRIPE_WEBHOOK_SECRET}`);

  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️ STRIPE_SECRET_KEY non configurata!');
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('⚠️ STRIPE_WEBHOOK_SECRET non configurata!');
  }
});

// Gestione graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Ricevuto SIGTERM, chiusura graceful del server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Ricevuto SIGINT, chiusura graceful del server...');
  process.exit(0);
});
