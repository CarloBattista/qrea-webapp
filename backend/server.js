import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { Resend } from 'resend';
import paymentsRouter from './routes/payments.js';
import subscriptionsRouter from './routes/subscriptions.js';
import process from 'process';
import fs from 'fs';
import path from 'path';

// Configura dotenv
dotenv.config();

import { supabase } from './supabase.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

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

const webhookQueue = [];
const failedWebhooks = new Map();
const pidUpdateQueue = new Map();
let isProcessingQueue = false;

async function processWebhookQueue() {
  if (isProcessingQueue || webhookQueue.length === 0) return;

  isProcessingQueue = true;

  while (webhookQueue.length > 0) {
    const { event, handler } = webhookQueue.shift();
    try {
      await handler(event);
    } catch (error) {
      console.error('Errore nel processare webhook:', error);
    }
  }

  isProcessingQueue = false;
}

async function processFailedWebhooks() {
  const now = Date.now();
  const retryInterval = 30000; // 30 secondi
  const maxAttempts = 10;

  for (const [key, webhookData] of failedWebhooks.entries()) {
    if (now - webhookData.lastAttempt < retryInterval) continue;
    if (webhookData.attempts >= maxAttempts) {
      console.error('❌ Webhook abbandonato dopo troppi tentativi:', key);
      failedWebhooks.delete(key);
      continue;
    }

    console.log(`🔄 Retry webhook ${key}, tentativo ${webhookData.attempts + 1}`);

    try {
      if (webhookData.type === 'recurring_payment') {
        await handleRecurringPayment(webhookData.invoice);
        failedWebhooks.delete(key); // Rimuovi se ha successo
      }
    } catch (error) {
      console.error('Errore nel retry webhook:', error);
      webhookData.attempts++;
      webhookData.lastAttempt = now;
    }
  }
}

function queueWebhook(event, handler) {
  webhookQueue.push({ event, handler });
  processWebhookQueue();
}

