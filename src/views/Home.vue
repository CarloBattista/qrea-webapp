<template>
  <navigation />
  <div class="w-full md:px-6 px-3 pt-30 pb-10">
    <div class="max-w-[768px] mx-auto grid grid-cols-2 md:grid-cols-3 gap-5">
      <cardQr v-for="(qr, qrIndex) in store.qrCodes.data" :key="qrIndex" :data="qr" />
    </div>
  </div>
</template>

<script>
import { store } from '../data/store';

import navigation from '../components/navigation/navigation.vue';
import cardQr from '../components/card/card-qr.vue';

export default {
  name: 'My-qr',
  components: {
    navigation,
    cardQr,
  },
  data() {
    return {
      store,
    };
  },
};
</script>

<style scoped></style>
