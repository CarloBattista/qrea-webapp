<template>
  <div class="w-full min-h-screen flex items-center justify-center">
    <div class="max-w-md w-full mx-auto p-8">
      <div v-if="loading" class="w-full flex items-center justify-center">
        <loader />
      </div>
      <div v-else-if="!loading" class="text-center">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size="32" class="text-green-500" />
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Pagamento Completato!</h2>
        <p class="text-gray-600 mb-6">Il tuo abbonamento è ora attivo.</p>

        <RouterLink to="/">
          <buttonLg variant="primary" label="Continua" class="w-full" />
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../../lib/supabase';
import { auth } from '../../data/auth';
import { store } from '../../data/store';

import buttonLg from '../../components/button/button-lg.vue';
import loader from '../../components/loader/loader.vue';

// ICONS
import { Check } from 'lucide-vue-next';

export default {
  name: 'Success',
  components: {
    buttonLg,
    loader,

    // ICONS
    Check,
  },
  data() {
    return {
      auth,
      store,
      loading: true,
      paymentStatus: null, // 'success', 'error', null
      sessionDetails: null,
    };
  },
  methods: {
    async verifyPayment() {
      try {
        this.loading = true;

        // Ottieni il session_id dall'URL
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');

        if (!sessionId) {
          // eslint-disable-next-line quotes
          throw new Error("ID sessione mancante nell'URL");
        }

        // Verifica la sessione tramite il backend
        const response = await fetch(`http://localhost:3001/api/payments/verify-session/${sessionId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Errore HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'complete' || data.status === 'paid') {
          this.paymentStatus = 'success';
          this.sessionDetails = data;

          if (data.subscriptionId) {
            await this.updateSubscription(data);
          }
        } else {
          throw new Error(`Stato pagamento non valido: ${data.status}`);
        }
      } catch (e) {
        console.error(e);
        this.paymentStatus = 'error';
      } finally {
        this.loading = false;
      }
    },
    async retryVerification() {
      await this.verifyPayment();
    },
    async updateSubscription(session) {
      const UID = this.auth.user.id;

      if (!UID) {
        return;
      }

      let paymentDate;

      if (session.session && session.session.created) {
        paymentDate = new Date(session.session.created * 1000).toISOString();
      } else {
        paymentDate = new Date().toISOString();
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .update({ plan: 'pro', stripe_id: session.subscriptionId, last_payment_date: paymentDate })
          .eq('uid', UID);

        if (!error) {
          // console.log('Abonamento aggiornato con successo');
          this.$emit('load-profile');
        }
      } catch (e) {
        console.error(e);
      }
    },
  },
  async mounted() {
    await this.verifyPayment();
  },
};
</script>

<style scoped></style>
