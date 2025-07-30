<template>
  <div @click="focusInput" class="field-container relative w-full flex flex-col gap-2" :class="{ focus: focus, error: error, disabled: disabled }">
    <label v-if="label" :for="forLabel" class="input-label text-sm font-medium">{{ label }} <span v-if="required">*</span></label>
    <div
      @focus="handleFocus"
      @blur="handleBlur"
      class="input-container relative w-full px-4 py-2 rounded-lg flex gap-2 items-start justify-start border border-solid"
    >
      <div v-if="icon" class="input-icon flex items-center justify-center opacity-50 pointer-events-none">
        <component :is="icon" size="18" />
      </div>
      <textarea
        ref="inputElement"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="updateValue"
        :value="modelValue"
        :minlength="minlength"
        :maxlength="maxlength"
        :name="forLabel"
        :id="forLabel"
        :readonly="readOnly"
        :required="required"
        :disabled="disabled"
        class="w-full min-h-[100px] max-h-[100px] outline-0 resize-none"
      ></textarea>
      <div v-if="viewHelpLength" class="absolute right-3 bottom-1 pointer-events-none">
        <span class="text-xs font-normal help-text">{{ modelValue.length }}/{{ maxlength }}</span>
      </div>
    </div>
    <div v-if="error" class="input-error relative w-full flex gap-2 items-center">
      <p class="text-[#e50914] text-xs font-medium">{{ error }}</p>
    </div>
  </div>
</template>

<script>
// ICONS
import { KeyRound } from 'lucide-vue-next';

export default {
  name: 'text-area',
  components: {
    // ICONS
    KeyRound,
  },
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    forLabel: String,
    icon: String,
    label: String,
    minlength: {
      type: Number,
      default: 0,
    },
    maxlength: {
      type: Number,
      default: 255,
    },
    viewHelpLength: {
      type: Boolean,
      default: true,
    },
    helpText: String,
    error: String,
    required: Boolean,
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      focus: false,
    };
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
