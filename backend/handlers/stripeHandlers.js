import Stripe from 'stripe';
import { supabase } from '../supabase.js';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import process from 'process';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// Variabili per la gestione dei retry
const failedWebhooks = new Map();
const pidUpdateQueue = new Map();

// Funzioni principali per gestire gli eventi webhook
export async function handleSuccessfulPayment(session, eventId) {
  try {
    let sessionId;

    if (typeof session === 'string') {
      sessionId = session;
    } else if (session && session.id) {
      sessionId = session.id;
    } else {
      console.error('❌ Oggetto sessione non valido:', session);
      throw new Error('Oggetto sessione non valido');
    }

    console.log('🔍 Recupero sessione Stripe:', sessionId);

    const fullSession = await stripe.checkout.sessions.retrieve(sessionId, {
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

    console.log('💰 Dettagli pagamento:', paymentDetails);

    // Attiva l'accesso dell'utente se è un abbonamento
    if (fullSession.mode === 'subscription' && fullSession.subscription) {
      const customerId = typeof fullSession.customer === 'string' ? fullSession.customer : fullSession.customer.id;
      const subscriptionId = typeof fullSession.subscription === 'string' ? fullSession.subscription : fullSession.subscription.id;

      await activateUserSubscription(customerId, subscriptionId);
    }

    // Invia email di conferma pagamento
    if (paymentDetails.customerEmail) {
      try {
        // Recupera il nome utente dal database
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('stripe_id', paymentDetails.customerId)
          .single();

        const userName = profileData && !profileError ? `${profileData.first_name} ${profileData.last_name}`.trim() : 'Cliente';

        await sendPaymentSuccessEmail(paymentDetails.customerEmail, userName, paymentDetails);
      } catch (emailError) {
        console.error('❌ Errore invio email conferma pagamento:', emailError);
      }
    }
  } catch (error) {
    console.error('❌ Errore nel processare il pagamento:', error);
    throw error;
  }
}

export async function handleRecurringPayment(invoice, eventId) {
  try {
    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
    const customerId = invoice.customer;

    console.log('💰 Pagamento ricorrente riuscito:', invoice.id);
    console.log('💰 Pagamento ricorrente per:', {
      customerId,
      subscriptionId,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      period: {
        start: new Date(invoice.period_start * 1000),
        end: new Date(invoice.period_end * 1000),
      },
    });

    let subscription = null;
    if (subscriptionId) {
      const { data, error } = await supabase.from('subscriptions').select('*').eq('stripe_id', subscriptionId).maybeSingle();

      if (!error && data) {
        subscription = data;
        console.log(`✅ Subscription trovata tramite stripe_id: ${subscriptionId}`);
      }
    }

    // Se non trovata, cerca per customer_id
    if (!subscription && customerId) {
      const { data, error } = await supabase.from('subscriptions').select('*').eq('customer_id', customerId).maybeSingle();

      if (!error && data) {
        subscription = data;
        console.log(`✅ Subscription trovata tramite customer_id: ${customerId}`);
      }
    }

    if (!subscription) {
      console.log(`⚠️ Subscription non trovata per customer: ${customerId}, subscription: ${subscriptionId}`);
      console.log(`⚠️ Questo potrebbe essere normale se la subscription non è ancora stata creata`);

      // Non lanciare errore per evitare retry infiniti
      // Invece, logga e continua
      return;
    }

    // Aggiorna last_payment_date
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        last_payment_date: new Date().toISOString(),
        status: 'active',
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error("❌ Errore nell'aggiornare la subscription:", updateError);
      throw updateError; // Questo causerà un retry
    }

    console.log(`✅ Subscription aggiornata per customer: ${customerId}`);
  } catch (error) {
    console.error('❌ Errore nel processare il pagamento ricorrente:', error);
    throw error; // Importante: rilancia l'errore per far fallire il job e attivare il retry di BullMQ
  }
}

export async function handleSubscriptionCreated(subscription, eventId) {
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
    throw e;
  }
}

export async function handleSubscriptionUpdated(subscription, eventId) {
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
    throw e;
  }
}

export async function handleSubscriptionCanceled(subscription, eventId) {
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
    throw e;
  }
}

export async function handleFailedPayment(invoice, eventId) {
  try {
    console.log('⚠️ Pagamento fallito:', {
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_due,
      attemptCount: invoice.attempt_count,
    });

    await suspendUserProfile(invoice.customer, 'payment_failed');

    try {
      // Recupera l'email del cliente da Stripe
      const customer = await stripe.customers.retrieve(invoice.customer);

      if (customer.email) {
        // Recupera il nome utente dal database
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('stripe_id', invoice.customer)
          .single();

        const userName = profileData && !profileError ? `${profileData.first_name} ${profileData.last_name}`.trim() : 'Cliente';

        const paymentDetails = {
          amount: invoice.amount_due,
          currency: invoice.currency,
          attemptCount: invoice.attempt_count,
        };

        await sendPaymentFailedEmail(customer.email, userName, paymentDetails);
      }
    } catch (emailError) {
      console.error('❌ Errore invio email pagamento fallito:', emailError);
    }

    if (invoice.attempt_count >= 3) {
      // Logica aggiuntiva per sospensioni definitive
      console.log('⚠️ Raggiunto numero massimo di tentativi per:', invoice.customer);
    }
  } catch (error) {
    console.error('❌ Errore nel gestire il pagamento fallito:', error);
    throw error;
  }
}

