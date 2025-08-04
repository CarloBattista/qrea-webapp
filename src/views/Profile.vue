<template>
  <navigation />
  <div class="w-full md:px-6 px-3 pt-30 pb-10">
    <div class="max-w-[550px] mx-auto">
      <div v-if="hasDraftPayments" class="max-w-[768px] mb-8 mx-auto">
        <alert
          type="warning"
          title="Pagamento in attesa"
          message="Hai un pagamento in attesa che richiede la tua attenzione. Completa il pagamento per continuare a utilizzare tutte le funzionalità."
        />
      </div>
      <div class="w-full flex flex-col gap-2">
        <h2 class="text-black text-2xl font-semibold">{{ $t('profile.title') }}</h2>
        <p class="text-black text-base font-normal">{{ $t('profile.subtitle') }}</p>
      </div>
      <div class="w-full my-8 flex flex-col gap-8">
        <div class="card w-full p-8 rounded-4xl pr-shadow bg-white">
          <h2 class="text-sm font-medium text-gray-400">{{ $t('profile.account') }}</h2>
          <div class="w-full flex flex-col">
            <div class="w-full mt-4 h-9 flex gap-8 items-center justify-between text-base font-normal">
              <h2 class="text-start">{{ $t('profile.fullName') }}</h2>
              <span class="text-end">{{ auth.profile?.first_name }} {{ auth.profile?.last_name }}</span>
            </div>
            <div class="w-full h-9 flex gap-8 items-center justify-between text-base font-normal">
              <h2 class="text-start">{{ $t('profile.email') }}</h2>
              <span class="text-end">{{ auth.user?.email }}</span>
            </div>
            <div class="w-full flex gap-8 items-center justify-between text-base font-normal">
              <h2 class="text-start">{{ $t('profile.language') }}</h2>
              <dropdown class="w-full" :selected="selectedLanguageLabel" :disabled="false">
                <template #content>
                  <dropdownOption
                    v-for="(option, optionIndex) in store.languages"
                    @click="updateLanguage(option.value)"
                    :key="optionIndex"
                    :value="option.value"
                    :option="option.name"
                    :selected="selectedLanguage"
                  />
                </template>
              </dropdown>
            </div>
          </div>
        </div>
        <div class="card w-full p-8 rounded-4xl pr-shadow bg-white">
          <h2 class="text-sm font-medium text-gray-400">{{ $t('profile.subscriptionPlan') }}</h2>
          <div class="w-full flex flex-col">
            <div class="w-full h-9 flex items-center justify-between text-base font-normal">
              <h2 class="text-start">{{ $t('profile.subscription') }}</h2>
              <badge :label="typeSubscription" />
            </div>
          </div>
          <div v-if="subscriptionDetails.data && isSubscriptionCancelled" class="w-full h-9 flex items-center justify-between text-base font-normal">
            <h2 class="text-start">{{ $t('profile.expiresOn') }}</h2>
            <span class="text-end">{{ formatDate(subscriptionDetails.data.cancel_at) }}</span>
          </div>
          <div class="w-full mt-4 flex items-center justify-end">
            <buttonLg
              @click="handleCancelSubscription"
              v-if="typeSubscription === 'Pro' && !isSubscriptionCancelled"
              type="button"
              variant="destructive"
              :label="$t('profile.deactivateSubscription')"
            />
            <RouterLink v-else-if="typeSubscription === 'Free'" to="/pricing">
              <buttonLg type="button" variant="primary" :label="$t('profile.upgradeToPro')" />
            </RouterLink>
          </div>
        </div>
        <div v-if="billingHistory.data && billingHistory.data.length > 0" class="card w-full p-8 rounded-4xl pr-shadow bg-white">
          <h2 class="text-sm font-medium text-gray-400">{{ $t('billing.history') }}</h2>
          <div class="w-full flex flex-col">
            <div
              v-if="nextPayment.data && typeSubscription === 'Pro'"
              class="w-full mt-4 h-9 flex items-center justify-between text-base font-normal border-b border-gray-200 pb-2"
            >
              <h2 class="text-start">
                {{ nextPayment.data.currency === 'EUR' ? '€' : '$' }}{{ nextPayment.data.amount }} - {{ $t('profile.upcoming') }}
              </h2>
              <span class="text-end">{{ formatDate(new Date(nextPayment.data.date).getTime() / 1000) }}</span>
            </div>
            <div
              v-for="(payment, paymentIndex) in billingHistory.data"
              :key="paymentIndex"
              class="w-full mt-4 h-9 flex items-center justify-between text-base font-normal"
            >
              <h2 class="text-start">{{ payment.currency === 'EUR' ? '€' : '$' }}{{ payment.amount }} - {{ formatPaymentStatus(payment.status) }}</h2>
              <span class="text-end flex gap-2 items-center">
                {{ formatDate(payment.date) }}
                <a v-if="payment.invoice_pdf" :href="payment.invoice_pdf" class="text-sm font-semibold underline">{{
                  $t('profile.downloadInvoice')
                }}</a>
                <button
                  v-if="payment.status === 'draft'"
                  @click="completePayment(payment.id)"
                  class="text-sm font-semibold text-blue-600 hover:text-blue-800 underline ml-2 cursor-pointer"
                  :disabled="payment.completing"
                >
                  {{ payment.completing ? 'Completando...' : 'Completa Pagamento' }}
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../lib/supabase';
import { auth } from '../data/auth';
import { store } from '../data/store';
import { setLocale } from '../lib/i18n';
import { push } from 'notivue';

