<template>
  <div
    @click="handleClick"
    class="dropdown-option w-full h-11 max-h-11 px-3.5 flex items-center justify-between"
    :class="{ disabled: disabled, 'dropdown-selected': value === selected }"
  >
    <span>{{ option }}</span>
    <Check v-if="value === selected" size="18" />
  </div>
</template>

<script>
// ICONS
import { Check } from 'lucide-vue-next';

export default {
  name: 'dropdown-option',
  components: {
    // ICONS
    Check,
  },
  props: {
    value: String,
    option: String,
    selected: String,
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    handleClick(event) {
      if (!this.disabled) {
        event.stopPropagation();
        this.$emit('click');
      }
    },
  },
};
</script>

<style scoped>
.dropdown-option {
  background-color: transparent;
  color: #373737;

  transition-property: background-color, color;
  transition-duration: 200ms;
  transition-timing-function: ease;
}

.dropdown-option:not(.disabled) {
  cursor: pointer;
}

.dropdown-option.disabled {
  pointer-events: none;
  cursor: not-allowed;
  opacity: 0.25;
}

.dropdown-option:first-child {
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

.dropdown-option:last-child {
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

.dropdown-option:not(.disabled):hover {
  background-color: #eee;
}

.dropdown-option:not(.disabled).dropdown-selected {
  background-color: #eee;
  color: black;
  font-weight: 600;
}
</style>
