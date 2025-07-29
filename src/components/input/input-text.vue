<template>
  <div @click="focusInput" class="field-container relative w-full flex flex-col gap-2" :class="{ focus: focus, error: error, disabled: disabled }">
    <label v-if="label" :for="forLabel" class="input-label text-sm font-medium">{{ label }}</label>
    <div
      @focus="handleFocus"
      @blur="handleBlur"
      class="input-container relative w-full h-12 max-h-12 px-4 rounded-lg flex gap-2 items-center justify-start border border-solid"
    >
      <div v-if="icon" class="input-icon h-full flex items-center justify-center opacity-50 pointer-events-none">
        <component :is="icon" size="18" />
      </div>
      <input
        ref="inputElement"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="updateValue"
        :value="modelValue"
        :id="forLabel"
        :type="inputType"
        :placeholder="placeholder"
        :readonly="readOnly"
        :disabled="disabled"
        class="w-full h-full outline-0"
      />
      <div
        v-if="type === 'password'"
        @click="toggleShowPassword"
        class="absolute top-0 right-4 h-full flex items-center justify-center cursor-pointer"
      >
        <Eye v-if="!showPassword" size="20" />
        <EyeClosed v-else size="20" />
      </div>
    </div>
    <div v-if="error" class="input-error relative w-full flex gap-2 items-center">
      <p class="text-[#e50914] text-xs font-medium">{{ error }}</p>
    </div>
  </div>
</template>

<script>
// ICONS
import { Eye, EyeClosed, KeyRound } from 'lucide-vue-next';

export default {
  name: 'input-text',
  components: {
    // ICONS
    Eye,
    EyeClosed,
    KeyRound,
  },
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'text',
    },
    forLabel: String,
    icon: String,
    label: String,
    placeholder: String,
    helpText: String,
    error: String,
    required: Boolean,
    readOnly: {
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
      focus: false,
      showPassword: false,
    };
  },
  computed: {
    inputType() {
      if (this.type === 'password') {
        return this.showPassword ? 'text' : 'password';
      }
      return this.type;
    },
  },
  methods: {
    updateValue(event) {
      this.$emit('update:modelValue', event.target.value);
    },
    focusInput() {
      if (!this.disabled && this.$refs.inputElement) {
        this.$refs.inputElement.focus();
      }
    },
    toggleShowPassword() {
      this.showPassword = !this.showPassword;
    },
    handleFocus() {
      this.focus = true;
    },
    handleBlur() {
      this.focus = false;
    },
  },
};
</script>

<style scoped>
.input-container {
  background-color: white;
  color: black;
  border-color: rgba(0, 0, 0, 0.2);
  outline-color: transparent;
  cursor: text;

  /* transition-property: background-color, color, border-color, border-width, outline-color, outline-width;
  transition-duration: 200ms;
  transition-timing-function: ease; */
}

.field-container.focus .input-container {
  border-color: black;
  outline-color: black;
  outline-width: 1px;
  outline-style: solid;
}

.field-container.error .input-container {
  border-color: #e50914;
  outline-color: #e50914;
  outline-width: 1px;
  outline-style: solid;
}

.field-container.disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}
</style>
