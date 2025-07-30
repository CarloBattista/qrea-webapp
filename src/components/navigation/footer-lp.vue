<template>
  <div class="relative w-full mt-[100px] z-[9999] lg:px-8 px-4 py-10 bg-black">
    <div class="max-w-[1280px] mx-auto flex flex-col">
      <div class="w-full mb-12 grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 sm:gap-2.5 gap-10">
        <div class="w-full">
          <appLogo variant="white" class="relative h-10" />
        </div>
        <div class="w-full flex flex-col gap-4">
          <div class="fooHead">{{ $t('footer.product') }}</div>
          <a @click="scrollToFeatures" class="fooItem">{{ $t('landing.features') }}</a>
          <RouterLink aria-label="Pricing" to="/pricing" class="fooItem">{{ $t('pricing.title') }}</RouterLink>
        </div>
        <div class="w-full flex flex-col gap-4">
          <div class="fooHead">{{ $t('footer.support') }}</div>
          <RouterLink aria-label="Contact" to="/contact" class="fooItem">{{ $t('footer.contact') }}</RouterLink>
          <RouterLink aria-label="Privacy policy" to="/privacy-policy" class="fooItem">{{ $t('footer.privacy') }}</RouterLink>
          <RouterLink aria-label="Terms and conditions" to="/terms-and-conditions" class="fooItem">{{ $t('footer.terms') }}</RouterLink>
        </div>
      </div>
      <div class="w-full pb-5 flex gap-4 items-center sm:justify-end justify-start border-b border-solid border-[#373737]">
        <a aria-label="Instagram" href="https://www.instagram.com/" target="_blank" class="social-logo">
          <img src="/_resources/imgs/instagram_logo.svg" alt="Instagram" draggable="false" class="relative h-7 aspect-square" />
        </a>
        <a aria-label="Linkedin" href="https://www.linkedin.com/in/carlo-battista-05b926282/" target="_blank" class="social-logo">
          <img src="/_resources/imgs/linkedin_logo.svg" alt="Linkedin" draggable="false" class="relative h-7 aspect-square" />
        </a>
      </div>
      <div class="w-full mt-5 flex items-center justify-start">
        <p class="text-white text-sm font-normal">© {{ company.currentYear || new Date().getFullYear() }} {{ company.app_name }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { company } from '../../data/company';

import appLogo from '../global/app-logo.vue';

export default {
  name: 'footer-lp',
  components: {
    appLogo,
  },
  data() {
    return {
      company,
    };
  },
  methods: {
    scrollToFeatures() {
      const featuresElement = document.getElementById('features');

      if (featuresElement) {
        featuresElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    },
  },
};
</script>

<style scoped>
.fooHead {
  color: white;
  font-size: 20px;
  font-weight: 600;
}

.fooItem {
  color: #ccc;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: color 200ms ease;
}

.fooItem:hover {
  color: #999;
}

.social-logo {
  transition: opacity 200ms ease;
}

.social-logo:hover {
  opacity: 0.85;
}
</style>
