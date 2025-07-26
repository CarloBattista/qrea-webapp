<template>
  <button
    :type="type"
    :disabled="disabled"
    class="icon-button min-h-9 max-h-12 bg-[#F4F3F8] hover:bg-[#E9E9E9] relative aspect-square rounded-full flex items-center justify-center"
    :class="'color-' + variant + ' ' + { loading: loading }"
  >
    <component :is="icon" size="20" />
  </button>
</template>

<script>
// ICONS
import { Grid2x2, Plus } from 'lucide-vue-next';

export default {
  name: 'icon-button',
  components: {
    // ICONS
    Grid2x2,
    Plus,
  },
  props: {
    type: {
      type: String,
      default: 'button',
    },
    icon: String,
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped>
.icon-button {
  cursor: pointer;

  transition-property: background, background-color, color, opacity, transform;
  transition-duration: 200ms;
  transition-timing-function: ease;
}

.icon-button:disabled,
.icon-button.loading {
  cursor: not-allowed;
}

.icon-button:active {
  transform: scale(0.95);
  opacity: 0.75;
}
</style>