setInterval(processFailedWebhooks, 30000);

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

  // Verifica se l'evento è già stato processato
  const { data: existingEvent, error: checkError } = await supabase.from('stripe_events').select('id').eq('event_id', event.id).maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('❌ Errore nel verificare evento esistente:', checkError);
    return res.status(500).json({ error: 'Database error' });
  }

  if (existingEvent) {
    console.log(`ℹ️ Evento ${event.id} già processato, skip`);
    return res.json({ received: true, message: 'Event already processed' });
  }

  try {
    const { pid } = await saveStripeEvent(event);
    console.log(`📝 Evento salvato con pid: ${pid || 'N/A'}`);
  } catch (error) {
    // Se è un errore di duplicazione, significa che l'evento è stato inserito nel frattempo
    if (error.code === '23505') {
      console.log(`ℹ️ Evento ${event.id} già esistente (race condition), skip`);
      return res.json({ received: true, message: 'Event already exists' });
    }
    console.error('❌ Errore nel salvare evento:', error);
    return res.status(500).json({ error: 'Failed to save event' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('🎉 Pagamento completato:', session.id);
        await handleSuccessfulPayment(session, event.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('💰 Pagamento ricorrente riuscito:', invoice.id);
        await handleRecurringPayment(invoice, event.id);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        console.log('💰 Pagamento riuscito:', invoice.id);
        await handleRecurringPayment(invoice);
        break;
      }

      case 'customer.subscription.created': {
        const newSubscription = event.data.object;
        console.log('📝 Nuovo abbonamento creato:', newSubscription.id);
        await handleSubscriptionCreated(newSubscription, event.id);
        break;
      }

      case 'customer.subscription.updated': {
        const updatedSubscription = event.data.object;
        console.log('🔄 Abbonamento aggiornato:', updatedSubscription.id);
        await handleSubscriptionUpdated(updatedSubscription, event.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const deletedSubscription = event.data.object;
        console.log('❌ Abbonamento cancellato:', deletedSubscription.id);
        await handleSubscriptionCanceled(deletedSubscription, event.id);
        break;
      }

      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object;
        console.log('⚠️ Pagamento fallito:', failedInvoice.id);
        await handleFailedPayment(failedInvoice, event.id);
        break;
      }

      case 'invoice.created': {
        const invoice = event.data.object;
        if (invoice.status === 'draft') {
          console.log('📄 Fattura draft creata:', invoice.id);
          await handleDraftInvoice(invoice, event.id);
        }
        break;
      }

      case 'invoice.updated': {
        const invoice = event.data.object;
        console.log('🔄 Fattura aggiornata:', invoice.id, 'Status:', invoice.status);
        await handleInvoiceStatusChange(invoice, event.id);
        break;
      }

      default:
        console.log(`ℹ️ Evento non gestito: ${event.type}`);
    }

    // Marca l'evento come processato
    await supabase
      .from('stripe_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('event_id', event.id);
  } catch (error) {
    console.error('❌ Errore nel processare il webhook:', error);

    // Salva l'errore nell'evento
    await supabase
      .from('stripe_events')
      .update({
        error: error.message,
        processed_at: new Date().toISOString(),
      })
      .eq('event_id', event.id);
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
      customerId: fullSession.customer.id,
      customerEmail: fullSession.customer_details?.email,
      amount: fullSession.amount_total,
      currency: fullSession.currency,
      paymentStatus: fullSession.payment_status,
      subscriptionId: fullSession.subscription,
      mode: fullSession.mode,
      lineItems: fullSession.line_items?.data || [],
    };

    // console.log('📊 Dettagli pagamento:', paymentDetails);

    // Attiva l'accesso dell'utente se è un abbonamento
    if (fullSession.mode === 'subscription' && fullSession.subscription) {
      // Passa solo l'ID del customer come stringa, non l'oggetto
      const customerId = typeof fullSession.customer === 'string' ? fullSession.customer : fullSession.customer.id;

      const subscriptionId = typeof fullSession.subscription === 'string' ? fullSession.subscription : fullSession.subscription.id;

      await activateUserSubscription(customerId, subscriptionId);
    }
  } catch (error) {
    console.error('❌ Errore nel processare il pagamento:', error);
  }
}

