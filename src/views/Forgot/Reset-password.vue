<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md px-6">
      <div class="w-full mb-8 flex items-center justify-center">
        <appLogo class="relative max-w-30" />
      </div>
      <div class="card-form-comtainer sm:bg-white bg-transparent rounded-2xl sm:p-8">
        <div class="text-start mb-8">
          <h1 class="text-xl font-medium text-black">
            {{ user.sent ? 'Controlla la tua casella di posta elettronica' : 'Modifica la tua password' }}
          </h1>
        </div>
        <form @submit.prevent="actionResetPassword" class="space-y-6">
          <div class="space-y-2">
            <label for="password" class="block text-sm font-medium text-gray-700">{{ $t('auth.password') }}</label>
            <input
              id="password"
              v-model="user.data.password"
              type="password"
              :placeholder="$t('auth.passwordPlaceholder')"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 outline-none"
              :class="{ 'border-red-500': user.error.password }"
            />
            <p v-if="user.error.password" class="text-red-500 text-sm">{{ user.error.password }}</p>
          </div>
          <div class="pt-4">
            <buttonLg type="submit" variant="primary" :label="$t('auth.continue')" :loading="user.loading" :disabled="user.loading" class="w-full" />
          </div>
        </form>
        <div v-if="!user.sent" class="text-center mt-6">
          <p class="text-sm text-gray-600">
            {{ $t('auth.dontHaveAccount') }}
            <router-link to="/signup" class="font-medium text-black hover:underline"> {{ $t('auth.signup') }} </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../../lib/supabase';

import appLogo from '../../components/global/app-logo.vue';
import ButtonLg from '../../components/button/button-lg.vue';

export default {
  name: 'Reset-password',
  components: {
    appLogo,
    ButtonLg,
  },
  data() {
    return {
      user: {
        data: {
          password: '',
          confirm_password: '',
        },
        error: {
          password: null,
          confirm_password: null,
          general: null,
        },
        session: null,
        loading: false,
      },
    };
  },
  methods: {
    async retrieveSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!error && !data.session) {
          this.user.session = data.session || 'session_has_expired';
          this.user.error.general = 'La sessione è scaduta';
        }
      } catch (e) {
        console.error(e);
      }
    },
    async actionResetPassword() {
      this.user.loading = true;
      this.user.error.general = null;

      // const isPasswordValid = this.validatePassword();

      // if (!isPasswordValid || this.user.session === 'session_has_expired') {
      //   this.user.loading = false;
      //   return;
      // }

      try {
        const { error } = await supabase.auth.updateUser({
          password: this.user.data.password,
        });

        if (!error) {
          // console.log(data);
          this.$router.push({ name: 'home' });
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.user.loading = false;
      }
    },
  },
  async mounted() {
    await this.retrieveSession();
  },
};
</script>

<style scoped>
.card-form-comtainer {
  box-shadow: 0 0 1px 0 rgba(0, 0, 0, 0.25);
}

input:focus {
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
}

@media only screen and (max-width: 768px) {
  .card-form-comtainer {
    box-shadow: none;
  }
}
</style>
