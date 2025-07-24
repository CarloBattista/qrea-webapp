<template>
  <div class="color-picker-wrapper relative inline-block">
    <input type="color" class="color-picker" :value="modelValue" @input="updateValue" :disabled="disabled" />
    <div class="color-preview" :style="{ backgroundColor: modelValue }"></div>
  </div>
</template>

<script>
export default {
  name: 'color-picker',
  props: {
    modelValue: {
      type: String,
      default: '#000',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    size: {
      type: String,
      default: '48px',
    },
  },
  emits: ['update:modelValue'],
  methods: {
    updateValue(event) {
      this.$emit('update:modelValue', event.target.value);
    },
  },
};
</script>

<style scoped>
.color-picker-wrapper {
  width: v-bind(size);
  height: v-bind(size);
}

.color-picker {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-color: transparent;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}

.color-picker:disabled {
  cursor: not-allowed;
}

.color-preview {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid #e0e0e0;
  /* box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); */
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
}

.color-picker:focus + .color-preview {
  outline: 2px solid #000;
  outline-offset: 2px;
}

.color-picker:disabled + .color-preview {
  opacity: 0.5;
  transform: none;
}
</style>
