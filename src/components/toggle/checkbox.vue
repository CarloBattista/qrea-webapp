<template>
  <div class="checkbox-container relative flex gap-2 items-center" :class="{ disabled: disabled }">
    <div class="checkbox relative h-6 aspect-square rounded-lg flex items-center justify-center" :class="{ checked: selected }">
      <Check v-if="selected" size="18" color="white" />
    </div>
    <span v-if="label" class="text-black text-sm font-medium">{{ label }}</span>
  </div>
</template>

<script>
// ICONS
import { Check } from 'lucide-vue-next';

export default {
  name: 'checkbox',
  components: {
    // ICONS
    Check,
  },
  props: {
    selected: Boolean,
    label: String,
    disabled: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped>
.checkbox-container.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.checkbox-container:not(.disabled) {
  cursor: pointer;
}

.checkbox {
  background-color: white;
  border: 1px solid black;
}

.checkbox.checked {
  background-color: black;
}
</style>
