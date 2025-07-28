<template>
  <div ref="buttonContainer" class="relative">
    <button
      :type="type"
      :disabled="disabled"
      class="btn-lg w-[inherit] min-h-9 max-h-11 h-11 px-4 rounded-[10px] flex gap-2 items-center justify-center"
      :class="'color-' + variant + ' ' + { loading: loading }"
    >
      <span v-if="loading" class="loader"></span>
      <div v-if="leftIcon" class="h-full flex items-center justify-center">
        <component :is="leftIcon" size="20" />
      </div>
      <span v-if="label" class="font-medium overflow-text-ellipsis">{{ label }}</span>
      <div v-if="rightIcon" class="h-full flex items-center justify-center">
        <component :is="rightIcon" size="20" />
      </div>
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
import { ChevronDown, ArrowRight } from 'lucide-vue-next';

export default {
  name: 'button-lg',
  components: {
    // ICONS
    ChevronDown,
    ArrowRight,
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
    leftIcon: String,
    rightIcon: String,
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
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-lg:not(:disabled):active {
  transform: scale(0.95);
  opacity: 0.75;
}

.btn-lg:not(:disabled):focus::before {
  position: absolute;
  top: 0;
  left: 0;
  content: '';
  width: 100%;
  height: 100%;
  border-radius: 10px;
  outline-width: 2px;
  outline-offset: 2px;
  outline-style: solid;
  outline-color: black;
}

/* Primary */
.btn-lg.color-primary {
  background-color: black;
  color: white;
}

.btn-lg.color-primary:not(:disabled):hover,
.btn-lg.color-primary:not(:disabled):focus {
  background-color: rgba(0, 0, 0, 0.75);
}

.btn-lg.color-primary .loader::before {
  border-color: white;
}

/* Secondary */
.btn-lg.color-secondary {
  background-color: transparent;
  border-color: black;
  color: black;
}

.btn-lg.color-secondary:not(:disabled):hover,
.btn-lg.color-secondary:not(:disabled):focus {
  background-color: rgba(0, 0, 0, 0.2);
}

.btn-lg.color-secondary .loader::before {
  border-color: black;
}

/* Secondary inverted */
.btn-lg.color-secondary-inverted {
  background-color: transparent;
  border-color: white;
  color: white;
}

.btn-lg.color-secondary-inverted:not(:disabled):hover,
.btn-lg.color-secondary-inverted:not(:disabled):focus {
  background-color: rgba(255, 255, 255, 0.2);
}

.btn-lg.color-secondary-inverted .loader::before {
  border-color: white;
}

/* Destructive */
.btn-lg.color-destructive {
  background-color: rgb(255, 35, 35);
  border-color: transparent;
  color: white;
}

.btn-lg.color-destructive:not(:disabled):hover,
.btn-lg.color-destructive:not(:disabled):focus {
  background-color: rgba(255, 35, 35, 0.75);
}

.btn-lg.color-destructive .loader::before {
  border-color: white;
}

/* Loader */
.loader {
  width: 22px;
  aspect-ratio: 1;
  border-radius: 50%;
  position: relative;
  animation: rotate 1s linear infinite;
}

.loader::before {
  content: '';
  box-sizing: border-box;
  position: absolute;
  inset: 0px;
  border-radius: 50%;
  border: 3px solid #fff;
  animation: prixClipFix 2s linear infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes prixClipFix {
  0% {
    clip-path: polygon(50% 50%, 0 0, 0 0, 0 0, 0 0, 0 0);
  }
  25% {
    clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 0, 100% 0, 100% 0);
  }
  50% {
    clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 100% 100%, 100% 100%);
  }
  75% {
    clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%, 0 100%);
  }
  100% {
    clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%, 0 0);
  }
}
</style>
