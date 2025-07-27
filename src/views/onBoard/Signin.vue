<template>
  <div class="w-full">
    <form @submit.prevent class="max-w-[450px] mx-auto pt-28 flex flex-col gap-2">
      <input v-model="user.data.email" type="email" placeholder="Email address" required />
      <input v-model="user.data.password" type="password" placeholder="Password" required />
      <button @click="actionSignin" type="submit">Continue</button>
    </form>
  </div>
</template>

<script>
import { supabase } from '../../lib/supabase';
import { auth } from '../../data/auth';

export default {
  name: 'Signin',
  data() {
    return {
      auth,

      user: {
        data: {
          email: 'admin@gmail.com',
          password: 'admin',
        },
        error: {
          email: null,
          password: null,
        },
        loading: false,
      },
    };
  },
  methods: {
    async actionSignin() {
      this.user.loading = true;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: this.user.data.email,
          password: this.user.data.password,
        });

        if (!error) {
          // console.log(data);

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

<style scoped></style>
