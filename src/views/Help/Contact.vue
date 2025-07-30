<template>
  <navLp />
  <div class="w-full flex items-center justify-center">
    <div class="w-full max-w-xl px-6">
      <div class="card-form-comtainer sm:bg-white bg-transparent rounded-2xl sm:p-8">
        <div class="text-start mb-8">
          <h1 class="text-xl font-medium text-black">Contattaci</h1>
        </div>
        <form @submit.prevent class="space-y-6">
          <div class="w-full grid grid-cols-2 gap-2">
            <inputText
              v-model="fields.data.first_name"
              type="text"
              forLabel="firstName"
              :label="$t('auth.firstName')"
              :error="fields.error.first_name"
              :required="true"
            />
            <inputText
              v-model="fields.data.last_name"
              type="text"
              forLabel="lastName"
              :label="$t('auth.lastName')"
              :error="fields.error.last_name"
              :required="true"
            />
          </div>
          <inputText
            v-model="fields.data.email"
            type="email"
            forLabel="email"
            :label="$t('auth.email')"
            :error="fields.error.email"
            :required="true"
          />
          <inputText v-model="fields.data.subject" type="text" forLabel="subject" label="Soggetto" :error="fields.error.subject" :required="true" />
          <textArea
            v-model="fields.data.message"
            :viewHelpLength="false"
            forLabel="message"
            label="Come possiamo aiutarti?"
            :error="fields.error.message"
            :required="true"
          />
          <buttonLg
            @click="actionSendEmail"
            type="submit"
            variant="primary"
            :label="$t('auth.continue')"
            :loading="fields.loading"
            :disabled="fields.loading"
            class="w-full"
          />
        </form>
      </div>
    </div>
  </div>
  <footerLp />
</template>

<script>
import { supabase } from '../../lib/supabase';
import { auth } from '../../data/auth';

import supportedDomains from '../../json/supported_domains.json';

import navLp from '../../components/navigation/nav-lp.vue';
import inputText from '../../components/input/input-text.vue';
import textArea from '../../components/input/text-area.vue';
import buttonLg from '../../components/button/button-lg.vue';
import footerLp from '../../components/navigation/footer-lp.vue';

export default {
  name: 'Contact',
  components: {
    navLp,
    inputText,
    textArea,
    buttonLg,
    footerLp,
  },
  data() {
    return {
      auth,
      fields: {
        data: {
          first_name: '',
          last_name: '',
          email: '',
          subject: '',
          message: '',
        },
        error: {
          first_name: null,
          last_name: null,
          email: null,
          subject: null,
          message: null,
          general: null,
        },
        loading: false,
      },
    };
  },
  methods: {
    validateForm() {
      this.fields.error.first_name = null;
      this.fields.error.last_name = null;
      this.fields.error.subject = null;
      this.fields.error.message = null;

      let isValid = true;

      if (!this.fields.data.first_name) {
        this.fields.error.first_name = 'Inserisci il tuo nome';
        isValid = false;
      }

      if (!this.fields.data.last_name) {
        this.fields.error.last_name = 'Inserisci il tuo cognome';
        isValid = false;
      }

      if (!this.fields.data.subject) {
        this.fields.error.subject = 'Inserisci un soggetto';
        isValid = false;
      }

      if (!this.fields.data.message) {
        this.fields.error.message = 'Inserisci il tuo messaggio';
        isValid = false;
      }

      return isValid;
    },
    validateEmail() {
      const supportedDomainsPattern = supportedDomains.join('|');
      const emailRegex = new RegExp(`^[^\\s@]+@(${supportedDomainsPattern})\\.(com|it|org|net|edu|gov|io)$`, 'i');

      if (!this.fields.data.email) {
        this.fields.error.email = 'Inserisci la tua email';
        return false;
      } else if (!emailRegex.test(this.fields.data.email)) {
        this.fields.error.email = 'Inserisci una email valida';
        return false;
      } else {
        this.fields.error.email = null;
        return true;
      }
    },

    async actionSendEmail() {
      this.fields.loading = true;
      this.fields.error.general = null;

      const isFormValid = this.validateForm();
      const isEmailValid = this.validateEmail();

      if (!isFormValid || !isEmailValid) {
        this.fields.loading = false;
        return;
      }

      try {
        alert('Al momento non è possibile inviare la tua richiesta.');
      } catch (e) {
        console.error(e);
      } finally {
        this.fields.loading = false;
      }
    },
  },
  watch: {
    'auth.user': {
      handler(value) {
        if (value.email) {
          this.fields.data.email = value.email;
        } else {
          this.fields.data.email = '';
        }
      },
      deep: true,
    },
    'auth.profile': {
      handler(value) {
        if (value.first_name && value.last_name) {
          this.fields.data.first_name = value.first_name;
          this.fields.data.last_name = value.last_name;
        } else {
          this.fields.data.first_name = '';
          this.fields.data.last_name = '';
        }
      },
      deep: true,
    },
  },
  mounted() {
    window.scrollTo(0, 0);
  },
};
</script>

<style scoped></style>
