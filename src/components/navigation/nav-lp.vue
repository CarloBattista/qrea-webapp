<template>
  <div class="sticky z-[9999] top-0 left-0 w-full md:h-24 h-16 max-h-24 lg:px-8 px-4 border-b border-solid border-black/10 bg-white">
    <div class="max-w-[1280px] mx-auto h-full flex items-center justify-between">
      <RouterLink to="/">
        <appLogo class="relative md:h-9 h-7" />
      </RouterLink>
      <div class="absolute top-1/2 left-1/2 h-full -translate-y-1/2 -translate-x-1/2 md:flex hidden gap-8 items-center justify-center">
        <a @click="scrollToFeatures" class="navItem">{{ $t('landing.features') }}</a>
        <RouterLink to="/pricing" class="navItem">{{ $t('pricing.title') }}</RouterLink>
      </div>
      <div class="md:flex hidden gap-4 items-center justify-end">
        <RouterLink to="/signin">
          <buttonLg variant="secondary" :label="$t('auth.signin')" />
        </RouterLink>
        <RouterLink to="/signup">
          <buttonLg variant="primary" :label="$t('pricing.startNow')" />
        </RouterLink>
      </div>
      <div @click="isMenuOpen = !isMenuOpen" class="relative h-11 aspect-square md:hidden flex items-center justify-center cursor-pointer">
        <transition name="icon-fade" mode="out-in">
          <AlignJustify v-if="!isMenuOpen" key="hamburger" class="icon-menu-mob" />
          <X v-else key="close" class="icon-menu-mob" />
        </transition>
      </div>
    </div>
    <transition name="slide-fade">
      <div v-if="isMenuOpen" class="absolute top-16 left-0 w-full h-[calc(100svh-4rem)] px-4 bg-white">
        <div class="w-full flex flex-col">
          <a @click="scrollToFeatures" class="navItem-mob">{{ $t('landing.features') }}</a>
          <RouterLink to="/pricing" class="navItem-mob">{{ $t('pricing.title') }}</RouterLink>
          <div class="w-full mt-8 flex flex-col gap-4 items-center justify-end">
            <RouterLink to="/signin" class="w-full">
              <buttonLg variant="secondary" :label="$t('auth.signin')" class="w-full" />
            </RouterLink>
            <RouterLink to="/signup" class="w-full">
              <buttonLg variant="primary" :label="$t('pricing.startNow')" class="w-full" />
            </RouterLink>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import appLogo from '../global/app-logo.vue';
import buttonLg from '../button/button-lg.vue';

// ICONS
import { AlignJustify, X } from 'lucide-vue-next';

export default {
  name: 'nav-lp',
  components: {
    appLogo,
    buttonLg,

    // ICONS
    AlignJustify,
    X,
  },
  data() {
    return {
      isMenuOpen: false,
    };
  },
  methods: {
    handleResize() {
      if (window.innerWidth > 768) {
        this.isMenuOpen = false;
      }
    },
    scrollToFeatures() {
      const featuresElement = document.getElementById('features');

      if (this.isMenuOpen) {
        this.isMenuOpen = false;
      }

      if (featuresElement) {
        featuresElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    },
  },
  watch: {
    isMenuOpen: {
      handler(value) {
        if (value) {
          document.body.classList.add('overflow-hidden');
        } else {
          document.body.classList.remove('overflow-hidden');
        }
      },
      immediate: true,
      deep: true,
    },
    $route() {
      if (this.isMenuOpen) {
        this.isMenuOpen = false;
      }
      document.body.classList.remove('overflow-hidden');
    },
  },
  mounted() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
    }

    window.removeEventListener('resize', this.handleResize);
    document.body.classList.remove('overflow-hidden');
  },
};
</script>

<style scoped>
.navItem {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: black;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
}

.navItem-mob {
  position: relative;
  width: 100%;
  padding: 2rem 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  color: black;
  font-size: 1.125rem;
  font-weight: 500;
  cursor: pointer;
}

.navItem::after {
  position: absolute;
  bottom: 0;
  left: 0;
  content: '';
  width: 100%;
  height: 0px;
  border-radius: 3px;
  background-color: black;
  transition: height 200ms ease;
}

.navItem:hover::after {
  height: 3px;
}

.icon-menu-mob {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Transizione per le icone del menu */
.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: all 0.2s ease;
}

.icon-fade-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) rotate(90deg) scale(0.8);
}

.icon-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) rotate(-90deg) scale(0.8);
}

.icon-fade-enter-to,
.icon-fade-leave-from {
  opacity: 1;
  transform: translate(-50%, -50%) rotate(0deg) scale(1);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transform-origin: top center;
  transition-property: opacity, transform;
  transition-duration: 300ms;
  transition-timing-function: ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: scaleY(0.85);
}
</style>
