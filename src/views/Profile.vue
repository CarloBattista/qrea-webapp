<template>
  <navigation />
  <div v-if="!dataLoaded" class="fixed z-[99999999] top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-full flex items-center justify-center">
    <loader />
  </div>
  <div v-else-if="dataLoaded" class="w-full md:px-6 px-3 pt-30 pb-10">
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
import { watch, onMounted, nextTick } from 'vue';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { auth } from '../data/auth';
import { store } from '../data/store';

import navigation from '../components/navigation/navigation.vue';
import buttonLg from '../components/button/button-lg.vue';
import badge from '../components/badge/badge.vue';
import dropdown from '../components/dropdown/dropdown.vue';
import dropdownOption from '../components/dropdown/dropdown-option.vue';
import alert from '../components/alert/alert.vue';
import loader from '../components/loader/loader.vue';

export default {
  name: 'Profile',
  components: {
    navigation,
    buttonLg,
    badge,
    dropdown,
    dropdownOption,
    alert,
    loader,
  },
  setup() {
    const { getProfile, getSubscription } = useAuth();
    const {
      selectedLanguage,
      subscriptionDetails,
      nextPayment,
      billingHistory,
      dataLoaded,
      typeSubscription,
      isSubscriptionCancelled,
      selectedLanguageLabel,
      hasDraftPayments,
      formatDate,
      formatPaymentStatus,
      updateLanguage,
      handleCancelSubscription,
      loadProfileData,
      completePayment,
    } = useProfile();

    // Watchers
    watch(
      () => auth.profile,
      (value) => {
        if (value) {
          selectedLanguage.value = value.lang || 'it-IT';

          if (!dataLoaded.value) {
            nextTick(() => {
              setTimeout(() => {
                loadProfileData();
              }, 100);
            });
          }
        }
      },
      { deep: true, immediate: true }
    );

    watch(
      () => auth.subscription,
      (value) => {
        if (value && auth.profile && !dataLoaded.value) {
          loadProfileData();
        }
      },
      { deep: true }
    );

    onMounted(async () => {
      window.scrollTo(0, 0);

      if (auth.profile) {
        await loadProfileData();
      }
    });

    return {
      auth,
      store,
      selectedLanguage,
      subscriptionDetails,
      nextPayment,
      billingHistory,
      dataLoaded,
      typeSubscription,
      isSubscriptionCancelled,
      selectedLanguageLabel,
      hasDraftPayments,
      formatDate,
      formatPaymentStatus,
      updateLanguage,
      handleCancelSubscription,
      loadProfileData,
      completePayment,
    };
  },
};
</script>

<style scoped></style>
