<template>
  <div>
    <RouterView />
  </div>
</template>

<script>
import { supabase } from './lib/supabase';
import { auth } from './data/auth';

export default {
  name: 'App',
  data() {
    return {
      auth,
    };
  },
  methods: {
    async getUser() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (!error) {
          // console.log(data);

          this.auth.user = data.user;
          this.auth.isAuthenticated = true;

          localStorage.setItem('isAuthenticated', true);

          this.getSession();
        }
      } catch (e) {
        console.error(e);
      }
    },
    async getSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!error) {
          // console.log(data);
          this.auth.session = data.session;
        }
      } catch (e) {
        console.error(e);
      }
    },
    async getProfile() {
      if (!this.auth.user?.id) return;

      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('uid', this.auth.user.id).maybeSingle();

        if (!error) {
          // console.log(data);
          this.auth.profile = data;
        }
      } catch (e) {
        console.error(e);
      }
    },
  },
  watch: {
    'auth.user': {
      handler(value) {
        if (value) {
          this.getSession();
          this.getProfile();
        }
      },
      deep: true,
    },
  },
  mounted() {
    this.getUser();
  },
};
</script>

<style scoped></style>
