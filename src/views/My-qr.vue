<template>
  <navigation />
  <div class="w-full md:px-6 px-3 pt-30 pb-10">
    <div class="max-w-[768px] mx-auto grid grid-cols-2 md:grid-cols-3 gap-5">
      <cardQr v-for="(qr, qrIndex) in 8" :key="qrIndex" :data="qr" />
    </div>
  </div>
</template>

<script>
import { supabase } from '../lib/supabase';
import { auth } from '../data/auth';
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
      auth,
      store,
    };
  },
};
</script>

<style scoped></style>
