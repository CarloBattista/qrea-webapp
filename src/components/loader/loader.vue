<template>
  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
</template>

<script>
export default {
  name: 'loader',
};
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
