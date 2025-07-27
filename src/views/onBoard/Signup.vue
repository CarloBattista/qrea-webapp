<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md px-6">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-black mb-2">{{ $t('auth.signup') }}</h1>
        <p class="text-gray-600"></p>
      </div>
      <div class="sm:bg-white bg-transparent rounded-2xl sm:p-8 sm:pr-shadow">
        <form @submit.prevent="actionSignup" class="space-y-6">
          <div class="w-full grid grid-cols-2 gap-2">
            <div>
              <label for="first_name" class="block text-sm font-medium text-gray-700">{{ $t('auth.firstName') }}</label>
              <input
                id="first_name"
                v-model="user.data.first_name"
                type="text"
                :placeholder="$t('auth.firstNamePlaceholder')"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 outline-none"
                :class="{ 'border-red-500': user.error.first_name }"
              />
              <p v-if="user.error.first_name" class="text-red-500 text-sm">{{ user.error.first_name }}</p>
            </div>
            <div>
              <label for="last_name" class="block text-sm font-medium text-gray-700">{{ $t('auth.lastName') }}</label>
              <input
                id="last_name"
                v-model="user.data.last_name"
                type="text"
                :placeholder="$t('auth.lastNamePlaceholder')"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 outline-none"
                :class="{ 'border-red-500': user.error.last_name }"
              />
              <p v-if="user.error.last_name" class="text-red-500 text-sm">{{ user.error.last_name }}</p>
            </div>
          </div>
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
          <div class="pt-4">
            <button-lg type="submit" variant="primary" :label="$t('auth.continue')" :loading="user.loading" :disabled="user.loading" class="w-full" />
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
            {{ $t('auth.alreadyHaveAccount') }}
            <router-link to="/signin" class="font-medium text-black hover:underline"> {{ $t('auth.signin') }} </router-link>
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

import ButtonLg from '../../components/button/button-lg.vue';

export default {
  name: 'Signup',
  components: {
    ButtonLg,
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

    async actionSignup() {
      this.user.loading = true;
      this.user.error.general = null;

      const isEmailValid = this.validateEmail();
      const isPasswordValid = this.validatePassword();

      if (!isEmailValid || !isPasswordValid) {
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
          plan: 'free',
          lang: 'en-US',
        });

        if (!error) {
          this.$router.push({ name: 'signin' });
        }
      } catch (e) {
        console.error(e);
      }
    },
  },
};
</script>

<style scoped>
input:focus {
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
}
</style>
