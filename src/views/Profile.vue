<template>
  <navigation />
  <div class="w-full md:px-6 px-3 pt-30 pb-10">
    <div class="max-w-[550px] mx-auto">
      <div class="w-full flex flex-col gap-2">
        <h2 class="text-black text-2xl font-semibold">Profile and settings</h2>
        <p class="text-black text-base font-normal">Manage your profile</p>
      </div>
      <div class="w-full my-8 flex flex-col gap-8">
        <div class="card w-full p-8 rounded-4xl pr-shadow bg-white">
          <h2 class="text-sm font-medium text-gray-400">Account</h2>
          <div class="w-full flex flex-col">
            <div class="w-full mt-4 h-9 flex items-center justify-between text-base font-normal">
              <h2 class="text-start">Full name</h2>
              <span class="text-end">{{ auth.profile?.first_name }} {{ auth.profile?.last_name }}</span>
            </div>
            <div class="w-full h-9 flex items-center justify-between text-base font-normal">
              <h2 class="text-start">Email</h2>
              <span class="text-end">{{ auth.user?.email }}</span>
            </div>
          </div>
        </div>
        <div class="card w-full p-8 rounded-4xl pr-shadow bg-white">
          <h2 class="text-sm font-medium text-gray-400">Subscription Plan</h2>
          <div class="w-full flex flex-col">
            <div class="w-full h-9 flex items-center justify-between text-base font-normal">
              <h2 class="text-start">Subscription</h2>
              <badge :label="typeSubscription" />
            </div>
          </div>
          <div v-if="subscriptionDetails && isSubscriptionCancelled" class="w-full h-9 flex items-center justify-between text-base font-normal">
            <h2 class="text-start">Scade il</h2>
            <span class="text-end">{{ formatDate(subscriptionDetails.cancel_at) }}</span>
          </div>
          <div class="w-full mt-4 flex items-center justify-end">
            <buttonLg
              @click="handleCancelSubscription"
              v-if="typeSubscription === 'Pro' && !isSubscriptionCancelled"
              type="button"
              variant="destructive"
              label="Disattiva abbonamento"
            />
            <RouterLink v-else-if="typeSubscription === 'Free'" to="/pricing">
              <buttonLg type="button" variant="primary" label="Upgrade to Pro" />
            </RouterLink>
          </div>
        </div>
        <div v-if="billingHistory.data && billingHistory.data.length > 0" class="card w-full p-8 rounded-4xl pr-shadow bg-white">
          <h2 class="text-sm font-medium text-gray-400">Billing History</h2>
          <div class="w-full flex flex-col">
            <div
              v-for="(payment, paymentIndex) in billingHistory.data"
              :key="paymentIndex"
              class="w-full mt-4 h-9 flex items-center justify-between text-base font-normal"
            >
              <h2 class="text-start">{{ payment.currency === 'EUR' ? '€' : '$' }}{{ payment.amount }} - {{ formatPaymentStatus(payment.status) }}</h2>
              <span class="text-end flex gap-2 items-center"
                >{{ formatDate(payment.date) }}
                <a v-if="payment.invoice_pdf" :href="payment.invoice_pdf" class="text-sm font-semibold underline">Scarica fattura</a></span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from '../data/auth';

import navigation from '../components/navigation/navigation.vue';
import buttonLg from '../components/button/button-lg.vue';
import badge from '../components/badge/badge.vue';

export default {
  name: 'Profile',
  components: {
    navigation,
    buttonLg,
    badge,
  },
  data() {
    return {
      auth,
      subscriptionDetails: null,
      billingHistory: {
        data: null,
        error: null,
        loading: false,
      },
    };
  },
  computed: {
    typeSubscription() {
      if (!this.auth.profile) {
        return 'Free';
      }

      const plan = this.auth?.profile.plan;

      const freePlan = 'free';
      const proPlan = 'pro';

      if (plan === freePlan) {
        return 'Free';
      } else if (plan === proPlan) {
        return 'Pro';
      }

      return 'Free';
    },
    isSubscriptionCancelled() {
      return this.subscriptionDetails?.cancel_at_period_end === true;
    },
  },
  methods: {
    formatDate(timestamp) {
      const date = new Date(timestamp * 1000); // Stripe restituisce timestamp in secondi
      return date.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    },
    formatPaymentStatus(status) {
      const statusMap = {
        paid: 'Pagato',
        open: 'In attesa',
        void: 'Annullato',
        uncollectible: 'Non riscuotibile',
      };
      return statusMap[status] || status;
    },

    async handleCancelSubscription() {
      const UID = this.auth.user.id;
      const stripe_id = this.auth.profile.stripe_id;

      if (!stripe_id && !UID) {
        return;
      }

      // Conferma dall'utente
      const confirmed = confirm(
        'Sei sicuro di voler cancellare il tuo abbonamento? Rimarrà attivo fino alla fine del periodo di fatturazione corrente.'
      );

      if (!confirmed) {
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/subscriptions/${this.auth.profile.stripe_id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Errore HTTP: ${response.status}`);
        }

        const res = await response.json();
        alert('Abbonamento cancellato con successo. Rimarrà attivo fino alla fine del periodo di fatturazione corrente.');

        await this.fetchSubscriptionDetails();
      } catch (e) {
        console.error(e);
      }
    },
    async fetchSubscriptionDetails() {
      try {
        const response = await fetch(`http://localhost:3001/api/subscriptions/${this.auth.profile.stripe_id}`);
        if (response.ok) {
          this.subscriptionDetails = await response.json();
        }
      } catch (e) {
        console.error(e);
      }
    },
    async fetchBillingHistory() {
      this.billingHistory.loading = true;

      const customerId = this.subscriptionDetails.customer.id;

      if (!customerId) {
        this.billingHistory.loading = false;
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/payments/billing-history/${customerId}`);
        if (response.ok) {
          this.billingHistory.data = await response.json();
          // console.log(this.billingHistory);
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.billingHistory.loading = false;
      }
    },
  },
  watch: {
    'auth.profile': {
      handler(value) {
        if (value) {
          this.fetchSubscriptionDetails();
        }
      },
      deep: true,
    },
    subscriptionDetails: {
      handler(value) {
        if (value) {
          this.fetchBillingHistory();
        }
      },
      deep: true,
    },
  },
  async mounted() {
    if (this.auth.profile) await this.fetchSubscriptionDetails();
    if (this.subscriptionDetails) await this.fetchBillingHistory();
  },
};
</script>

<style scoped></style>
