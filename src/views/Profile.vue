<template>
  <navigation />
  <div class="w-full md:px-6 px-3 pt-30 pb-10">
    <div class="max-w-[550px] mx-auto">
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
              <span class="text-end flex gap-2 items-center"
                >{{ formatDate(payment.date) }}
                <a v-if="payment.invoice_pdf" :href="payment.invoice_pdf" class="text-sm font-semibold underline">{{
                  $t('profile.downloadInvoice')
                }}</a></span
              >
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

import navigation from '../components/navigation/navigation.vue';
import buttonLg from '../components/button/button-lg.vue';
import badge from '../components/badge/badge.vue';
import dropdown from '../components/dropdown/dropdown.vue';
import dropdownOption from '../components/dropdown/dropdown-option.vue';

export default {
  name: 'Profile',
  components: {
    navigation,
    buttonLg,
    badge,
    dropdown,
    dropdownOption,
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
    selectedLanguageLabel() {
      const selectedLanguage = this.store.languages.find((language) => language.value === this.selectedLanguage);
      return selectedLanguage ? selectedLanguage.name : '';
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
      this.billingHistory.loading = true;

      try {
        const response = await fetch(`http://localhost:3001/api/subscriptions/${this.auth.profile.stripe_id}`);
        if (response.ok) {
          this.subscriptionDetails.data = await response.json();
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.billingHistory.loading = false;
      }
    },
    async fetchBillingHistory() {
      this.billingHistory.loading = true;

      const customerId = this.subscriptionDetails.data?.customer?.id;

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
    async fetchNextPayment() {
      this.nextPayment.loading = true;

      if (!this.subscriptionDetails.data?.customer?.id) {
        this.nextPayment.loading = false;
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/payments/upcoming-invoice/${this.subscriptionDetails.data.customer.id}`);
        if (response.ok) {
          this.nextPayment.data = await response.json();
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.nextPayment.loading = false;
      }
    },
    async updateLanguage(lang) {
      if (!this.auth.user?.id) {
        return;
      }

      this.selectedLanguage = lang;

      try {
        const { error } = await supabase.from('profiles').update({ lang: this.selectedLanguage }).eq('id', this.auth.user.id);

        if (error) {
          alert("Errore durante l'aggiornamento della lingua");
          return;
        }

        if (this.auth.profile) {
          this.auth.profile.lang = this.selectedLanguage;
        }

        this.$i18n.locale = this.selectedLanguage;
        alert('Lingua aggiornata con successo!');
      } catch (e) {
        console.error(e);
      }
    },
  },
  watch: {
    'auth.profile': {
      handler(value) {
        if (value) {
          // Set the selected language from the profile
          this.selectedLanguage = value.lang || 'it-IT';
          this.fetchSubscriptionDetails();
        }
      },
      deep: true,
      immediate: true,
    },
    subscriptionDetails: {
      handler(value) {
        if (value) {
          this.fetchBillingHistory();
          this.fetchNextPayment();
        }
      },
      deep: true,
    },
  },
  async mounted() {
    if (this.auth.profile) await this.fetchSubscriptionDetails();
    if (this.subscriptionDetails) {
      await this.fetchBillingHistory();
      await this.fetchNextPayment();
    }
  },
};
</script>

<style scoped></style>