import navigation from '../components/navigation/navigation.vue';
import buttonLg from '../components/button/button-lg.vue';
import badge from '../components/badge/badge.vue';
import dropdown from '../components/dropdown/dropdown.vue';
import dropdownOption from '../components/dropdown/dropdown-option.vue';
import alert from '../components/alert/alert.vue';

export default {
  name: 'Profile',
  components: {
    navigation,
    buttonLg,
    badge,
    dropdown,
    dropdownOption,
    alert,
  },
  data() {
    return {
      auth,
      store,
      selectedLanguage: 'it-IT', // Default language
      subscriptionDetails: {
        data: null,
        error: null,
        loading: false,
      },
      nextPayment: {
        data: null,
        error: null,
        loading: false,
      },
      billingHistory: {
        data: null,
        error: null,
        loading: false,
      },
      dataLoaded: false,
    };
  },
  computed: {
    typeSubscription() {
      if (!this.auth && !this.auth.subscription) {
        return 'Free';
      }

      const plan = this.auth.subscription?.plan;

      const freePlan = 'free';
      const proPlan = 'pro';

      if (this.hasDraftPayments && plan === proPlan) {
        return 'Sospeso';
      }

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
    selectedLanguageLabel() {
      const selectedLanguage = this.store.languages.find((language) => language.value === this.selectedLanguage);
      return selectedLanguage ? selectedLanguage.name : '';
    },
    hasDraftPayments() {
      if (!this.billingHistory.data || this.billingHistory.data.length === 0) {
        return false;
      }

      return this.billingHistory.data.some((payment) => payment.status === 'draft');
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
        draft: 'In attesa',
        void: 'Annullato',
        uncollectible: 'Non riscuotibile',
      };
      return statusMap[status] || status;
    },

    async updateLanguage(lang) {
      if (!this.auth.user?.id) {
        return;
      }

      this.selectedLanguage = lang;

      try {
        const { error } = await supabase.from('profiles').update({ lang: this.selectedLanguage }).eq('uid', this.auth.user.id);

        if (!error) {
          this.auth.profile.lang = this.selectedLanguage;
          setLocale(this.selectedLanguage);
          this.$emit('load-profile');

          push.success({
            title: null,
            message: this.$t('profile.languageUpdated'),
          });
        }
      } catch (e) {
        console.error(e);
      }
    },
    async handleCancelSubscription() {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const UID = this.auth.user.id;
      const stripeId = this.auth.subscription?.stripe_id;
      const customerId = this.auth.subscription?.customer_id;

      if (!stripeId && !UID) {
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
        const response = await fetch(`${BACKEND_URL}/api/subscriptions/${stripeId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stripeId: stripeId,
            customerId: customerId,
          }),
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
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const stripeId = this.auth.subscription?.stripe_id;

      if (!stripeId || stripeId === 'undefined' || stripeId === 'null') {
        console.warn('stripe_id non disponibile per fetchSubscriptionDetails');
        this.subscriptionDetails.loading = false;
        return;
      }

      this.billingHistory.loading = true;

      try {
        const response = await fetch(`${BACKEND_URL}/api/subscriptions/${stripeId}`);

        if (response.ok) {
          this.subscriptionDetails.data = await response.json();
          this.$emit('load-subscription');
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.billingHistory.loading = false;
      }
    },
    async fetchBillingHistory() {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const customerId = this.auth.subscription?.customer_id;

      this.billingHistory.loading = true;

      if (!customerId) {
        this.billingHistory.loading = false;
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/payments/billing-history/${customerId}`);

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
    async fetchNextPayment() {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

      this.nextPayment.loading = true;

      if (!this.subscriptionDetails.data?.customer?.id) {
        this.nextPayment.loading = false;
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/payments/upcoming-invoice/${this.subscriptionDetails.data.customer.id}`);

        if (response.ok) {
          this.nextPayment.data = await response.json();
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.nextPayment.loading = false;
      }
    },
    async loadProfileData() {
      if (this.dataLoaded) {
        return;
      }

      this.dataLoaded = true;

      try {
        await this.fetchSubscriptionDetails();
        await this.fetchBillingHistory();

        if (this.subscriptionDetails.data) {
          await this.fetchNextPayment();
        }
      } catch (e) {
        console.error(e);
        this.dataLoaded = false;
      }
    },
    async completePayment(invoiceId) {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

      const payment = this.billingHistory.data.find((p) => p.id === invoiceId);

      if (payment) {
        payment.completing = true;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/payments/complete-invoice/${invoiceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userStripeId: this.auth.profile.stripe_id,
          }),
        });

        const result = await response.json();

        if (result.success) {
          await this.fetchBillingHistory();

          push.success({
            title: null,
            message: 'Pagamento completato con successo!',
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        payment.completing = false;
      }
    },
  },
  watch: {
    'auth.profile': {
      handler(value) {
        if (value) {
          // Set the selected language from the profile
          this.selectedLanguage = value.lang || 'it-IT';

          if (!this.dataLoaded) {
            this.$nextTick(() => {
              setTimeout(() => {
                this.loadProfileData();
              }, 100);
            });
          }
        }
      },
      deep: true,
      immediate: true,
    },
    'auth.subscription': {
      handler(value) {
        if (value && this.auth.profile && !this.dataLoaded) {
          this.loadProfileData();
        }
      },
      deep: true,
    },
  },
  async mounted() {
    window.scrollTo(0, 0);

    if (this.auth.profile) {
      await this.loadProfileData();
    }
  },
};
</script>

<style scoped></style>
