<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md px-6">
      <div class="w-full mb-8 flex items-center justify-center">
        <appLogo class="relative max-w-30" />
      </div>
      <div class="card-form-comtainer sm:bg-white bg-transparent rounded-2xl sm:p-8">
        <div class="text-start mb-8">
          <h1 class="text-xl font-medium text-black">{{ user.create ? 'Conferma email' : $t('auth.signup') }}</h1>
        </div>
        <div v-if="user.create" class="w-full">
          <p>
            Prima di continuare, verifica la tua email <b>{{ user.data?.email }}</b>
          </p>
          <p class="mt-5">Se non ricevi nessuna email o hai dubbi, scrivi ad <b>assistenza@qrea.com</b> .</p>
          <RouterLink to="/signin">
            <buttonLg type="button" variant="secondary" :label="$t('auth.signin')" :loading="false" :disabled="false" class="w-full mt-6" />
          </RouterLink>
        </div>
        <form v-else-if="!user.create" @submit.prevent="actionSignup" class="space-y-6">
          <div class="w-full grid grid-cols-2 gap-2">
            <inputText
              v-model="user.data.first_name"
              type="text"
              forLabel="firstName"
              :label="$t('auth.firstName')"
              :error="user.error.first_name"
              :required="true"
            />
            <inputText
              v-model="user.data.last_name"
              type="text"
              forLabel="lastName"
              :label="$t('auth.lastName')"
              :error="user.error.last_name"
              :required="true"
            />
          </div>
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
            v-model="user.data.password"
            type="password"
            forLabel="password"
            icon="KeyRound"
            :label="$t('auth.password')"
            :error="user.error.password"
            :required="true"
          />
          <buttonLg type="submit" variant="primary" :label="$t('auth.continue')" :loading="user.loading" :disabled="user.loading" class="w-full" />
        </form>
        <div v-if="!user.create" class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 sm:bg-white bg-gray-50 text-gray-500">{{ $t('auth.or') }}</span>
          </div>
        </div>
        <div v-if="!user.create" class="text-center">
          <p class="text-sm text-gray-600">
            {{ $t('auth.alreadyHaveAccount') }}
            <RouterLink to="/signin" class="font-medium text-black hover:underline">{{ $t('auth.signin') }}</RouterLink>
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
import { useValidation } from '../../hooks/useValidation';

import appLogo from '../../components/global/app-logo.vue';
import ButtonLg from '../../components/button/button-lg.vue';
import inputText from '../../components/input/input-text.vue';

export default {
  name: 'Signup',
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
          first_name: '',
          last_name: '',
          email: '',
          password: '',
        },
        error: {
          first_name: null,
          last_name: null,
          email: null,
          password: null,
          general: null,
        },
        create: false,
        loading: false,
      },
    };
  },
  setup() {
    const validation = useValidation();
    return { validation };
  },
  computed: {
    validationErrors() {
      return this.validation.errors;
    },
  },
  methods: {
    validateForm() {
      return this.validation.signupForm(this.user.data);
    },
    validateEmail() {
      return this.validation.email(this.user.data.email);
    },
    validatePassword() {
      return this.validation.password(this.user.data.password);
    },

    async actionSignup() {
      this.user.loading = true;
      this.validation.clearErrors();

      const isValid = this.validateForm();

      if (!isValid) {
        this.user.loading = false;
        return;
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email: this.user.data.email,
          password: this.user.data.password,
        });

        if (!error) {
          // console.log(data);
          const userId = data.user.id;
          this.user.create = true;

          await this.createProfile(userId);
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.user.loading = false;
      }
    },
    async createProfile(userId) {
      try {
        const { error } = await supabase.from('profiles').insert({
          uid: userId,
          first_name: this.user.data.first_name,
          last_name: this.user.data.last_name,
          lang: 'it-IT',
        });

        if (!error) {
          this.user.create = true;
          // this.$router.push({ name: 'signin' });
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
