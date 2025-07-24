<template>
  <div
    class="slider-container relative w-full h-6 flex items-center cursor-pointer"
    @mousedown="startDrag"
    @touchstart="startDrag"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
    ref="sliderContainer"
  >
    <div class="slider-bar relative w-full h-2 rounded-full bg-white border border-gray-200">
      <div class="slider-progress absolute top-0 left-0 h-full rounded-full bg-black" :style="{ width: progressPercentage + '%' }"></div>
      <div
        class="slider-handle absolute top-1/2 h-4 aspect-square rounded-full bg-black cursor-grab active:cursor-grabbing"
        :style="{ left: progressPercentage + '%', transform: 'translateX(-50%) translateY(-50%)' }"
      ></div>
    </div>
    <div
      v-show="showPreview"
      class="absolute -top-8 left-0 px-2 py-1 rounded-lg text-sm font-medium shadow shadow-black/15 bg-black text-white"
      :style="{ left: progressPercentage + '%', transform: 'translateX(-50%)' }"
    >
      {{ modelValue }}{{ previewExtraValue }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'slider-bar',
  props: {
    modelValue: {
      type: Number,
      default: 0,
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 100,
    },
    step: {
      type: Number,
      default: 1,
    },
    previewExtraValue: String,
  },
  emits: ['update:modelValue'],
  data() {
    return {
      isDragging: false,
      isHovering: false,
      startX: 0,
      startValue: 0,
    };
  },
  computed: {
    progressPercentage() {
      const range = this.max - this.min;
      const value = this.modelValue - this.min;
      return Math.max(0, Math.min(100, (value / range) * 100));
    },
    showPreview() {
      return this.isDragging || this.isHovering;
    },
  },
  methods: {
    startDrag(event) {
      this.isDragging = true;
      this.startX = this.getEventX(event);
      this.startValue = this.modelValue;

      // Calcola immediatamente il nuovo valore basato sulla posizione del click
      this.updateValueFromPosition(event);

      document.addEventListener('mousemove', this.onDrag);
      document.addEventListener('mouseup', this.stopDrag);
      document.addEventListener('touchmove', this.onDrag);
      document.addEventListener('touchend', this.stopDrag);

      event.preventDefault();
    },

    onDrag(event) {
      if (!this.isDragging) return;
      this.updateValueFromPosition(event);
      event.preventDefault();
    },

    stopDrag() {
      this.isDragging = false;
      document.removeEventListener('mousemove', this.onDrag);
      document.removeEventListener('mouseup', this.stopDrag);
      document.removeEventListener('touchmove', this.onDrag);
      document.removeEventListener('touchend', this.stopDrag);
    },

    updateValueFromPosition(event) {
      const rect = this.$refs.sliderContainer.getBoundingClientRect();
      const x = this.getEventX(event) - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));

      const range = this.max - this.min;
      let newValue = this.min + percentage * range;

      // Applica lo step
      newValue = Math.round(newValue / this.step) * this.step;

      // Assicurati che il valore sia nei limiti
      newValue = Math.max(this.min, Math.min(this.max, newValue));

      if (newValue !== this.modelValue) {
        this.$emit('update:modelValue', newValue);
      }
    },

    getEventX(event) {
      return event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
    },
  },

  beforeUnmount() {
    // Cleanup degli event listeners
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
    document.removeEventListener('touchmove', this.onDrag);
    document.removeEventListener('touchend', this.stopDrag);
  },
};
</script>

<style scoped>
.slider-handle {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider-handle:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.slider-container:active .slider-handle {
  transform: translateX(-50%) translateY(-50%) scale(1.1) !important;
}
</style>
