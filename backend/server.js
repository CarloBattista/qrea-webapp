import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import paymentsRouter from './routes/payments.js';
import subscriptionsRouter from './routes/subscriptions.js';
import process from 'process';
import { addStripeEventToQueue } from './queues/stripeQueue.js';
import { saveStripeEvent } from './handlers/stripeHandlers.js';
import './config/redis.js';

// Configura dotenv
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Per tutti gli altri endpoint
app.use('/api', bodyParser.json());
app.use('/api', bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/payments', paymentsRouter);
app.use('/api/subscriptions', subscriptionsRouter);

app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ WEBHOOK RECEIVED:', event.type);
  } catch (err) {
    console.error('❌ ERROR WEBHOOK:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Salva l'evento nel database
    await saveStripeEvent(event);
    console.log('✅ Evento salvato nel database:', event.id);

    // Aggiunge l'evento alla coda per il processamento
    await addStripeEventToQueue(event);
    console.log('✅ Evento aggiunto alla coda:', event.id);

    res.json({ received: true, saved: true, queued: true });
  } catch (error) {
    console.error('❌ Errore nel processare il webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

app.get('/api/webhook-info', async (req, res) => {
  try {
    console.log('🔍 Verifica configurazione webhook');

    // Lista tutti i webhook endpoint
    const webhookEndpoints = await stripe.webhookEndpoints.list();

    res.json({
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'Configurato' : 'Mancante',
      endpoints: webhookEndpoints.data.map((endpoint) => ({
        id: endpoint.id,
        url: endpoint.url,
        status: endpoint.status,
        enabledEvents: endpoint.enabled_events,
      })),
    });
  } catch (error) {
    console.error('❌ Errore nella verifica webhook:', error);
    res.status(500).json({
      error: 'Errore interno del server',
      details: error.message,
    });
  }
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
