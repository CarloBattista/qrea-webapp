<template>
  <navigation />
  <div class="w-full md:px-6 px-3 pt-30 pb-10">
    <div v-if="shouldShowAlert" class="max-w-[768px] mb-8 mx-auto">
      <alert type="warning" :title="alertTitle" :message="alertMessage" />
    </div>
    <div v-if="store.qrCodes.loading" class="w-full flex items-center justify-center">
      <loader />
    </div>
    <div v-else-if="!store.qrCodes.loading" class="max-w-[768px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
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

export default {
  name: 'My-qr',
  components: {
    navigation,
    cardQr,
    loader,
    alert,
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
      const threshold = Math.ceil(qrLimit * 0.8);

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
};
</script>

<style scoped></style>
