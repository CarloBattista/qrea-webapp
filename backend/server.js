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

let currentStripeId = null;
let currentProfileEmail = null;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Per i webhook di Stripe, dobbiamo usare raw body
// app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

// Per tutti gli altri endpoint
app.use('/api', bodyParser.json());
app.use('/api', bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/payments', paymentsRouter);
app.use('/api/subscriptions', subscriptionsRouter);

// Webhook endpoint
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  // ONLY FOR DEBUG
  // if (sig && sig.includes('fake_signature')) {
  //   console.log('⚠️ Test webhook con firma fittizia - modalità debug');
  //   return res.json({ received: true, message: 'Test webhook OK - debug mode' });
  // }

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ WEBHOOK RECIVED:', event.type);
  } catch (err) {
    console.error('❌ ERROR WEBHOOK:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // console.log(`✅ Webhook ricevuto: ${event.type}`);

  // Gestisci gli eventi
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('🎉 Pagamento completato:', session.id);
        await handleSuccessfulPayment(session);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('💰 Pagamento ricorrente riuscito:', invoice.id);
        await handleRecurringPayment(invoice);
        break;
      }

      case 'customer.subscription.created': {
        const newSubscription = event.data.object;
        console.log('📝 Nuovo abbonamento creato:', newSubscription.id);
        await handleSubscriptionCreated(newSubscription);
        break;
      }

      case 'customer.subscription.updated': {
        const updatedSubscription = event.data.object;
        console.log('🔄 Abbonamento aggiornato:', updatedSubscription.id);
        await handleSubscriptionUpdated(updatedSubscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const deletedSubscription = event.data.object;
        console.log('❌ Abbonamento cancellato:', deletedSubscription.id);
        await handleSubscriptionCanceled(deletedSubscription);
        break;
      }

      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object;
        console.log('⚠️ Pagamento fallito:', failedInvoice.id);
        await handleFailedPayment(failedInvoice);
        break;
      }

      case 'invoice.created': {
        const invoice = event.data.object;
        if (invoice.status === 'draft') {
          console.log('📄 Fattura draft creata:', invoice.id);
          await handleDraftInvoice(invoice);
        }
        break;
      }

      case 'invoice.updated': {
        const invoice = event.data.object;
        console.log('🔄 Fattura aggiornata:', invoice.id, 'Status:', invoice.status);
        await handleInvoiceStatusChange(invoice);
        break;
      }

      default:
        console.log(`ℹ️ Evento non gestito: ${event.type}`);
    }
  } catch (error) {
    console.error('❌ Errore nel processare il webhook:', error);
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

    const { error } = await supabase
      .from('profiles')
      .update({
        plan: 'pro',
        last_payment_date: new Date().toISOString(),
        current_period_end: new Date(invoice.period_end * 1000).toISOString(),
        subscription_status: 'active',
        suspended_at: null,
        suspension_reason: null,
      })
      .eq('stripe_id', currentStripeId);

    if (error) {
      console.error('❌ Errore aggiornamento profilo dopo pagamento ricorrente:', error);
    } else {
      console.log('✅ Profilo aggiornato con successo dopo pagamento ricorrente');
    }

    // Opzionale: invia email di conferma del rinnovo
    // await sendRenewalConfirmationEmail(invoice.customer, invoice.amount_paid);
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
      .eq('stripe_id', currentStripeId);

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
      .eq('stripe_id', currentStripeId);

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

    await suspendUserProfile(invoice.customer, 'payment_failed');

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

async function handleDraftInvoice(invoice) {
  try {
    console.log('⚠️ Fattura draft rilevata:', {
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_due,
      currency: invoice.currency,
    });

    // Sospendi il profilo dell'utente
    await suspendUserProfile(invoice.customer, 'draft_payment');
  } catch (error) {
    console.error('❌ Errore nel gestire fattura draft:', error);
  }
}

async function handleInvoiceStatusChange(invoice) {
  try {
    console.log('🔄 Cambio status fattura:', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      oldStatus: 'unknown', // Stripe non fornisce il vecchio status
      newStatus: invoice.status,
    });

    if (invoice.status === 'draft') {
      // Sospendi il profilo se la fattura è draft
      await suspendUserProfile(invoice.customer, 'draft_payment');
    } else if (invoice.status === 'paid') {
      // Riattiva il profilo se la fattura è stata pagata
      await reactivateUserProfile(invoice.customer);
    }
  } catch (error) {
    console.error('❌ Errore nel gestire cambio status fattura:', error);
  }
}

