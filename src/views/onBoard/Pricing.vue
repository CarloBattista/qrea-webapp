<template>
  <div class="w-full py-15">
    <div class="w-full mb-15 flex flex-col gap-5 items-center justify-center text-center">
      <h1 class="text-black text-3xl font-bold">{{ $t('pricing.title') }}</h1>
      <p class="text-[#373737] text-base font-normal">{{ $t('pricing.subtitle') }}</p>
    </div>
    <div class="w-full mb-15 flex items-center justify-center">
      <div class="w-fit h-12 p-0.5 rounded-2xl flex items-center justify-center pr-shadow bg-[#373737]/20">
        <div
          @click="handlePlan('monthly')"
          class="min-w-[180px] h-full rounded-[15px] flex items-center justify-center text-base font-medium cursor-pointer"
          :class="{ 'bg-black text-white': currentPlan === 'monthly' }"
        >
          {{ $t('pricing.monthly') }}
        </div>
        <div
          @click="handlePlan('yearly')"
          class="min-w-[180px] h-full rounded-[15px] flex gap-2 items-center justify-center text-base font-medium cursor-pointer"
          :class="{ 'bg-black text-white': currentPlan === 'yearly' }"
        >
          {{ $t('pricing.yearly') }} <span class="text-xs font-medium">{{ $t('pricing.savePercent') }}</span>
        </div>
      </div>
    </div>
    <div class="max-w-[768px] mx-auto md:px-7 px-3 grid md:grid-cols-2 grid-cols-1 gap-5">
      <div
        v-for="(plan, planIndex) in store.plans"
        :key="planIndex"
        class="card-plan w-full py-[50px] px-8 rounded-4xl pr-shadow"
        :class="{ 'plan-free md:order-1 order-2': plan.value === 'free', 'plan-pro md:order-2 order-1': plan.value === 'pro' }"
      >
        <div class="w-full mb-10 flex flex-col">
          <h2 class="text-2xl font-semibold">{{ plan.name }}</h2>
          <p class="text-sm font-normal">{{ plan.description }}</p>
        </div>
        <div class="w-full mb-10 flex flex-col">
          <div class="flex items-baseline">
            <h2 class="text-3xl font-semibold">&euro;{{ plan.prices[currentPlan] }}</h2>
            <span v-if="false" class="text-xs font-normal">/month</span>
          </div>
          <span class="mt-1 text-xs font-normal">{{ currentPlan === 'yearly' ? $t('pricing.paidAnnually') : $t('pricing.paidMonthly') }} </span>
        </div>
        <div class="w-full flex flex-col gap-5">
          <buttonLg
            @click="handleSubscription(plan)"
            :variant="plan.value === 'free' ? 'secondary' : 'secondary-inverted'"
            leftIcon="ArrowRight"
            :label="getButtonLabel(plan)"
            :disabled="isButtonDisabled(plan)"
            class="w-full"
          />
          <div class="w-full flex flex-col gap-2.5">
            <h2 class="text-sm font-semibold">{{ $t('pricing.whatsIncluded') }}</h2>
            <div v-for="(feature, featureIndex) in plan.features" :key="featureIndex" class="w-full flex gap-1.5 items-center text-xs font-normal">
              <Check size="14" />
              <span>{{ feature }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from '../../data/auth';
import { store } from '../../data/store';
// import { stripePromise } from '../../lib/stripe';

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
    getButtonLabel(plan) {
      const profilePlan = this.auth.profile?.plan;

      if (plan.value === 'free') {
        // Se l'utente è già abbonato al piano Pro, mostra messaggio specifico
        if (profilePlan === 'pro') {
          return this.$t('pricing.alreadyPro');
        }
        return this.$t('pricing.upgradeToPro');
      }

      if (profilePlan === 'pro') {
        return this.$t('pricing.activePlan');
      }

      return this.$t('pricing.startToday');
    },
    isButtonDisabled(plan) {
      const profilePlan = this.auth.profile?.plan;

      if (plan.value === 'free') {
        return true;
      }

      // Disabilita il pulsante Pro se l'utente è già abbonato al piano Pro
      if (plan.value === 'pro' && profilePlan === 'pro') {
        return true;
      }

      return false;
    },

    async handleSubscription(plan) {
      const priceId = plan.stripe_products_id[this.currentPlan];
      const profilePlan = this.auth.profile.plan;

      if (profilePlan === 'pro') {
        return;
      }

      if (!this.auth.isAuthenticated) {
        this.$router.push({ name: 'signin' });
        return;
      }

      if (!priceId) {
        console.error('Price ID non trovato');
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/api/payments/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId: priceId,
            successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/cancel`,
          }),
        });

        if (!response.ok) {
          throw new Error(`Errore HTTP: ${response.status}`);
        }

        const { url } = await response.json();

        if (url) {
          // Reindirizza direttamente all'URL di Stripe
          window.location.href = url;
        } else {
          console.error('URL di checkout non ricevuto dal server');
        }
      } catch (e) {
        console.error(e);
      }
    },
  },
};
</script>

<style scoped>
.card-plan.plan-free {
  background-color: white;
  color: black;
}

.card-plan.plan-pro {
  background-color: black;
  color: white;
}
</style>
