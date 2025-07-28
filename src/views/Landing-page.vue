<template>
  <navLp />
  <section class="relative w-full lg:px-8 px-4">
    <div class="relative max-w-[1280px] mx-auto">
      <div class="relative my-[100px] flex flex-col items-center justify-center text-center">
        <div class="max-w-[720px] flex flex-col gap-3.5">
          <h1 class="text-black text-5xl font-semibold text-balance">{{ $t('landing.title') }}</h1>
          <p class="text-[#373737] text-base font-normal">{{ $t('landing.subtitle') }}</p>
        </div>
        <div class="flex mt-8 gap-4 items-center justify-center">
          <RouterLink to="/signup">
            <buttonLg variant="primary" :label="$t('pricing.startNow')" />
          </RouterLink>
          <RouterLink to="/pricing">
            <buttonLg variant="secondary" :label="$t('landing.seePricing')" />
          </RouterLink>
        </div>
      </div>
      <div class="relative w-full">
        <div class="relative z-20 w-full aspect-video rounded-3xl bg-[#D9D9D9]"></div>
      </div>
    </div>
    <div class="absolute z-10 bottom-0 left-0 w-full h-[30%] gradient"></div>
  </section>
  <section id="features" class="relative w-full lg:px-8 px-4 bg-[#EEFDF0]">
    <div class="relative max-w-[1280px] mx-auto py-[128px] flex flex-col gap-12">
      <div class="w-full max-w-[800px]">
        <h1 class="text-black text-4xl font-semibold text-balance">{{ $t('landing.professionalQr') }}</h1>
      </div>
      <div class="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-10">
        <cardFeature v-for="(feature, featureIndex) in features" :key="featureIndex" :data="feature" />
      </div>
    </div>
  </section>
  <section class="relative w-full lg:px-8 px-4">
    <div class="relative z-20 max-w-[1280px] mx-auto md:p-10 p-6 rounded-4xl flex md:flex-row flex-col gap-12 md:items-center items-start bg-black">
      <div class="w-full md:max-w-[400px] min-h-[260px] aspect-video rounded-2xl bg-[#D9D9D9]"></div>
      <div class="w-full flex flex-col gap-8">
        <h1 class="text-white text-4xl font-semibold text-balance">{{ $t('landing.readyToCreate') }}</h1>
        <p class="text-white text-xl font-normal text-balance">{{ $t('landing.joinThousands') }}</p>
        <RouterLink to="/signup">
          <buttonLg variant="secondary-inverted" :label="$t('landing.startCreating')" />
        </RouterLink>
      </div>
    </div>
    <div class="absolute z-10 top-0 left-0 w-full h-[30%] rotate-180 gradient"></div>
  </section>
  <footerLp />
</template>

<script>
import navLp from '../components/navigation/nav-lp.vue';
import buttonLg from '../components/button/button-lg.vue';
import cardFeature from '../components/card/card-feature.vue';
import footerLp from '../components/navigation/footer-lp.vue';

export default {
  name: 'Landing-page',
  components: {
    navLp,
    buttonLg,
    cardFeature,
    footerLp,
  },
  data() {
    return {
      features: [
        {
          icon: 'Palette',
          title: this.$t('landing.customStyle'),
          description: this.$t('landing.customStyleDesc'),
        },
        {
          icon: 'Sparkles',
          title: this.$t('landing.lightningFast'),
          description: this.$t('landing.lightningFastDesc'),
        },
        {
          icon: 'ArrowDownToLine',
          title: this.$t('landing.multipleFormats'),
          description: this.$t('landing.multipleFormatsDesc'),
        },
        {
          icon: 'Shield',
          title: this.$t('landing.securePrivate'),
          description: this.$t('landing.securePrivateDesc'),
        },
        {
          icon: 'ChartSpline',
          title: this.$t('landing.detailedAnalytics'),
          description: this.$t('landing.detailedAnalyticsDesc'),
        },
        {
          icon: 'TabletSmartphone',
          title: this.$t('landing.mobileOptimized'),
          description: this.$t('landing.mobileOptimizedDesc'),
        },
      ],
    };
  },
  mounted() {
    window.scrollTo(0, 0);
  },
};
</script>

<style scoped>
.gradient {
  background: linear-gradient(180deg, rgba(238, 253, 240, 0) 0%, #eefdf0 100%);
}
</style>