async function suspendUserProfile(customerId, reason = 'payment_issue') {
  try {
    console.log(`🚫 Sospensione profilo per customer: ${customerId}, motivo: ${reason}`);
    console.log(`🔍 currentStripeId attuale: ${currentStripeId}`);

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('uid, first_name, last_name')
      .eq('stripe_id', currentStripeId)
      .single();

    if (profileError) {
      console.error('❌ Errore nel recuperare i dati del profilo:', profileError);
      return;
    }

    console.log(`📋 Dati profilo recuperati:`, {
      email: currentProfileEmail,
      first_name: profileData?.first_name,
      hasEmail: !!currentProfileEmail,
    });

    // Aggiorna il profilo nel database - USA currentStripeId
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspension_reason: reason,
      })
      .eq('stripe_id', currentStripeId);

    if (error) {
      console.error('❌ Errore sospensione profilo:', error);
    } else {
      console.log('✅ Profilo sospeso con successo');

      // Invia email di notifica
      if (profileData && currentProfileEmail) {
        const userName = profileData.first_name || currentProfileEmail;
        console.log(`📧 Tentativo di invio email a: ${currentProfileEmail}`);
        await sendSuspensionEmail(currentProfileEmail, userName, reason);
      } else {
        console.log("⚠️ Nessun dato email trovato per l'utente");
      }
    }
  } catch (error) {
    console.error('❌ Errore nel sospendere il profilo:', error);
  }
}

async function reactivateUserProfile(customerId) {
  try {
    console.log(`🔓 Riattivazione profilo per customer: ${customerId}`);

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        suspended_at: null,
        suspension_reason: null,
      })
      .eq('stripe_id', currentStripeId);

    if (error) {
      console.error('❌ Errore riattivazione profilo:', error);
    } else {
      console.log('✅ Profilo riattivato con successo');
    }
  } catch (error) {
    console.error('❌ Errore nel riattivare il profilo:', error);
  }
}

// Aggiungi questa funzione dopo le altre funzioni helper
async function sendSuspensionEmail(userEmail, userName, suspensionReason) {
  console.log(`📧 === INIZIO INVIO EMAIL SOSPENSIONE ===`);
  console.log(`📧 Email destinatario: ${userEmail}`);
  console.log(`📧 Nome utente: ${userName}`);
  console.log(`📧 Motivo sospensione: ${suspensionReason}`);

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY non configurata - impossibile inviare email');
    return;
  }

  console.log(`🔑 RESEND_API_KEY trovata: ${RESEND_API_KEY.substring(0, 10)}...`);

  try {
    const fs = await import('fs');
    const path = await import('path');
    const templatePath = path.join(process.cwd(), '..', 'emails', 'profile-suspended.html');

    console.log(`📄 Percorso template: ${templatePath}`);

    // Verifica che il template esista
    if (!fs.existsSync(templatePath)) {
      console.error(`❌ Template email non trovato: ${templatePath}`);
      return;
    }

    console.log(`✅ Template trovato, lettura in corso...`);
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Sostituisci i placeholder con i dati reali
    htmlTemplate = htmlTemplate
      .replace(/{{userName}}/g, userName || 'Utente')
      .replace(/{{suspensionReason}}/g, getSuspensionReasonText(suspensionReason));

    console.log(`🔄 Template processato, preparazione dati email...`);

    const emailData = {
      from: process.env.RESEND_EMAIL_FROM || 'onboarding@resend.dev',
      to: [userEmail],
      subject: 'Qrea - Account Sospeso',
      html: htmlTemplate,
    };

    console.log(`📤 Invio email tramite Resend API...`);
    console.log(`📤 Dati email:`, {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
    });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    console.log(`📨 Risposta Resend - Status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Errore invio email sospensione:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
    } else {
      const result = await response.json();
      console.log('✅ Email di sospensione inviata con successo:', {
        to: userEmail,
        id: result.id,
      });
    }
  } catch (error) {
    console.error("❌ Errore nell'invio dell'email di sospensione:", error);
  }

  console.log(`📧 === FINE INVIO EMAIL SOSPENSIONE ===`);
}

// Funzione helper per tradurre i motivi di sospensione
function getSuspensionReasonText(reason) {
  const reasons = {
    payment_issue: 'Problema con il pagamento',
    draft_payment: 'Pagamento in sospeso o non completato',
    manual_suspension: 'Sospensione manuale',
    policy_violation: 'Violazione delle politiche',
    fraud_detection: 'Rilevamento di attività fraudolenta',
    account_security: "Problemi di sicurezza dell'account",
  };

  return reasons[reason] || 'Motivo non specificato';
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

app.post('/api/stripe-customer', async (req, res) => {
  try {
    const { email, stripeId } = req.body;
    console.log('email:', email);
    console.log('stripe_id:', stripeId);

    currentStripeId = stripeId;
    currentProfileEmail = email;

    res.json({
      success: true,
      message: 'Dati ricevuti e loggati con successo',
      received: req.body,
    });
  } catch (error) {
    console.error('❌ Errore nel ricevere i dati:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/suspend-profile', async (req, res) => {
  try {
    const { customerId, reason = 'manual_suspension' } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'customerId è richiesto' });
    }

    console.log(`🔧 Sospensione manuale richiesta per customer: ${customerId}`);

    // Chiama la funzione esistente per sospendere il profilo
    await suspendUserProfile(customerId, reason);

    res.json({
      success: true,
      message: `Profilo sospeso per customer ${customerId}`,
      customerId,
      reason,
    });
  } catch (error) {
    console.error('❌ Errore nella sospensione manuale:', error);
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
