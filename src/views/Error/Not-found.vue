<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <div>
        <div class="mx-auto h-32 w-32 text-gray-400 mb-8">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-full h-full">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1"
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <h1 class="text-9xl font-bold text-gray-300 mb-4">404</h1>
        <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ $t('notFound.title') }}</h2>
        <p class="text-lg text-gray-600 mb-8">{{ $t('notFound.description') }}</p>
      </div>
      <RouterLink to="/home" class="space-y-4 w-full flex items-center justify-center">
        <buttonLg variant="primary" :label="$t('notFound.backToHome')" />
      </RouterLink>
    </div>
  </div>
</template>

<script>
import buttonLg from '../../components/button/button-lg.vue';

export default {
  name: 'Not-found',
  components: {
    buttonLg,
  },
  mounted() {
    window.scrollTo(0, 0);
  },
};
</script>

<style scoped></style>