async function handleRecurringPayment(invoice) {
  try {
    const subscriptionId =
      invoice.parent?.subscription_details?.subscription || invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription;
    console.log('💰 Pagamento ricorrente riuscito:', invoice.id);
    console.log('💰 Pagamento ricorrente per:', {
      customerId: invoice.customer,
      subscriptionId: subscriptionId,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      period: {
        start: new Date(invoice.period_start * 1000),
        end: new Date(invoice.period_end * 1000),
      },
    });

    // Retry logic per trovare la subscription
    let subscription = null;
    let retryCount = 0;
    const maxRetries = 7;
    const retryDelay = 2000; // 2 secondi

    while (!subscription && retryCount < maxRetries) {
      const { data: sub, error: subError } = await supabase.from('subscriptions').select('pid').eq('customer_id', invoice.customer).maybeSingle();

      if (subError && subError.code !== 'PGRST116') {
        console.error('❌ Errore nel trovare la subscription:', subError);
        return;
      }

      if (sub) {
        subscription = sub;
        break;
      }

      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`⏳ Subscription non trovata, retry ${retryCount}/${maxRetries} in ${retryDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    if (!subscription) {
      console.error('❌ Nessuna subscription trovata dopo tutti i retry per customer:', invoice.customer);

      // Salva il webhook per un retry successivo
      const retryKey = `${invoice.id}_${Date.now()}`;
      failedWebhooks.set(retryKey, {
        invoice,
        attempts: 0,
        lastAttempt: Date.now(),
        type: 'recurring_payment',
      });

      console.log('📝 Webhook salvato per retry successivo:', retryKey);
      return;
    }

    // Aggiorna la subscription
    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan: 'pro',
        last_payment_date: new Date().toISOString(),
        current_period_end: new Date(invoice.period_end * 1000).toISOString(),
        subscription_status: 'active',
        suspended_at: null,
        suspension_reason: null,
      })
      .eq('customer_id', invoice.customer);

    if (error) {
      console.error('❌ Errore aggiornamento subscription dopo pagamento ricorrente:', error);
    } else {
      console.log('✅ Subscription aggiornata con successo dopo pagamento ricorrente');
    }
  } catch (error) {
    console.error('❌ Errore nel processare il pagamento ricorrente:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    const currentPeriodEnd =
      typeof subscription.current_period_end === 'number' && subscription.current_period_end > 0
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;

    console.log('📝 Nuovo abbonamento:', {
      id: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      currentPeriodEnd,
    });

    // Trova il profilo tramite customer_id
    const { data: existingSub, error: findError } = await supabase
      .from('subscriptions')
      .select('pid')
      .eq('customer_id', subscription.customer)
      .maybeSingle();

    if (findError && findError.code !== 'PGRST116') {
      console.error('❌ Errore nel cercare subscription esistente:', findError);
      return;
    }

    if (existingSub) {
      const updateData = {
        stripe_id: subscription.id,
        subscription_status: subscription.status,
        plan: subscription.status === 'active' ? 'pro' : 'free',
      };

      // Aggiungi current_period_end solo se è valido
      if (typeof subscription.current_period_end === 'number' && subscription.current_period_end > 0) {
        updateData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
      }

      const { error } = await supabase.from('subscriptions').update(updateData).eq('customer_id', subscription.customer);

      if (error) {
        console.error('❌ Errore aggiornamento subscription:', error);
      }
    } else {
      console.log('⚠️ Nessuna subscription trovata per customer:', subscription.customer);
    }
  } catch (e) {
    console.error(e);
  }
}

async function handleSubscriptionUpdated(subscription) {
  if (!subscription || !subscription.id) {
    console.error('❌ Subscription non valida:', subscription);
    return;
  }

  try {
    console.log('🔄 Abbonamento aggiornato:', {
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    const updateData = {
      plan: subscription.status === 'active' && !subscription.cancel_at_period_end ? 'pro' : 'free',
      subscription_status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      ...(subscription.current_period_end > 0 && {
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      }),
    };

    const { error } = await supabase.from('subscriptions').update(updateData).eq('stripe_id', subscription.id);

    if (error) {
      console.error('❌ Errore durante aggiornamento della subscription:', error);
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
      canceledAt: new Date(subscription.canceled_at * 1000).toISOString(),
    });

    // Trova la subscription tramite customer_id
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscriptions')
      .select('pid')
      .eq('customer_id', subscription.customer)
      .single();

    if (subError || !subscriptionData) {
      console.error('❌ Nessuna subscription trovata per customerId:', subscription.customer);
      return;
    }

    // Recupera i dati del profilo
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('uid, first_name, last_name')
      .eq('id', subscriptionData.pid)
      .maybeSingle();

    if (profileError || !profileData) {
      console.error('❌ Errore nel recuperare i dati del profilo:', profileError);
      return;
    }

    // Recupera l'email dalla tabella auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profileData.uid);

    if (userError) {
      console.error('❌ Errore nel recuperare i dati utente:', userError);
      return;
    }

    const userEmail = userData?.user?.email;

    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan: 'free',
        subscription_status: 'canceled',
        stripe_id: null,
        canceled_at: new Date(subscription.canceled_at * 1000).toISOString(),
      })
      .eq('customer_id', subscription.customer);

    if (error) {
      console.error('Errore aggiornamento subscription:', error);
    } else {
      console.log('✅ Subscription cancellata con successo');

      // Invia email di abbonamento terminato
      if (userEmail) {
        const userName = profileData.first_name || userEmail;
        await sendSubscriptionEndedEmail(userEmail, userName);
      }
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

    if (invoice.attempt_count >= 3) {
      // Logica aggiuntiva per sospensioni definitive
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
      newStatus: invoice.status,
    });

    if (invoice.status === 'draft') {
      await suspendUserProfile(invoice.customer, 'draft_payment');
    } else if (invoice.status === 'paid') {
      await reactivateUserProfile(invoice.customer);
    }
  } catch (error) {
    console.error('❌ Errore nel gestire cambio status fattura:', error);
  }
}

async function suspendUserProfile(customerId, reason = 'payment_issue') {
  try {
    console.log(`🚫 Sospensione profilo per customer: ${customerId}, motivo: ${reason}`);

    // Trova la subscription tramite customer_id
    const { data: subscription, error: subError } = await supabase.from('subscriptions').select('pid').eq('customer_id', customerId).single();

    if (subError || !subscription) {
      console.error('❌ Nessuna subscription trovata per customerId:', customerId);
      return;
    }

    // Recupera i dati del profilo
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('uid, first_name, last_name')
      .eq('id', subscription.pid)
      .maybeSingle();

    if (profileError || !profileData) {
      console.error('❌ Errore nel recuperare i dati del profilo:', profileError);
      return;
    }

    // Recupera l'email dalla tabella auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profileData.uid);

    if (userError) {
      console.error('❌ Errore nel recuperare i dati utente:', userError);
      return;
    }

    const userEmail = userData?.user?.email;

    // Aggiorna la subscription
    const { error } = await supabase
      .from('subscriptions')
      .update({
        subscription_status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspension_reason: reason,
      })
      .eq('customer_id', customerId);

    if (error) {
      console.error('❌ Errore sospensione subscription:', error);
    } else {
      console.log('✅ Subscription sospesa con successo');

      if (userEmail) {
        const userName = profileData.first_name || userEmail;
        await sendSuspensionEmail(userEmail, userName, reason);
      }
    }
  } catch (error) {
    console.error('❌ Errore nel sospendere il profilo:', error);
  }
}

async function reactivateUserProfile(customerId) {
  try {
    console.log(`🔓 Riattivazione profilo per customer: ${customerId}`);

    // Trova la subscription tramite customer_id
    const { data: subscription, error: subError } = await supabase.from('subscriptions').select('pid').eq('customer_id', customerId).single();

    if (subError || !subscription) {
      console.error('❌ Nessuna subscription trovata per customerId:', customerId);
      return;
    }

    // Recupera i dati del profilo
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('uid, first_name, last_name')
      .eq('id', subscription.pid)
      .maybeSingle();

    if (profileError || !profileData) {
      console.error('❌ Errore nel recuperare i dati del profilo:', profileError);
      return;
    }

    // Recupera l'email dalla tabella auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profileData.uid);

    if (userError) {
      console.error('❌ Errore nel recuperare i dati utente:', userError);
      return;
    }

    const userEmail = userData?.user?.email;

    const { error } = await supabase
      .from('subscriptions')
      .update({
        subscription_status: 'active',
        suspended_at: null,
        suspension_reason: null,
      })
      .eq('customer_id', customerId);

    if (error) {
      console.error('❌ Errore riattivazione subscription:', error);
    } else {
      console.log('✅ Subscription riattivata con successo');

      // Invia email di riattivazione
      if (userEmail) {
        const userName = profileData.first_name || userEmail;
        await sendReactivationEmail(userEmail, userName);
      }
    }
  } catch (error) {
    console.error('❌ Errore nel riattivare il profilo:', error);
  }
}

async function saveStripeEvent(event) {
  let pid = null;

  const customerId = extractCustomerIdFromEvent(event);
  console.log(`🔍 Debug - Event: ${event.type}, Customer ID estratto: ${customerId || 'N/A'}`);

  if (customerId) {
    try {
      const { data: subscription, error } = await supabase.from('subscriptions').select('pid').eq('customer_id', customerId).maybeSingle();

      console.log(`🔍 Debug - Query subscription per customer ${customerId}:`, { subscription, error });

      if (!error && subscription) {
        pid = subscription.pid;
        console.log(`✅ PID trovato: ${pid}`);
      } else {
        console.log(`⚠️ Nessuna subscription trovata per customer: ${customerId}`);
        // Aggiungi l'evento a una coda per aggiornare il pid in seguito
        queuePidUpdate(event.id, customerId);
      }
    } catch (error) {
      console.error('❌ Errore nel recuperare pid per evento:', error);
    }
  } else {
    console.log(`⚠️ Nessun customer_id estratto dall'evento ${event.type}`);
  }

  const { error: eventError } = await supabase.from('stripe_events').upsert(
    {
      event_id: event.id,
      type: event.type,
      data: event.data,
      pid: pid,
      processed: false,
      received_at: new Date().toISOString(),
    },
    {
      onConflict: 'event_id',
      ignoreDuplicates: false,
    }
  );

  if (eventError) {
    console.error('❌ Errore nel salvare evento:', eventError);
    throw eventError;
  }

  return { pid };
}

// Funzioni helper per tradurre i motivi di sospensione
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
  try {
    console.log(`🔓 Attivazione accesso per customer: ${customerId}`);

    const { data: existingSubscription, error: searchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('customer_id', customerId)
      .maybeSingle();

    console.log('🔍 Risultato ricerca:', { existingSubscription, searchError });

    if (existingSubscription) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          stripe_id: subscriptionId,
          plan: 'pro',
          subscription_status: 'active',
          last_payment_date: new Date().toISOString(),
        })
        .eq('customer_id', customerId);

      if (updateError) {
        console.error('❌ Errore aggiornamento subscription:', updateError);
      } else {
        console.log('✅ Subscription aggiornata con successo');
      }
    } else {
      console.error('❌ Nessuna subscription trovata per customerId:', customerId);
    }
  } catch (error) {
    console.error("❌ Errore nell'attivare la subscription:", error);
  }
}

