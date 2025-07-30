<template>
  <div
    class="nav fixed z-[9999] top-7 md:left-7 left-3 w-fit h-fit p-2.5 rounded-full flex md:flex-col flex-row gap-2 items-center pr-shadow bg-white"
  >
    <RouterLink aria-label="Home" to="/home" class="md:order-1">
      <iconButton icon="Grid2x2" :disabled="false" :loading="false" />
    </RouterLink>
    <RouterLink
      :aria-label="store.planConfig.can_create_qr ? 'Create QR' : 'Pricing'"
      :to="store.planConfig.can_create_qr ? '/new-qr' : '/pricing'"
      class="md:order-2"
    >
      <iconButton icon="Plus" :disabled="store.planConfig.can_create_qr ? false : true" :loading="false" />
    </RouterLink>
    <iconButton v-if="auth.isAuthenticated" @click="actionSignout" icon="DoorOpen" :disabled="false" :loading="false" class="md:order-3" />
    <RouterLink aria-label="Profile" to="/profile" class="md:order-4 order-0 md:mt-1.5 md:mr-0 mr-1.5">
      <avatarRing :showRing="true" :initial="userInitials" :progress="qrProgress" />
    </RouterLink>
  </div>
</template>

<script>
import { supabase } from '../../lib/supabase';
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
    qrProgress() {
      if (this.store.planConfig.qr_limit === 0) {
        return 100;
      }
      const usedPercentage = Math.min(100, (this.store.qrCodes.data?.length / this.store.planConfig.qr_limit) * 100);
      return 100 - usedPercentage;
    },
    userInitials() {
      if (!this.auth.profile) {
        return '';
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

      return '';
    },
  },
  methods: {
    async actionSignout() {
      if (!this.auth.isAuthenticated) {
        return;
      }

      if (confirm(this.$t('navigation.signOutConfirm'))) {
        try {
          const { error } = await supabase.auth.signOut();

          if (!error) {
            this.auth.user = null;
            this.auth.session = null;
            this.auth.profile = null;
            this.auth.isAuthenticated = false;
            localStorage.removeItem('isAuthenticated');

            this.$router.push({ name: 'signin' });
          }
        } catch (e) {
          console.error(e);
        }
      }
    },
  },
};
</script>

<style scoped></style>
