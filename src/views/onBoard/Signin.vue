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
          <inputText v-model="user.data.email" type="email" forLabel="email" icon="Mail" :label="$t('auth.email')" :error="user.error.email" />
          <inputText
            v-model="user.data.password"
            type="password"
            forLabel="password"
            icon="KeyRound"
            :label="$t('auth.password')"
            :error="user.error.password"
          />
          <div class="text-right">
            <RouterLink to="/forgot-password" class="text-sm text-gray-600 hover:text-black transition-colors duration-200">{{
              $t('auth.forgotPassword')
            }}</RouterLink>
          </div>
          <buttonLg type="submit" variant="primary" :label="$t('auth.signin')" :loading="user.loading" :disabled="user.loading" class="w-full" />
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
            <RouterLink to="/signup" class="font-medium text-black hover:underline"> {{ $t('auth.signup') }} </RouterLink>
          </p>
        </div>
      </div>
      <div class="text-center mt-8">
        <p class="text-xs text-gray-500">
          {{ $t('auth.termsText') }}
          <RouterLink to="/terms-and-conditions" class="underline hover:text-black">{{ $t('auth.termsOfService') }}</RouterLink>
          {{ $t('auth.and') }}
          <RouterLink to="/privacy-policy" class="underline hover:text-black">{{ $t('auth.privacyPolicy') }}</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../../lib/supabase';
import { auth } from '../../data/auth';
import { push } from 'notivue';

import supportedDomains from '../../json/supported_domains.json';

import appLogo from '../../components/global/app-logo.vue';
import ButtonLg from '../../components/button/button-lg.vue';
import inputText from '../../components/input/input-text.vue';

export default {
  name: 'Signin',
  components: {
    appLogo,
    ButtonLg,
    inputText,
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
        this.user.error.email = 'Inserisci la tua email';
        return false;
      } else if (!emailRegex.test(this.user.data.email)) {
        this.user.error.email = 'Inserisci una email valida';
        return false;
      } else {
        this.user.error.email = null;
        return true;
      }
    },
    validatePassword() {
      if (!this.user.data.password) {
        this.user.error.password = 'Inserisci la tua password';
        return false;
      } else {
        this.user.error.password = null;
        return true;
      }
    },
    retrieveError(error) {
      if (error.code === 'invalid_credentials') {
        this.user.error.general = "L'email o la password inserite non sono corrette";

        push.error({
          title: null,
          message: "L'email o la password inserite non sono corrette",
        });
      } else {
        this.user.error.general = 'Si è verificato un errore generale, riprova più tardi';

        push.error({
          title: null,
          message: 'Si è verificato un errore generale, riprova più tardi',
        });
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

          await this.getProfile(data.user.id);

          if (this.auth.profile?.plan === 'pro') {
            this.$router.push({ name: 'home' });
          } else {
            this.$router.push({ name: 'pricing' });
          }
        } else {
          this.retrieveError(error);
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.user.loading = false;
      }
    },
    async getProfile(userId) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('uid', userId).maybeSingle();

        if (!error && data) {
          this.auth.profile = data;
        }
      } catch (e) {
        console.error(e);
      }
    },
  },
  mounted() {
    window.scrollTo(0, 0);
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
