<template>
  <div class="card-feature relative flex gap-5 items-center cursor-pointer">
    <div class="card-icon relative h-20 aspect-square rounded-2xl flex items-center justify-center">
      <component :is="data?.icon" />
    </div>
    <div class="w-full flex flex-col">
      <h2 class="text-black text-sm font-semibold">
        {{ data?.title }} <span v-if="data?.coming" class="ml-2 px-2 py-1 rounded-2xl text-xs font-medium bg-black text-white">In arrivo</span>
      </h2>
      <p class="text-black text-sm font-normal text-max-two-lines">{{ data?.description }}</p>
    </div>
  </div>
</template>

<script>
// ICONS
import { Palette, Sparkles, ArrowDownToLine, Shield, ChartSpline, TabletSmartphone } from 'lucide-vue-next';

export default {
  name: 'card-feature',
  components: {
    // ICONS
    Palette,
    Sparkles,
    ArrowDownToLine,
    Shield,
    ChartSpline,
    TabletSmartphone,
  },
  props: {
    data: Object,
  },
};
</script>

<style scoped>
.card-feature .card-icon {
  background-color: white;
  color: black;
  box-shadow: 0 0 1px 0 rgba(0, 0, 0, 0.25);
  transition-property: background-color, color;
  transition-duration: 300ms;
  transition-timing-function: ease;
}

.card-feature:hover .card-icon {
  background-color: black;
  color: white;
}
</style>
