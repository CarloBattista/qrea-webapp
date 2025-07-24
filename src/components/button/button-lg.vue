<template>
  <div ref="buttonContainer" class="relative">
    <button
      :type="type"
      :disabled="disabled"
      class="btn-lg min-h-9 max-h-11 h-11 px-4 rounded-lg flex gap-2 items-center justify-center"
      :class="'color-' + variant + ' ' + { loading: loading }"
    >
      <div v-if="icon" class="h-full flex items-center justify-center">
        <component :is="icon" />
      </div>
      <span v-if="label">{{ label }}</span>
      <div v-if="actions" @click.stop="dropdownIsOpen = !dropdownIsOpen" class="h-full flex items-center justify-center cursor-pointer">
        <ChevronDown size="20" />
      </div>
    </button>
    <div
      v-if="actions && dropdownIsOpen"
      class="absolute top-full left-0 mt-1 p-1 min-w-[170px] rounded-lg flex flex-col border border-solid bg-white border-black/10"
    >
      <slot name="options" />
    </div>
  </div>
</template>

<script>
// ICONS
import { ChevronDown } from 'lucide-vue-next';

export default {
  name: 'button-lg',
  components: {
    // ICONS
    ChevronDown,
  },
  props: {
    type: {
      type: String,
      default: 'button',
    },
    variant: {
      type: String,
      default: 'primary',
    },
    actions: {
      type: Boolean,
      default: false,
    },
    icon: String,
    label: String,
    loading: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      dropdownIsOpen: false,
    };
  },
  methods: {
    handleClickOutside(event) {
      // Controlla se il click è avvenuto al di fuori del componente
      if (this.$refs.buttonContainer && !this.$refs.buttonContainer.contains(event.target)) {
        this.dropdownIsOpen = false;
      }
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
.btn-lg {
  border: 1px solid transparent;
  cursor: pointer;

  transition-property: background, background-color, color, opacity, transform;
  transition-duration: 200ms;
  transition-timing-function: ease;
}

.btn-lg:disabled,
.btn-lg.loading {
  cursor: not-allowed;
}

.btn-lg:active {
  transform: scale(0.95);
  opacity: 0.75;
}

/* Primary */
.btn-lg.color-primary {
  background-color: black;
  color: white;
}

.btn-lg.color-primary:hover {
  background-color: rgba(0, 0, 0, 0.75);
}

/* Secondary */
.btn-lg.color-secondary {
  background-color: white;
  border-color: black;
  color: black;
}

.btn-lg.color-secondary:hover {
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
