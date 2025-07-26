<template>
  <div
    class="nav fixed z-[9999] top-7 md:left-7 left-3 w-fit h-fit p-2.5 rounded-full flex md:flex-col flex-row gap-2 items-center pr-shadow bg-white"
  >
    <RouterLink to="/" class="md:order-1 order-2">
      <iconButton icon="Grid2x2" :disabled="false" :loading="false" />
    </RouterLink>
    <RouterLink to="/new-qr" class="md:order-2 order-1">
      <iconButton icon="Plus" :disabled="false" :loading="false" />
    </RouterLink>
    <RouterLink to="/profile" class="md:order-3 order-0 md:mt-1.5 md:mr-0 mr-1.5">
      <avatarRing :showRing="true" initial="cb" :progress="23" />
    </RouterLink>
  </div>
</template>

<script>
import avatarRing from '../avatar/avatar-ring.vue';
import iconButton from '../button/icon-button.vue';

export default {
  name: 'navigation',
  components: {
    avatarRing,
    iconButton,
  },
};
</script>

<style scoped></style>
