<template>
  <div class="badge h-[26px] py-0.5 px-2 rounded-lg flex items-center justify-center text-black text-sm font-semibold text-end">{{ label }}</div>
</template>

<script>
export default {
  name: 'badge',
  props: {
    label: String,
  },
};
</script>

<style scoped>
.badge {
  border: 1px solid #3ee1a3;
  background: linear-gradient(90deg, rgba(62, 225, 163, 0.16) 0%, rgba(62, 225, 163, 0.16) 44.71%, rgba(160, 253, 231, 0.16) 100%);
}
</style>
