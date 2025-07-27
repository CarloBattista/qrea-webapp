<template>
  <div v-if="!qrCode.loading">{{ qrCode.data }}</div>
</template>

<script>
import { supabase } from '../lib/supabase';
import { auth } from '../data/auth';
import { store } from '../data/store';

export default {
  name: 'Edit-qr',
  data() {
    return {
      auth,
      store,

      qrCodeId: this.$route.params.id,
      qrCode: {
        data: null,
        error: null,
        loading: false,
      },
    };
  },
  methods: {
    async getQrCode() {
      this.qrCode.loading = true;

      const PID = this.auth.profile.id;

      if (!PID) {
        this.qrCode.loading = false;
        return;
      }

      try {
        const { data, error } = await supabase.from('qr_codes').select('*').eq('pid', PID).eq('id', this.qrCodeId).single();

        if (!error) {
          this.qrCode.data = data;
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.qrCode.loading = false;
      }
    },
  },
  watch: {
    '$route.params.id': {
      handler(value) {
        if (value) {
          this.qrCodeId = value;
        }
      },
      immediate: true,
      deep: true,
    },
    'auth.profile': {
      handler(value) {
        if (value) {
          this.getQrCode();
        }
      },
      deep: true,
    },
  },
  async mounted() {
    if (this.auth.profile && this.qrCodeId) await this.getQrCode();
  },
};
</script>

<style scoped></style>
