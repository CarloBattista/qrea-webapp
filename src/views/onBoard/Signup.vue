<template>
  <div class="w-full">
    <form @submit.prevent class="max-w-[450px] mx-auto pt-28 flex flex-col gap-2">
      <input v-model="user.data.first_name" type="text" placeholder="First name" required />
      <input v-model="user.data.last_name" type="text" placeholder="Last name" required />
      <input v-model="user.data.email" type="email" placeholder="Email address" required />
      <input v-model="user.data.password" type="password" placeholder="Password" required />
      <button @click="actionSignup" type="submit">Continue</button>
    </form>
  </div>
</template>

<script>
import { supabase } from '../../lib/supabase';
import { auth } from '../../data/auth';

export default {
  name: 'Signup',
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
        },
        loading: false,
      },
    };
  },
  methods: {
    async actionSignup() {
      this.user.loading = true;

      try {
        const { error } = await supabase.auth.signUp({
          email: this.user.data.email,
          password: this.user.data.password,
        });

        if (!error) {
          // console.log(data);

          this.$router.push({ name: 'signin' });
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
