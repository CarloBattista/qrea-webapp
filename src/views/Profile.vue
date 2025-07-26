<template>
  <navigation />
  <div class="w-full md:px-6 px-3 pt-30 pb-10">
    <div class="max-w-[550px] mx-auto">
      <div class="w-full flex flex-col gap-2">
        <h2 class="text-black text-2xl font-semibold">Profile and settings</h2>
        <p class="text-black text-base font-normal">Manage your profile</p>
      </div>
      <div class="w-full my-8 flex flex-col gap-8">
        <div class="card w-full p-8 rounded-4xl pr-shadow bg-white">
          <h2 class="text-sm font-medium text-gray-400">Account</h2>
          <div class="w-full flex flex-col">
            <div class="w-full mt-4 h-9 flex items-center justify-between text-base font-normal">
              <h2 class="text-start">Full name</h2>
              <span class="text-end">{{ auth.profile?.first_name }} {{ auth.profile?.last_name }}</span>
            </div>
            <div class="w-full h-9 flex items-center justify-between text-base font-normal">
              <h2 class="text-start">Email</h2>
              <span class="text-end">{{ auth.user?.email }}</span>
            </div>
          </div>
        </div>
        <div class="card w-full p-8 rounded-4xl pr-shadow bg-white">
          <h2 class="text-sm font-medium text-gray-400">Subscription Plan</h2>
          <div class="w-full flex flex-col">
            <div class="w-full h-9 flex items-center justify-between text-base font-normal">
              <h2 class="text-start">Subscription</h2>
              <badge :label="typeSubscription" />
            </div>
          </div>
          <div class="w-full mt-4 flex items-center justify-end">
            <buttonLg v-if="typeSubscription === 'Pro'" type="button" variant="destructive" label="Disattiva abbonamento" />
            <RouterLink v-else-if="typeSubscription === 'Free'" to="/pricing">
              <buttonLg type="button" variant="primary" label="Upgrade to Pro" />
            </RouterLink>
          </div>
        </div>
        <div v-if="false" class="card w-full p-8 rounded-4xl pr-shadow bg-white">
          <h2 class="text-sm font-medium text-gray-400">Billing History</h2>
          <div class="w-full flex flex-col">
            <div class="w-full mt-4 h-9 flex items-center justify-between text-base font-normal">
              <h2 class="text-start">Pro plan - 10$</h2>
              <span class="text-end">2025/07/07 17:39</span>
            </div>
            <div class="w-full mt-4 h-9 flex items-center justify-between text-base font-normal">
              <h2 class="text-start">Pro plan - 10$</h2>
              <span class="text-end">2025/07/07 17:39</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from '../data/auth';

import navigation from '../components/navigation/navigation.vue';
import buttonLg from '../components/button/button-lg.vue';
import badge from '../components/badge/badge.vue';

export default {
  name: 'Profile',
  components: {
    navigation,
    buttonLg,
    badge,
  },
  data() {
    return {
      auth,
    };
  },
  computed: {
    typeSubscription() {
      const plan = this.auth?.profile.plan;

      const freePlan = 'free';
      const proPlan = 'pro';

      if (plan === freePlan) {
        return 'Free';
      } else if (plan === proPlan) {
        return 'Pro';
      }

      return 'Free';
    },
  },
};
</script>

<style scoped></style>