// Funzione per processare gli aggiornamenti del pid
async function processPidUpdates() {
  for (const [eventId, { customerId, attempts, maxAttempts }] of pidUpdateQueue.entries()) {
    if (attempts >= maxAttempts) {
      console.log(`⚠️ Raggiunto numero massimo di tentativi per evento ${eventId}`);
      pidUpdateQueue.delete(eventId);
      continue;
    }

    try {
      const { data: subscription, error } = await supabase.from('subscriptions').select('pid').eq('customer_id', customerId).maybeSingle();

      if (!error && subscription) {
        // Aggiorna l'evento con il pid trovato
        const { error: updateError } = await supabase.from('stripe_events').update({ pid: subscription.pid }).eq('event_id', eventId);

        if (!updateError) {
          console.log(`✅ PID aggiornato per evento ${eventId}: ${subscription.pid}`);
          pidUpdateQueue.delete(eventId);
        } else {
          console.error(`❌ Errore nell'aggiornare pid per evento ${eventId}:`, updateError);
        }
      } else {
        // Incrementa i tentativi
        pidUpdateQueue.set(eventId, { customerId, attempts: attempts + 1, maxAttempts });
        console.log(`⏳ Tentativo ${attempts + 1}/${maxAttempts} per evento ${eventId}`);
      }
    } catch (error) {
      console.error(`❌ Errore nel processare aggiornamento pid per evento ${eventId}:`, error);
    }
  }
}