export async function handleDraftInvoice(invoice, eventId) {
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
    throw error;
  }
}

export async function handleInvoiceStatusChange(invoice, eventId) {
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
    throw error;
  }
}

// Funzioni helper
export async function suspendUserProfile(customerId, reason = 'payment_issue') {
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
    throw error;
  }
}

export async function reactivateUserProfile(customerId) {
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
    throw error;
  }
}

export async function saveStripeEvent(event) {
  let pid = null;
  let shouldQueue = false;

  const customerId = extractCustomerIdFromEvent(event);
  const subscriptionId = extractSubscriptionIdFromEvent(event);

  // Prova prima con stripe_id se disponibile
  if (subscriptionId) {
    try {
      const { data: subscription, error } = await supabase.from('subscriptions').select('pid').eq('stripe_id', subscriptionId).maybeSingle();

      console.log(`🔍 Debug - Query subscription per stripe_id ${subscriptionId}:`, { subscription, error });

      if (!error && subscription) {
        pid = subscription.pid;
        console.log(`✅ PID trovato tramite stripe_id: ${pid}`);
      }
    } catch (error) {
      console.error('❌ Errore nel recuperare pid tramite stripe_id:', error);
    }
  }

  // Se non trovato tramite stripe_id, prova con customer_id
  if (!pid && customerId) {
    try {
      const { data: subscription, error } = await supabase.from('subscriptions').select('pid').eq('customer_id', customerId).maybeSingle();

      console.log(`🔍 Debug - Query subscription per customer_id ${customerId}:`, { subscription, error });

      if (!error && subscription) {
        pid = subscription.pid;
        console.log(`✅ PID trovato tramite customer_id: ${pid}`);
      } else {
        console.log(`⚠️ Nessuna subscription trovata per customer: ${customerId}`);
        shouldQueue = true;
      }
    } catch (error) {
      console.error('❌ Errore nel recuperare pid per customer_id:', error);
      shouldQueue = true;
    }
  }

  // Se non troviamo il pid, verifica se è un evento di checkout completato
  if (!pid && event.type === 'checkout.session.completed') {
    console.log('🔄 Evento checkout senza subscription esistente - normale durante primo pagamento');
    shouldQueue = true;
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

  // Aggiungi alla coda solo se abbiamo un customer_id ma non un pid
  if (shouldQueue && customerId) {
    queuePidUpdate(event.id, customerId);
  }

  return { pid, customerId, subscriptionId, queued: shouldQueue };
}

export function extractSubscriptionIdFromEvent(event) {
  const eventData = event.data.object;

  console.log(`🔍 Debug extractSubscriptionIdFromEvent - Event type: ${event.type}`);

  // Per eventi di subscription diretti
  if (event.type.startsWith('customer.subscription.') && eventData.id) {
    console.log(`✅ Subscription ID trovato in eventData.id: ${eventData.id}`);
    return eventData.id;
  }

  // Per eventi di invoice
  if (event.type.startsWith('invoice.') && eventData.subscription) {
    console.log(`✅ Subscription ID trovato in eventData.subscription: ${eventData.subscription}`);
    return eventData.subscription;
  }

  // Per eventi con parent.subscription_details
  if (eventData.parent?.subscription_details?.subscription) {
    console.log(`✅ Subscription ID trovato in parent.subscription_details: ${eventData.parent.subscription_details.subscription}`);
    return eventData.parent.subscription_details.subscription;
  }

  // Per eventi di checkout session
  if (event.type === 'checkout.session.completed' && eventData.subscription) {
    console.log(`✅ Subscription ID trovato in checkout session: ${eventData.subscription}`);
    return eventData.subscription;
  }

  // Per line items con subscription
  if (eventData.lines?.data) {
    for (const line of eventData.lines.data) {
      if (line.parent?.subscription_item_details?.subscription) {
        console.log(`✅ Subscription ID trovato in line item: ${line.parent.subscription_item_details.subscription}`);
        return line.parent.subscription_item_details.subscription;
      }
    }
  }

  console.log(`⚠️ Nessun Subscription ID trovato per evento ${event.type}`);
  return null;
}

export async function activateUserSubscription(customerId, subscriptionId) {
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
    throw error;
  }
}

