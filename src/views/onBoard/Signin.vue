<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md px-6">
      <div class="w-full mb-8 flex items-center justify-center">
        <appLogo class="relative max-w-30" />
      </div>
      <div class="card-form-comtainer sm:bg-white bg-transparent rounded-2xl sm:p-8">
        <div class="text-start mb-8">
          <h1 class="text-xl font-medium text-black">{{ $t('auth.signin') }}</h1>
        </div>
        <form @submit.prevent="actionSignin" class="space-y-6">
          <div class="space-y-2">
            <label for="email" class="block text-sm font-medium text-gray-700">{{ $t('auth.email') }}</label>
            <input
              id="email"
              v-model="user.data.email"
              type="email"
              :placeholder="$t('auth.emailPlaceholder')"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 outline-none"
              :class="{ 'border-red-500': user.error.email }"
            />
            <p v-if="user.error.email" class="text-red-500 text-sm">{{ user.error.email }}</p>
          </div>
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
          <div class="text-right">
            <a href="#" class="text-sm text-gray-600 hover:text-black transition-colors duration-200">{{ $t('auth.forgotPassword') }}</a>
          </div>
          <div class="pt-4">
            <button-lg type="submit" variant="primary" :label="$t('auth.signin')" :loading="user.loading" :disabled="user.loading" class="w-full" />
          </div>
        </form>
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 sm:bg-white bg-gray-50 text-gray-500">{{ $t('auth.or') }}</span>
          </div>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-600">
            {{ $t('auth.dontHaveAccount') }}
            <router-link to="/signup" class="font-medium text-black hover:underline"> {{ $t('auth.signup') }} </router-link>
          </p>
        </div>
      </div>
      <div class="text-center mt-8">
        <p class="text-xs text-gray-500">
          {{ $t('auth.termsText') }}
          <a href="#" class="underline hover:text-black">{{ $t('auth.termsOfService') }}</a>
          {{ $t('auth.and') }}
          <a href="#" class="underline hover:text-black">{{ $t('auth.privacyPolicy') }}</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../../lib/supabase';
import { auth } from '../../data/auth';

import supportedDomains from '../../json/supported_domains.json';

import appLogo from '../../components/global/app-logo.vue';
import ButtonLg from '../../components/button/button-lg.vue';

export default {
  name: 'Signin',
  components: {
    appLogo,
    ButtonLg,
  },
  data() {
    return {
      auth,
      user: {
        data: {
          email: '',
          password: '',
        },
        error: {
          email: null,
          password: null,
          general: null,
        },
        loading: false,
      },
    };
  },
  methods: {
    validateEmail() {
      const supportedDomainsPattern = supportedDomains.join('|');
      const emailRegex = new RegExp(`^[^\\s@]+@(${supportedDomainsPattern})\\.(com|it|org|net|edu|gov|io)$`, 'i');

      if (!this.user.data.email) {
        this.user.error.email = 'Inserisci un indirizzo email';
        return false;
      } else if (!emailRegex.test(this.user.data.email)) {
        this.user.error.email = 'Inserisci un indirizzo email valido';
        return false;
      } else {
        this.user.error.email = null;
        return true;
      }
    },
    validatePassword() {
      if (!this.user.data.password) {
        this.user.error.password = 'Inserisci una password';
        return false;
      } else {
        this.user.error.password = null;
        return true;
      }
    },
    retrieveError(error) {
      if (error.code === 'invalid_credentials') {
        this.user.error.general = 'Correggi indirizzo email e/o la password.';
      } else {
        this.user.error.general = 'Si è verificato un errore, riprova più tardi';
      }
    },

    async actionSignin() {
      this.user.error.general = null;

      const isEmailValid = this.validateEmail();
      const isPasswordValid = this.validatePassword();

      if (!isEmailValid || !isPasswordValid) {
        this.user.loading = false;
        return;
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: this.user.data.email,
          password: this.user.data.password,
        });

        if (!error) {
          this.auth.user = data.user;
          this.auth.session = data.session;
          this.auth.isAuthenticated = true;

          localStorage.setItem('isAuthenticated', true);

          this.$router.push({ name: 'home' });
        } else {
          this.retrieveError(error);
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.user.loading = false;
      }
    },
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