setInterval(processPidUpdates, 10000);

function extractCustomerIdFromEvent(event) {
  const eventData = event.data.object;

  // Diversi tipi di eventi hanno il customer_id in posizioni diverse
  if (eventData.customer) {
    return eventData.customer;
  }

  if (eventData.customer_details?.customer) {
    return eventData.customer_details.customer;
  }

  if (event.type.startsWith('customer.') && eventData.id) {
    return eventData.id;
  }

  // Per eventi di subscription
  if (event.type.startsWith('customer.subscription.') && eventData.customer) {
    return eventData.customer;
  }

  // Per eventi di invoice
  if (event.type.startsWith('invoice.') && eventData.customer) {
    return eventData.customer;
  }

  // Per eventi di checkout session
  if (event.type === 'checkout.session.completed' && eventData.customer) {
    return eventData.customer;
  }

  return null;
}

function queuePidUpdate(eventId, customerId) {
  pidUpdateQueue.set(eventId, { customerId, attempts: 0, maxAttempts: 7 });
}

// Email functions
async function sendSuspensionEmail(userEmail, userName, reason) {
  try {
    console.log(`📧 Invio email di sospensione a: ${userEmail}`);

    // Leggi il template HTML
    const templatePath = path.join(process.cwd(), 'emails', 'profile-suspended.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Sostituisci i placeholder nel template
    const suspensionReasonText = getSuspensionReasonText(reason);
    htmlTemplate = htmlTemplate.replace(/{{userName}}/g, userName).replace(/{{suspensionReason}}/g, suspensionReasonText);

    // Invia l'email tramite Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_EMAIL_FROM,
      to: [userEmail],
      subject: 'Account Qrea Sospeso - Azione Richiesta',
      html: htmlTemplate,
    });

    if (error) {
      console.error("❌ Errore nell'invio email di sospensione:", error);
      throw error;
    }

    console.log('✅ Email di sospensione inviata con successo:', data.id);
    return data;
  } catch (error) {
    console.error("❌ Errore nell'invio email di sospensione:", error);
    throw error;
  }
}

