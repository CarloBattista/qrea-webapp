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

// IMPORTANTE: Le rotte specifiche devono venire PRIMA di quelle con parametri

// 1. Rotte specifiche (senza parametri)
router.get('/prices', async (req, res) => {
  try {
    const stripe = getStripe();
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    res.json(prices);
  } catch (error) {
    console.error('Errore nel recupero dei prezzi:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Rotte con parametri specifici (devono venire prima di quelle generiche)
router.post('/:subscriptionId/reactivate', async (req, res) => {
  try {
    const stripe = getStripe();
    const { subscriptionId } = req.params;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    res.json({
      message: 'Abbonamento riattivato',
      subscription: subscription,
    });
  } catch (error) {
    console.error("Errore nella riattivazione dell'abbonamento:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Rotte generiche con parametri (devono venire per ultime)
router.get('/:subscriptionId', async (req, res) => {
  try {
    const stripe = getStripe();
    const { subscriptionId } = req.params;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'items.data.price.product'],
    });

    res.json(subscription);
  } catch (error) {
    console.error("Errore nel recupero dell'abbonamento:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:subscriptionId', async (req, res) => {
  try {
    const stripe = getStripe();
    const { subscriptionId } = req.params;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({
      message: 'Abbonamento programmato per la cancellazione',
      subscription: subscription,
    });
  } catch (error) {
    console.error("Errore nella cancellazione dell'abbonamento:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
