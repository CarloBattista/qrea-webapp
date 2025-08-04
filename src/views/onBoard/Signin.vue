<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md px-6">
      <div class="w-full mb-8 flex items-center justify-center">
        <appLogo class="relative max-w-30" />
      </div>
      <div class="card-form-comtainer sm:bg-white bg-transparent rounded-2xl sm:p-8">
        <div class="text-start mb-8">
          <div
            v-if="user.email_not_confirmed"
            @click="user.email_not_confirmed = false"
            class="w-fit py-2 mb-2 flex gap-2 items-center hover:opacity-75 transition-opacity duration-150 cursor-pointer"
          >
            <ArrowLeft size="18" />
            <span class="text-black text-sm font-medium">Torna indietro</span>
          </div>
          <h1 class="text-xl font-medium text-black">{{ user.email_not_confirmed ? 'Richiedi conferma della mail' : $t('auth.signin') }}</h1>
        </div>
        <form @submit.prevent class="space-y-6">
          <inputText
            v-model="user.data.email"
            type="email"
            forLabel="email"
            icon="Mail"
            :label="$t('auth.email')"
            :error="user.error.email"
            :required="true"
          />
          <inputText
            v-if="!user.email_not_confirmed"
            v-model="user.data.password"
            type="password"
            forLabel="password"
            icon="KeyRound"
            :label="$t('auth.password')"
            :error="user.error.password"
            :required="true"
          />
          <div v-if="!user.email_not_confirmed" class="text-right">
            <RouterLink to="/forgot-password" class="text-sm text-black font-medium">{{ $t('auth.forgotPassword') }}</RouterLink>
          </div>
          <buttonLg
            @click="actionSignin"
            v-if="!user.email_not_confirmed"
            type="submit"
            variant="primary"
            :label="$t('auth.signin')"
            :loading="user.loading"
            :disabled="user.loading"
            class="w-full"
          />
          <buttonLg
            @click="resendConfirmEmail"
            v-else-if="user.email_not_confirmed"
            type="submit"
            variant="primary"
            label="Richiedi conferma"
            :loading="user.loading"
            :disabled="user.loading"
            class="w-full"
          />
        </form>
        <div v-if="!user.email_not_confirmed" class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 sm:bg-white bg-gray-50 text-gray-500">{{ $t('auth.or') }}</span>
          </div>
        </div>
        <div v-if="!user.email_not_confirmed" class="text-center">
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
import { useAuth } from '../hooks/useAuth';
import { auth } from '../../data/auth';
import { push } from 'notivue';

import supportedDomains from '../../json/supported_domains.json';

import appLogo from '../../components/global/app-logo.vue';
import ButtonLg from '../../components/button/button-lg.vue';
import inputText from '../../components/input/input-text.vue';

// ICONS
import { ArrowLeft } from 'lucide-vue-next';

export default {
  name: 'Signin',
  components: {
    appLogo,
    ButtonLg,
    inputText,

    // ICONS
    ArrowLeft,
  },
  data() {
    return {
      auth,
      user: {
        data: {
          email: 'carlitobatti@gmail.com',
          password: 'carlo',
        },
        error: {
          email: null,
          password: null,
          general: null,
        },
        email_not_confirmed: false,
        loading: false,
      },
    };
  },
  setup() {
    const { getProfile } = useAuth();
    return { getProfile };
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
      this.user.email_not_confirmed = false;

      if (error.code === 'invalid_credentials') {
        this.user.error.general = "L'email o la password inserite non sono corrette";

        push.error({
          title: null,
          message: "L'email o la password inserite non sono corrette",
        });
      } else if (error.code === 'email_not_confirmed') {
        this.user.email_not_confirmed = true;
        this.user.error.general = "L'email non è stata confermata";

        push.error({
          title: null,
          message: "L'email non è stata confermata",
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
          await this.getProfile();

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
    async resendConfirmEmail() {
      this.user.loading = true;

      const isEmailValid = this.validateEmail();

      if (!isEmailValid) {
        this.user.loading = false;
        return;
      }

      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: this.user.data.email,
        });

        if (!error) {
          this.user.email_not_confirmed = false;
        } else {
          this.user.email_not_confirmed = true;
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.user.loading = false;
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