async function sendReactivationEmail(userEmail, userName) {
  try {
    console.log(`📧 Invio email di riattivazione a: ${userEmail}`);

    // Leggi il template HTML
    const templatePath = path.join(process.cwd(), 'emails', 'profile-reactivated.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Sostituisci i placeholder
    htmlTemplate = htmlTemplate.replace(/{{userName}}/g, userName);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_EMAIL_FROM,
      to: [userEmail],
      subject: 'Account Qrea Riattivato',
      html: htmlTemplate,
    });

    if (error) {
      console.error('❌ Errore invio email riattivazione:', error);
      return { success: false, error };
    }

    console.log('✅ Email di riattivazione inviata con successo:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Errore nell'invio email di riattivazione:", error);
    return { success: false, error: error.message };
  }
}

async function sendSubscriptionEndedEmail(userEmail, userName) {
  try {
    console.log(`📧 Invio email abbonamento terminato a: ${userEmail}`);

    // Leggi il template HTML
    const templatePath = path.join(process.cwd(), 'emails', 'subscription-ended.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Sostituisci i placeholder
    htmlTemplate = htmlTemplate.replace(/{{userName}}/g, userName);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_EMAIL_FROM,
      to: [userEmail],
      subject: 'Abbonamento Pro Terminato',
      html: htmlTemplate,
    });

    if (error) {
      console.error('❌ Errore invio email abbonamento terminato:', error);
      return { success: false, error };
    }

    console.log('✅ Email abbonamento terminato inviata con successo:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Errore nell'invio email abbonamento terminato:", error);
    return { success: false, error: error.message };
  }
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

// app.post('/api/stripe-customer', async (req, res) => {
//   try {
//     const { email, stripeId } = req.body;
//     console.log('email:', email);
//     console.log('stripe_id:', stripeId);

//     currentStripeId = stripeId;
//     currentProfileEmail = email;

//     res.json({
//       success: true,
//       message: 'Dati ricevuti e loggati con successo',
//       received: req.body,
//     });
//   } catch (error) {
//     console.error('❌ Errore nel ricevere i dati:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

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
