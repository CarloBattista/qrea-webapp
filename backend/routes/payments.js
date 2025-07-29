import express from 'express';
import Stripe from 'stripe';
import process from 'process';

const router = express.Router();

// Funzione helper per ottenere l'istanza di Stripe
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY non configurata');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// Crea una sessione di checkout
router.post('/create-checkout-session', async (req, res) => {
  try {
    const stripe = getStripe();
    const { priceId, successUrl, cancelUrl } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Errore nella creazione della sessione:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verifica lo stato di una sessione
router.get('/verify-session/:sessionId', async (req, res) => {
  try {
    const stripe = getStripe();
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription'],
    });

    res.json({
      status: session.payment_status,
      customerEmail: session.customer_details?.email,
      subscriptionId: session.subscription?.id,
      session: session,
    });
  } catch (error) {
    console.error('Errore nella verifica della sessione:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ottieni dettagli di un payment intent
router.get('/payment-intent/:paymentIntentId', async (req, res) => {
  try {
    const stripe = getStripe();
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json(paymentIntent);
  } catch (error) {
    console.error('Errore nel recupero del payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ottieni cronologia pagamenti per un customer
router.get('/billing-history/:customerId', async (req, res) => {
  try {
    const stripe = getStripe();
    const { customerId } = req.params;

    // Recupera le fatture del customer
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10, // Limita a 10 fatture più recenti
      expand: ['data.subscription', 'data.payment_intent'],
    });

    // Formatta i dati per il frontend
    const billingHistory = invoices.data.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount_paid / 100, // Converti da centesimi
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      date: invoice.created,
      description: invoice.lines.data[0]?.description || 'Pro plan',
      invoice_pdf: invoice.invoice_pdf,
      period_start: invoice.period_start,
      period_end: invoice.period_end,
    }));

    res.json(billingHistory);
  } catch (error) {
    console.error('Errore nel recupero della cronologia pagamenti:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ottieni informazioni sul prossimo pagamento
router.get('/upcoming-invoice/:customerId', async (req, res) => {
  try {
    const stripe = getStripe();
    const { customerId } = req.params;

    // Ottieni le sottoscrizioni attive del cliente
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
      expand: ['data.items.data.price'], // Espandi i dettagli del prezzo
    });

    if (subscriptions.data.length === 0) {
      return res.json(null);
    }

    const subscription = subscriptions.data[0];

    // Verifica che ci siano items e prezzi
    if (!subscription.items || !subscription.items.data || subscription.items.data.length === 0) {
      return res.json(null);
    }

    const firstItem = subscription.items.data[0];

    // Usa current_period_end dall'item della sottoscrizione, non dalla sottoscrizione principale
    if (!firstItem.current_period_end) {
      return res.json(null);
    }

    if (!firstItem.price) {
      return res.json(null);
    }

    const price = firstItem.price;

    const nextPayment = {
      date: new Date(firstItem.current_period_end * 1000).toISOString(),
      amount: (price.unit_amount || 0) / 100,
      currency: (price.currency || 'eur').toUpperCase(),
    };

    res.json(nextPayment);
  } catch (error) {
    console.error('Errore nel recupero del prossimo pagamento:', error);
    res.status(500).json({
      error: 'Errore nel recupero del prossimo pagamento',
      details: error.message,
    });
  }
});

// Completa manualmente una fattura in stato draft
router.post('/complete-invoice/:invoiceId', async (req, res) => {
  try {
    const stripe = getStripe();
    const { invoiceId } = req.params;

    // Prima recupera la fattura per verificare lo stato
    const invoice = await stripe.invoices.retrieve(invoiceId);

    // Verifica se la fattura è già stata pagata
    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'La fattura è già stata pagata',
        invoice: invoice,
      });
    }

    // Verifica se la fattura è in uno stato che può essere completata
    if (invoice.status !== 'draft' && invoice.status !== 'open') {
      return res.status(400).json({
        success: false,
        error: `Impossibile completare la fattura. Stato attuale: ${invoice.status}`,
        invoice: invoice,
      });
    }

    let finalizedInvoice = invoice;

    // Finalizza solo se è in stato draft
    if (invoice.status === 'draft') {
      finalizedInvoice = await stripe.invoices.finalizeInvoice(invoiceId);
    }

    // Paga la fattura
    const paidInvoice = await stripe.invoices.pay(invoiceId);

    res.json({
      success: true,
      invoice: paidInvoice,
      message: 'Fattura completata con successo',
    });
  } catch (error) {
    console.error('Errore nel completamento della fattura:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
