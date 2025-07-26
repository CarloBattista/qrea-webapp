<template>
  <navigation />
  <div class="w-full md:px-6 px-3 pt-30 pb-10">
    <div class="max-w-[768px] mx-auto grid grid-cols-2 md:grid-cols-3 gap-5">
      <cardQr v-for="(qr, qrIndex) in store.qrCodes.data" :key="qrIndex" :data="qr" />
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
  methods: {
    async getQrCodes() {
      this.store.qrCodes.loading = true;

      const PID = this.auth.profile.id;

      if (!PID) {
        this.store.qrCodes.loading = false;
        return;
      }

      try {
        const { data, error } = await supabase.from('qr_codes').select('*').eq('pid', PID);

        if (!error) {
          this.store.qrCodes.data = data;
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.store.qrCodes.loading = false;
      }
    },
  },
  watch: {
    'auth.profile': {
      handler(value) {
        if (value) {
          this.getQrCodes();
        }
      },
      deep: true,
    },
  },
  async mounted() {
    if (this.auth.profile) await this.getQrCodes();
  },
};
</script>

<style scoped></style>
