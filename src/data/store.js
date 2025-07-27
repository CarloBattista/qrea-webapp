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
  qrCodes: {
    data: null,
    error: null,
    loading: false,
  },

  planConfig: {
    can_create_qr: true,
    qr_limit: 0,
    free_plan_limit_create_qr: 2,
    pro_plan_limit_create_qr: 20,
  },

  qrConfig: {
    value: '',
    qrSize: 300,
    background: '#ffffff',
    foreground: '#000000',
    margin: 10,
    dotsStyle: 'square',
    cornerStyle: 'square',
    gradient: false,
    gradientStartColor: '#000000',
    gradientEndColor: '#38bdf8',
    gradientRotation: 0,
    showImage: false,
    imageSize: 40,
    imageSettings: {
      src: '',
    },
    qrCode: null,

    dotStyles: [
      { label: 'Quadrato', value: 'square' },
      { label: 'Arrotondato', value: 'rounded' },
      { label: 'Punti', value: 'dots' },
      { label: 'Elegante', value: 'classy' },
      { label: 'Extra Arrotondato', value: 'extra-rounded' },
    ],
    cornerStyles: [
      { label: 'Quadrato', value: 'square' },
      { label: 'Punto', value: 'dot' },
      { label: 'Arrotondato', value: 'rounded' },
      { label: 'Extra Arrotondato', value: 'extra-rounded' },
    ],

    // Formati di download disponibili
    selectedFormat: 'png',
    downloadFormats: [
      { label: 'PNG', value: 'png' },
      { label: 'JPG', value: 'jpeg' },
      { label: 'SVG', value: 'svg' },
      { label: 'PDF', value: 'pdf' },
    ],
  },
});