export function extractCustomerIdFromEvent(event) {
  const eventData = event.data.object;

  // Diversi tipi di eventi hanno il customer_id in posizioni diverse
  if (eventData.customer) {
    console.log(`✅ Customer ID trovato in eventData.customer: ${eventData.customer}`);
    return eventData.customer;
  }

  if (eventData.customer_details?.customer) {
    console.log(`✅ Customer ID trovato in eventData.customer_details.customer: ${eventData.customer_details.customer}`);
    return eventData.customer_details.customer;
  }

  if (event.type.startsWith('customer.') && eventData.id) {
    console.log(`✅ Customer ID trovato in eventData.id per evento customer: ${eventData.id}`);
    return eventData.id;
  }

  // Per eventi di subscription
  if (event.type.startsWith('customer.subscription.') && eventData.customer) {
    console.log(`✅ Customer ID trovato per subscription event: ${eventData.customer}`);
    return eventData.customer;
  }

  // Per eventi di invoice
  if (event.type.startsWith('invoice.') && eventData.customer) {
    console.log(`✅ Customer ID trovato per invoice event: ${eventData.customer}`);
    return eventData.customer;
  }

  // Per eventi di checkout session
  if (event.type === 'checkout.session.completed' && eventData.customer) {
    console.log(`✅ Customer ID trovato per checkout session: ${eventData.customer}`);
    return eventData.customer;
  }

  // Aggiungi più casi specifici
  if (event.type.startsWith('payment_intent.') && eventData.customer) {
    console.log(`✅ Customer ID trovato per payment_intent: ${eventData.customer}`);
    return eventData.customer;
  }

  if (event.type.startsWith('setup_intent.') && eventData.customer) {
    console.log(`✅ Customer ID trovato per setup_intent: ${eventData.customer}`);
    return eventData.customer;
  }

  console.log(`⚠️ Nessun Customer ID trovato per evento ${event.type}`);
  return null;
}

export function queuePidUpdate(eventId, customerId) {
  pidUpdateQueue.set(eventId, { customerId, attempts: 0, maxAttempts: 7 });
}

export async function processPidUpdates() {
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

export async function processFailedWebhooks() {
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

// Funzioni helper per tradurre i motivi di sospensione
export function getSuspensionReasonText(reason) {
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

// Funzioni email
export async function sendSuspensionEmail(userEmail, userName, reason) {
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

export async function sendReactivationEmail(userEmail, userName) {
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

export async function sendSubscriptionEndedEmail(userEmail, userName) {
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

export async function sendPaymentSuccessEmail(userEmail, userName, paymentDetails) {
  try {
    console.log(`📧 Invio email conferma pagamento a: ${userEmail}`);

    const templatePath = path.join(process.cwd(), 'emails', 'payment-success.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Formatta l'importo
    const formattedAmount = (paymentDetails.amount / 100).toFixed(2);
    const formattedCurrency = paymentDetails.currency.toUpperCase();
    const paymentDate = new Date().toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Sostituisci i placeholder nel template
    htmlTemplate = htmlTemplate
      .replace(/{{userName}}/g, userName)
      .replace(/{{amount}}/g, formattedAmount)
      .replace(/{{currency}}/g, formattedCurrency)
      .replace(/{{paymentDate}}/g, paymentDate);

    // Invia l'email tramite Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_EMAIL_FROM,
      to: [userEmail],
      subject: 'Pagamento Confermato - Qrea',
      html: htmlTemplate,
    });

    if (error) {
      console.error('❌ Errore invio email conferma pagamento:', error);
      return { success: false, error };
    }

    console.log('✅ Email conferma pagamento inviata con successo:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Errore nell'invio email conferma pagamento:", error);
    return { success: false, error: error.message };
  }
}

export async function sendPaymentFailedEmail(userEmail, userName, paymentDetails) {
  try {
    console.log(`📧 Invio email pagamento fallito a: ${userEmail}`);

    // Leggi il template HTML
    const templatePath = path.join(process.cwd(), 'emails', 'payment-failed.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Formatta l'importo
    const formattedAmount = (paymentDetails.amount / 100).toFixed(2);
    const formattedCurrency = paymentDetails.currency.toUpperCase();
    const failureDate = new Date().toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Sostituisci i placeholder nel template
    htmlTemplate = htmlTemplate
      .replace(/{{userName}}/g, userName)
      .replace(/{{amount}}/g, formattedAmount)
      .replace(/{{currency}}/g, formattedCurrency)
      .replace(/{{attemptCount}}/g, paymentDetails.attemptCount || 1)
      .replace(/{{failureDate}}/g, failureDate);

    // Invia l'email tramite Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_EMAIL_FROM,
      to: [userEmail],
      subject: 'Pagamento Non Riuscito - Qrea',
      html: htmlTemplate,
    });

    if (error) {
      console.error('❌ Errore invio email pagamento fallito:', error);
      return { success: false, error };
    }

    console.log('✅ Email pagamento fallito inviata con successo:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Errore nell'invio email pagamento fallito:", error);
    return { success: false, error: error.message };
  }
}
