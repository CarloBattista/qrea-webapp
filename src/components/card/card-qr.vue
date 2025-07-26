<template>
  <div class="card-qr w-full rounded-2xl p-4 pr-shadow bg-white">
    <div class="w-full aspect-square flex items-center justify-center bg-amber-500"></div>
    <div class="w-full mt-2 flex flex-col gap-1">
      <h2 class="text-black text-base font-semibold">Title</h2>
      <p class="text-gray-500 text-sm font-normal">Description</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'card-qr',
  props: {
    data: Object,
  },
};
</script>

<style scoped></style>
