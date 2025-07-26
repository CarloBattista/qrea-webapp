import { reactive } from 'vue';

export const store = reactive({
  plans: [
    {
      value: 'free',
      name: 'Free',
      descriptions: {
        monthly: 'per month, no credit card required',
        yearly: 'per month, no credit card required',
      },
      prices: {
        monthly: 0,
        yearly: 0,
      },
      stripe_products_id: {
        monthly: null,
        yearly: null,
      },
      features: ['First', 'Two', 'Three'],
    },
    {
      value: 'pro',
      name: 'Pro',
      descriptions: {
        monthly: 'per month, billed monthly',
        yearly: 'per month, billed yearly',
      },
      prices: {
        monthly: 10,
        yearly: 7.5,
      },
      stripe_products_id: {
        monthly: import.meta.env.VITE_STRIPE_PLAN_PRO_MONTHLY_PRICE_ID,
        yearly: import.meta.env.VITE_STRIPE_PLAN_PRO_YEARLY_PRICE_ID,
      },
      features: ['First', 'Two', 'Three'],
    },
  ],
});
