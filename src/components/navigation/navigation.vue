<template>
  <div
    class="nav fixed z-[9999] top-7 md:left-7 left-3 w-fit h-fit p-2.5 rounded-full flex md:flex-col flex-row gap-2 items-center pr-shadow bg-white"
  >
    <RouterLink to="/" class="md:order-1 order-2">
      <iconButton icon="Grid2x2" :disabled="false" :loading="false" />
    </RouterLink>
    <RouterLink to="/new-qr" class="md:order-2 order-1">
      <iconButton icon="Plus" :disabled="canCreateQR ? false : true" :loading="false" />
    </RouterLink>
    <RouterLink to="/profile" class="md:order-3 order-0 md:mt-1.5 md:mr-0 mr-1.5">
      <avatarRing :showRing="true" :initial="userInitials" :progress="qrProgress" />
    </RouterLink>
  </div>
</template>

<script>
import { auth } from '../../data/auth';
import { store } from '../../data/store';

import avatarRing from '../avatar/avatar-ring.vue';
import iconButton from '../button/icon-button.vue';

export default {
  name: 'navigation',
  components: {
    avatarRing,
    iconButton,
  },
  data() {
    return {
      auth,
      store,
    };
  },
  computed: {
    userPlan() {
      if (!this.auth.profile) {
        return 'free';
      }
      return this.auth.profile.plan || 'free';
    },
    qrLimit() {
      return this.userPlan === 'pro' ? 20 : 2;
    },
    currentQrCount() {
      if (!this.store.qrCodes.data) {
        return 0;
      }
      return this.store.qrCodes.data.length;
    },
    canCreateQR() {
      return this.currentQrCount < this.qrLimit;
    },
    qrProgress() {
      if (this.qrLimit === 0) {
        return 0;
      }
      return Math.min(100, (this.currentQrCount / this.qrLimit) * 100);
    },
    userInitials() {
      if (!this.auth.profile) {
        return 'cb';
      }

      const firstName = this.auth.profile.first_name || '';
      const lastName = this.auth.profile.last_name || '';

      if (firstName && lastName) {
        return (firstName.charAt(0) + lastName.charAt(0)).toLowerCase();
      } else if (firstName) {
        return firstName.substring(0, 2).toLowerCase();
      } else if (this.auth.user?.email) {
        return this.auth.user.email.substring(0, 2).toLowerCase();
      }

      return 'NaN';
    },
  },
};
</script>

<style scoped></style>
