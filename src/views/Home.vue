<template>
  <navigation />
  <div class="w-full md:px-6 px-3 pt-30 pb-10">
    <div v-if="shouldShowAlert" class="max-w-[768px] mb-8 mx-auto">
      <alert type="warning" :title="alertTitle" :message="alertMessage" />
    </div>
    <div v-if="store.qrCodes.loading" class="w-full flex items-center justify-center">
      <loader />
    </div>
    <div v-else-if="!store.qrCodes.loading && store.qrCodes.data && store.qrCodes.data.length === 0" class="max-w-[768px] mx-auto text-center py-16">
      <div class="text-gray-500">
        <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M20 12h.01m-.01 4h.01m-1.01-4h.01M12 8h.01M8 12h.01M8 8h.01M8 16h.01"
          />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">{{ $t('home.noQrFound') }}</h3>
        <p class="text-gray-500 mb-6">{{ $t('home.noQrDescription') }}</p>
        <router-link to="/new-qr" class="w-full flex items-center justify-center">
          <buttonLg variant="primary" :label="$t('home.createFirstQr')" />
        </router-link>
      </div>
    </div>
    <div
      v-else-if="!store.qrCodes.loading && store.qrCodes.data && store.qrCodes.data.length > 0"
      class="max-w-[768px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5"
    >
      <cardQr v-for="(qr, qrIndex) in store.qrCodes.data" :key="qrIndex" :data="qr" @load-qr-codes="$emit('load-qr-codes')" />
    </div>
  </div>
</template>

<script>
import { store } from '../data/store';

import navigation from '../components/navigation/navigation.vue';
import cardQr from '../components/card/card-qr.vue';
import loader from '../components/loader/loader.vue';
import alert from '../components/alert/alert.vue';
import buttonLg from '../components/button/button-lg.vue';

export default {
  name: 'My-qr',
  components: {
    navigation,
    cardQr,
    loader,
    alert,
    buttonLg,
  },
  data() {
    return {
      store,
    };
  },
  computed: {
    shouldShowAlert() {
      const qrLimit = this.store.planConfig.qr_limit;
      const currentQrCount = this.store.qrCodes.data?.length;
      const percentage = 0.8; // 80%
      const threshold = Math.ceil(qrLimit * percentage);

      return currentQrCount >= threshold;
    },
    alertTitle() {
      const qrLimit = this.store.planConfig.qr_limit;
      const currentQrCount = this.store.qrCodes.data?.length;

      return currentQrCount >= qrLimit ? 'Limite QR raggiunto' : 'Attenzione limite QR quasi raggiunto';
    },
    alertMessage() {
      const qrLimit = this.store.planConfig.qr_limit;
      const currentQrCount = this.store.qrCodes.data?.length;

      if (currentQrCount >= qrLimit) {
        return `Hai raggiunto il limite massimo di ${qrLimit} QR con il piano gratuito. Aggiorna il tuo piano per crearne di più.`;
      }

      return `Stai per arrivare al limite di creazione di QR. Puoi creare un massimo di ${this.store.planConfig.free_plan_limit_create_qr} QR con il piano gratuito`;
    },
  },
  mounted() {
    window.scrollTo(0, 0);
  },
};
</script>

<style scoped></style>
