<template>
  <div class="avatar-container relative h-11 aspect-square">
    <svg v-if="showRing" class="absolute top-0 left-0 w-full h-full overflow-visible" viewBox="0 0 44 44" style="transform: rotate(-90deg)">
      <circle
        cx="22"
        cy="22"
        r="23"
        fill="none"
        :stroke="dynamicRingColor"
        stroke-width="3"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeDashoffset"
        class="transition-all duration-300 ease-in-out"
      />
    </svg>
    <div class="avatar relative h-10 aspect-square rounded-full flex items-center justify-center bg-[#F4F3F8] cursor-pointer">
      <img v-if="profile_image" :src="profile_image" alt="Profile image" class="w-full h-full object-cover rounded-full" />
      <span v-else-if="!profile_image" class="text-black text-base font-semibold uppercase">{{ initial }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'avatar-ring',
  props: {
    initial: String,
    profile_image: String,
    progress: {
      type: Number,
      default: 0,
      validator: (value) => value >= 0 && value <= 100,
    },
    showRing: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    circumference() {
      return 2 * Math.PI * 23; // raggio = 23
    },
    strokeDashoffset() {
      if (!this.showRing) return this.circumference;
      return this.circumference - (this.progress / 100) * this.circumference;
    },
    dynamicRingColor() {
      if (this.progress === 0) {
        return 'transparent';
      } else if (this.progress < 25) {
        return '#FF2323'; // Rosso
      } else if (this.progress < 50) {
        return '#FF8623'; // Arancione
      } else {
        return '#42FF42'; // Verde
      }
    },
  },
};
</script>

<style scoped>
.avatar {
  position: absolute;
  top: 2px;
  left: 2px;
}
</style>
