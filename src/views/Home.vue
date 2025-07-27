<template>
  <navigation />
  <div class="w-full md:px-6 px-3 pt-30 pb-10">
    <div v-if="store.qrCodes.loading" class="w-full flex items-center justify-center">
      <loader />
    </div>
    <div v-else-if="!store.qrCodes.loading" class="max-w-[768px] mx-auto grid grid-cols-2 md:grid-cols-3 gap-5">
      <cardQr v-for="(qr, qrIndex) in store.qrCodes.data" :key="qrIndex" :data="qr" />
    </div>
  </div>
</template>

<script>
import { store } from '../data/store';

import navigation from '../components/navigation/navigation.vue';
import cardQr from '../components/card/card-qr.vue';
import loader from '../components/loader/loader.vue';

export default {
  name: 'My-qr',
  components: {
    navigation,
    cardQr,
    loader,
  },
  data() {
    return {
      store,
    };
  },
};
</script>

<style scoped></style>
