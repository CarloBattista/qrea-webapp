<template>
  <div class="w-full min-h-screen flex items-center justify-center">
    <div class="max-w-md w-full mx-auto p-8">
      <div class="text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <x size="32" class="text-red-500" />
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Pagamento Rifiutato!</h2>
        <p class="text-gray-600 mb-6">Il tuo abbonamento non è stato attivato.</p>

        <RouterLink to="/pricing">
          <buttonLg variant="primary" label="Riprova" class="w-full" />
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from '../../data/auth';
import { store } from '../../data/store';

import buttonLg from '../../components/button/button-lg.vue';

// ICONS
import { X } from 'lucide-vue-next';

export default {
  name: 'Cancel',
  components: {
    buttonLg,

    // ICONS
    X,
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
