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

export default router;
