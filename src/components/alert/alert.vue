<template>
  <div v-if="visible" :class="['flex items-center justify-between p-4 rounded-lg border', alertClasses]" role="alert">
    <div class="flex items-start">
      <div class="flex-shrink-0 mr-3">
        <Check v-if="!customIcon && type === 'success'" />
        <Ban v-else-if="!customIcon && type === 'error'" />
        <TriangleAlert v-else-if="!customIcon && type === 'warning'" />
        <Info v-else-if="!customIcon && type === 'info'" />
        <component v-if="customIcon" :is="customIcon" />
      </div>
      <div class="flex-1">
        <h3 v-if="title" class="font-medium text-sm mb-1">{{ title }}</h3>
        <p class="text-sm">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<script>
// ICONS
import { Check, Ban, TriangleAlert, Info } from 'lucide-vue-next';

export default {
  name: 'Alert',
  components: {
    // ICONS
    Check,
    Ban,
    TriangleAlert,
    Info,
  },
  props: {
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['success', 'error', 'warning', 'info'].includes(value),
    },
    customIcon: String,
    title: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      required: true,
    },
    dismissible: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      visible: true,
    };
  },
  computed: {
    alertClasses() {
      const classes = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
      };
      return classes[this.type] || classes.info;
    },
  },
};
</script>

<style scoped></style>
