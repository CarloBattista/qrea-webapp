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
        <div v-if="user.sent" class="w-full">
          <p>
            Ti abbiamo inviato una email all'indirizzo <b>{{ user.data.email }}</b
            >. Clicca sul link contenuto nel messaggio per impostare una nuova password.
          </p>
          <p class="mt-5">Se non ricevi nessuna email o hai dubbi sull'indirizzo email di accesso scrivi ad <b>assistenza@qrea.com</b> .</p>
          <RouterLink to="/signin">
            <buttonLg type="button" variant="secondary" :label="$t('auth.signin')" :loading="false" :disabled="false" class="w-full mt-6" />
          </RouterLink>
        </div>
        <form v-if="!user.sent" @submit.prevent="sendPasswordReset" class="space-y-6">
          <inputText v-model="user.data.email" type="email" forLabel="email" icon="Mail" :label="$t('auth.email')" :error="user.error.email" />
          <buttonLg type="submit" variant="primary" label="Modifica password" :loading="user.loading" :disabled="user.loading" class="w-full" />
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

import supportedDomains from '../../json/supported_domains.json';

import appLogo from '../../components/global/app-logo.vue';
import ButtonLg from '../../components/button/button-lg.vue';
import inputText from '../../components/input/input-text.vue';

export default {
  name: 'Forgot-password',
  components: {
    appLogo,
    ButtonLg,
    inputText,
  },
  data() {
    return {
      user: {
        data: {
          email: '',
        },
        error: {
          email: null,
          general: null,
        },
        sent: false,
        loading: false,
        cooldownActive: false,
        cooldownTime: 60,
      },
      cooldownInterval: null,
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

    async sendPasswordReset() {
      this.user.loading = true;
      this.user.error.general = null;

      const isEmailValid = this.validateEmail();
      const email = this.user.data.email;

      if (!isEmailValid) {
        this.user.loading = false;
        return;
      }

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (!error) {
          // console.log(data);
          this.user.sent = true;
          this.startCooldown();
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
