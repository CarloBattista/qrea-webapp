<template>
  <div class="w-full">
    <div class="w-full my-15 flex flex-col gap-5 items-center justify-center text-center">
      <h1 class="text-black text-3xl font-bold">Pricing</h1>
      <p class="text-gray-400 text-base font-normal">Get started for Free. Upgrade to increase limits.</p>
    </div>
    <div class="w-full mb-15 flex items-center justify-center">
      <div class="w-fit h-12 p-1 rounded-2xl flex items-center justify-center bg-gray-200">
        <div
          @click="handlePlan('monthly')"
          class="min-w-[180px] h-full rounded-xl flex items-center justify-center text-black text-base font-medium cursor-pointer"
          :class="{ 'bg-gray-400': currentPlan === 'monthly' }"
        >
          Monthly
        </div>
        <div
          @click="handlePlan('yearly')"
          class="min-w-[180px] h-full rounded-xl flex gap-2 items-center justify-center text-black text-base font-medium cursor-pointer"
          :class="{ 'bg-gray-400': currentPlan === 'yearly' }"
        >
          Yearly <span class="text-xs font-medium">Save 25%</span>
        </div>
      </div>
    </div>
    <div class="max-w-[960px] mx-auto md:px-7 px-3 grid md:grid-cols-2 grid-cols-1 gap-5">
      <div v-for="(plan, planIndex) in store.plans" :key="planIndex" class="w-full py-9 px-6 rounded-2xl bg-gray-200">
        <div class="w-full flex flex-col gap-2">
          <h2 class="text-black text-xl font-semibold">{{ plan.name }}</h2>
          <h2 class="text-black text-2xl font-semibold">&dollar;{{ plan.prices[currentPlan] }}</h2>
          <p class="text-black text-base font-medium flex gap-1 items-center">
            <span v-if="currentPlan === 'yearly' && plan.value === 'pro'" class="text-xl font-semibold line-through opacity-60"
              >&dollar;{{ plan.prices.monthly }}</span
            >{{ plan.descriptions[currentPlan] }}
          </p>
        </div>
        <buttonLg
          @click="handleSubscription(plan)"
          variant="primary"
          :label="plan.value === 'free' ? 'Upgrade to Pro' : 'Get started'"
          :disabled="plan.value === 'free'"
          class="w-full mt-10"
        />
        <div class="w-full mt-4 flex flex-col">
          <span v-for="(feature, featureIndex) in plan.features" :key="featureIndex" class="w-full flex gap-1 items-center text-sm">
            <Check size="14" />
            {{ feature }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from '../../data/auth';
import { store } from '../../data/store';
import { stripePromise } from '../../lib/stripe';

import buttonLg from '../../components/button/button-lg.vue';

// ICONS
import { Check } from 'lucide-vue-next';

export default {
  name: 'Pricing',
  components: {
    buttonLg,

    // ICONS
    Check,
  },
  data() {
    return {
      auth,
      store,
      currentPlan: 'yearly',
    };
  },
  methods: {
    handlePlan(plan) {
      this.currentPlan = plan;
    },

    async handleSubscription(plan) {
      const stripe = await stripePromise;
      const priceId = plan.stripe_products_id[this.currentPlan];

      if (!priceId) {
        throw new Error('Price ID not found');
      }

      try {
        const { error } = await stripe.redirectToCheckout({
          lineItems: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing`,
        });

        if (error) {
          throw new Error(error.message);
        }
      } catch (e) {
        console.error(e);
      }
    },
  },
};
</script>

<style scoped></style>
