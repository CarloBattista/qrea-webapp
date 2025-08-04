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
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../data/auth';
import { push } from 'notivue';
import { useValidation } from '../../hooks/useValidation';
import { handleAuthError } from '../../lib/validation';

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
    const validation = useValidation();

    return { getProfile, validation };
  },
  computed: {
    validationErrors() {
      return this.validation.errors;
    },
  },
  methods: {
    validateEmail() {
      return this.validation.email(this.user.data.email);
    },
    validatePassword() {
      return this.validation.password(this.user.data.password, false); // Non richiede password forte per il login
    },
    retrieveError(error) {
      this.user.email_not_confirmed = false;
      const authError = handleAuthError(error);

      if (authError.type === 'email_not_confirmed') {
        this.user.email_not_confirmed = true;
      }

      this.validation.setError(authError.field, authError.message);

      push.error({
        title: null,
        message: authError.message,
      });
    },

    async actionSignin() {
      this.validation.clearErrors();

      const isValid = this.validation.signinForm(this.user.data);

      if (!isValid) {
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

          if (this.auth.subscription || this.auth.subscription?.plan === 'pro') {
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

      const isEmailValid = this.validation.email(this.user.data.email);

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
