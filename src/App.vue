<template>
  <Notivue v-slot="item">
    <Notification :item="item" />
  </Notivue>
  <div>
    <RouterView v-if="!loading" @load-qr-codes="getQrCodes" />
    <div v-else-if="loading" class="fixed z-[99999999] top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-full flex items-center justify-center">
      <loader />
    </div>
  </div>
</template>

<script>
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import { store } from './data/store';
import { Notivue, Notification } from 'notivue';

import loader from './components/loader/loader.vue';

export default {
  name: 'App',
  components: {
    loader,

    Notivue,
    Notification,
  },
  data() {
    return {
      store,

      loading: true,
    };
  },
  setup() {
    const { auth, loading: authLoading, initAuth, getProfile, getSubscription } = useAuth();

    return {
      auth,
      authLoading,
      initAuth,
      getProfile,
      getSubscription,
    };
  },
  computed: {
    qrLimit() {
      return this.auth?.subscription?.plan === 'pro'
        ? this.store.planConfig.pro_plan_limit_create_qr
        : this.store.planConfig.free_plan_limit_create_qr;
    },
    currentQrCount() {
      if (!this.store.qrCodes.data) {
        return 0;
      }
      return this.store.qrCodes.data.length;
    },
    canCreateQR() {
      return this.currentQrCount < this.qrLimit;
    },
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
    canCreateQR: {
      handler(value) {
        this.store.planConfig.can_create_qr = value;
      },
      immediate: true,
    },
    qrLimit: {
      handler(value) {
        this.store.planConfig.qr_limit = value;
      },
      immediate: true,
    },
  },
  async mounted() {
    if (document.readyState === 'complete') {
      this.loading = false;
    } else {
      window.addEventListener('load', () => {
        this.loading = false;
      });
    }

    window.scrollTo(0, 0);

    await this.initAuth();

    if (this.auth.profile) {
      await this.getQrCodes();
    }
  },
};
</script>

<style scoped></style>
