<template>
  <div ref="dropdownContainer" class="dropdown-container relative" :class="{ disabled: disabled, 'dropdown-open': isOpen }">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-2">{{ label }}</label>
    <div
      @click="handleDropdown"
      class="dropdown w-auto h-11 max-h-11 min-w-44 rounded-[10px] px-3.5 py-1.5 flex items-center justify-between border border-solid bg-white text-black"
    >
      <span class="text-sm font-medium">{{ selected }}</span>
      <ChevronDown size="18" class="transition-transform duration-200" :class="{ 'rotate-180': isOpen }" />
    </div>
    <Transition name="appear-fade">
      <div
        v-if="isOpen"
        @option-selected="handleOptionSelected"
        class="absolute z-[9999] mt-2.5 top-full left-0 w-full min-h-11 max-h-[220px] rounded-[10px] pxl-shadow bg-white overflow-y-auto cursor-default"
      >
        <slot name="content" />
      </div>
    </Transition>
  </div>
</template>

<script>
// ICONS
import { ChevronDown } from 'lucide-vue-next';

export default {
  name: 'dropdown',
  components: {
    // ICONS
    ChevronDown,
  },
  props: {
    label: String,
    selected: String,
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isOpen: false,
    };
  },
  provide() {
    return {
      selectOption: this.handleOptionSelected,
    };
  },
  methods: {
    handleDropdown() {
      if (this.disabled) {
        return;
      }

      this.isOpen = !this.isOpen;
    },
    handleClickOutside(event) {
      if (this.$refs.dropdownContainer && !this.$refs.dropdownContainer.contains(event.target)) {
        this.isOpen = false;
      }
    },
    handleOptionSelected(value) {
      this.$emit('option-selected', value);
      this.isOpen = false;
    },
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
};
</script>

<style scoped>
.dropdown-container:not(.disabled) {
  cursor: pointer;
}

.dropdown-container.disabled {
  border-color: #ddd;
  opacity: 0.5;
  pointer-events: none;
}

.dropdown {
  border-color: #ddd;
  transition-property: background-color, color, border-color;
  transition-duration: 200ms;
  transition-timing-function: ease;
}

.dropdown-container.dropdown-open .dropdown,
.dropdown-container:not(.disabled) .dropdown:hover {
  border-color: #000;
}

.appear-fade-enter-active,
.appear-fade-leave-active {
  transform-origin: top center;
  transition-property: opacity, transform;
  transition-duration: 200ms;
  transition-timing-function: ease;
}

.appear-fade-enter-from,
.appear-fade-leave-to {
  opacity: 0;
  transform: scaleY(0.85);
}
</style>
