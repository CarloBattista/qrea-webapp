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
        <div class="relative z-20 w-full aspect-video overflow-hidden">
          <picture class="w-full h-full object-contain">
            <source
              media="(max-width:640px)"
              srcset="
                https://ozqjliffrzdnjgumkxeb.supabase.co/storage/v1/object/public/qrea-company/product-images/001/_webp/qrea-productimage-001-horizontal-1x.webp
              "
            />
            <source
              media="(max-width:768px)"
              srcset="
                https://ozqjliffrzdnjgumkxeb.supabase.co/storage/v1/object/public/qrea-company/product-images/001/_webp/qrea-productimage-001-horizontal-2x.webp
              "
            />
            <img
              src="https://ozqjliffrzdnjgumkxeb.supabase.co/storage/v1/object/public/qrea-company/product-images/001/_webp/qrea-productimage-001-horizontal-3x.webp"
              alt="Prodcut image"
              fetchpriority="high"
            />
          </picture>
        </div>
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
      <div class="w-full md:max-w-[400px] min-h-[260px] aspect-video rounded-2xl overflow-hidden">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 930" fill="none" class="w-full h-full">
          <g filter="url(#filter0_d_47_384)">
            <rect x="60" y="67.5" width="980" height="795" rx="44" fill="white" shape-rendering="crispEdges" />
            <path
              d="M152.016 154.996V188.5H145.248L130.08 165.604V188.5H123.312V154.996H130.08L145.248 177.94V154.996H152.016ZM176.992 184.9V161.908H183.808V188.5H180.592C179.504 188.5 178.624 188.18 177.952 187.54C177.312 186.868 176.992 185.988 176.992 184.9ZM168.736 188.836C166.624 188.836 164.784 188.388 163.216 187.492C161.68 186.596 160.496 185.3 159.664 183.604C158.832 181.908 158.416 179.86 158.416 177.46V161.908H165.136V176.308C165.136 178.452 165.68 180.116 166.768 181.3C167.856 182.452 169.28 183.028 171.04 183.028C172.256 183.028 173.312 182.724 174.208 182.116C175.104 181.476 175.792 180.612 176.272 179.524C176.752 178.436 176.992 177.204 176.992 175.828L178.048 177.22C177.952 179.876 177.456 182.068 176.56 183.796C175.696 185.524 174.576 186.804 173.2 187.636C171.856 188.436 170.368 188.836 168.736 188.836ZM202.198 188.836C199.638 188.836 197.334 188.276 195.286 187.156C193.27 186.036 191.654 184.452 190.438 182.404C189.254 180.356 188.662 177.94 188.662 175.156C188.662 172.372 189.27 169.972 190.486 167.956C191.702 165.908 193.35 164.34 195.43 163.252C197.51 162.132 199.83 161.572 202.39 161.572C204.95 161.572 207.254 162.132 209.302 163.252C211.382 164.34 213.03 165.908 214.246 167.956C215.462 169.972 216.07 172.372 216.07 175.156C216.07 177.94 215.446 180.356 214.198 182.404C212.982 184.452 211.318 186.036 209.206 187.156C207.126 188.276 204.79 188.836 202.198 188.836ZM202.198 182.932C203.382 182.932 204.502 182.66 205.558 182.116C206.614 181.54 207.478 180.676 208.15 179.524C208.822 178.34 209.158 176.884 209.158 175.156C209.158 173.428 208.822 171.988 208.15 170.836C207.51 169.684 206.662 168.836 205.606 168.292C204.582 167.716 203.478 167.428 202.294 167.428C201.11 167.428 200.006 167.716 198.982 168.292C197.99 168.836 197.174 169.684 196.534 170.836C195.894 171.988 195.574 173.428 195.574 175.156C195.574 176.884 195.878 178.34 196.486 179.524C197.094 180.676 197.894 181.54 198.886 182.116C199.91 182.66 201.014 182.932 202.198 182.932ZM225.369 161.908L232.041 182.26L238.713 161.908H245.961L236.121 188.5H227.865L218.121 161.908H225.369ZM261.542 188.836C258.982 188.836 256.678 188.276 254.63 187.156C252.614 186.036 250.998 184.452 249.782 182.404C248.598 180.356 248.006 177.94 248.006 175.156C248.006 172.372 248.614 169.972 249.83 167.956C251.046 165.908 252.694 164.34 254.774 163.252C256.854 162.132 259.174 161.572 261.734 161.572C264.294 161.572 266.598 162.132 268.646 163.252C270.726 164.34 272.374 165.908 273.59 167.956C274.806 169.972 275.414 172.372 275.414 175.156C275.414 177.94 274.79 180.356 273.542 182.404C272.326 184.452 270.662 186.036 268.55 187.156C266.47 188.276 264.134 188.836 261.542 188.836ZM261.542 182.932C262.726 182.932 263.846 182.66 264.902 182.116C265.958 181.54 266.822 180.676 267.494 179.524C268.166 178.34 268.502 176.884 268.502 175.156C268.502 173.428 268.166 171.988 267.494 170.836C266.854 169.684 266.006 168.836 264.95 168.292C263.926 167.716 262.822 167.428 261.638 167.428C260.454 167.428 259.35 167.716 258.326 168.292C257.334 168.836 256.518 169.684 255.878 170.836C255.238 171.988 254.918 173.428 254.918 175.156C254.918 176.884 255.222 178.34 255.83 179.524C256.438 180.676 257.238 181.54 258.23 182.116C259.254 182.66 260.358 182.932 261.542 182.932ZM320.967 194.5C319.911 194.5 318.743 194.308 317.463 193.924C316.215 193.54 315.031 192.868 313.911 191.908C312.823 190.98 311.975 189.684 311.367 188.02L316.791 185.236C317.335 186.388 318.007 187.204 318.807 187.684C319.607 188.164 320.567 188.404 321.687 188.404C322.007 188.404 322.343 188.388 322.695 188.356C323.079 188.292 323.447 188.228 323.799 188.164V194.068C323.447 194.196 323.031 194.292 322.551 194.356C322.071 194.452 321.543 194.5 320.967 194.5ZM307.239 188.836C304.871 188.836 302.647 188.42 300.567 187.588C298.487 186.756 296.663 185.572 295.095 184.036C293.527 182.5 292.295 180.692 291.399 178.612C290.503 176.532 290.055 174.228 290.055 171.7C290.055 169.204 290.503 166.916 291.399 164.836C292.295 162.756 293.527 160.964 295.095 159.46C296.663 157.924 298.487 156.74 300.567 155.908C302.647 155.076 304.871 154.66 307.239 154.66C309.607 154.66 311.831 155.076 313.911 155.908C315.991 156.74 317.799 157.924 319.335 159.46C320.903 160.964 322.135 162.756 323.031 164.836C323.927 166.916 324.375 169.204 324.375 171.7C324.375 174.228 323.927 176.532 323.031 178.612C322.135 180.692 320.903 182.5 319.335 184.036C317.799 185.572 315.991 186.756 313.911 187.588C311.831 188.42 309.607 188.836 307.239 188.836ZM307.239 182.74C309.255 182.74 311.015 182.292 312.519 181.396C314.055 180.5 315.255 179.22 316.119 177.556C316.983 175.892 317.415 173.94 317.415 171.7C317.415 169.46 316.983 167.524 316.119 165.892C315.255 164.228 314.055 162.948 312.519 162.052C311.015 161.156 309.255 160.708 307.239 160.708C305.223 160.708 303.447 161.156 301.911 162.052C300.375 162.948 299.175 164.228 298.311 165.892C297.447 167.524 297.015 169.46 297.015 171.7C297.015 173.94 297.447 175.892 298.311 177.556C299.175 179.22 300.375 180.5 301.911 181.396C303.447 182.292 305.223 182.74 307.239 182.74ZM328.859 188.5V154.996H341.483C344.107 154.996 346.315 155.428 348.107 156.292C349.899 157.156 351.243 158.356 352.139 159.892C353.067 161.396 353.531 163.124 353.531 165.076C353.531 167.22 352.859 169.06 351.515 170.596C350.203 172.1 348.459 173.108 346.283 173.62C347.947 174.196 349.435 175.172 350.747 176.548C352.091 177.924 353.195 179.62 354.059 181.636C354.923 183.652 355.499 185.94 355.787 188.5H348.491C348.299 186.228 347.803 184.18 347.003 182.356C346.203 180.5 345.003 179.028 343.403 177.94C342.443 177.268 341.307 176.74 339.995 176.356C338.715 175.972 337.259 175.78 335.627 175.78V188.5H328.859ZM335.627 170.308H341.195C342.955 170.308 344.299 169.828 345.227 168.868C346.155 167.908 346.619 166.724 346.619 165.316C346.619 163.876 346.139 162.708 345.179 161.812C344.251 160.916 342.923 160.468 341.195 160.468H335.627V170.308Z"
              fill="black"
            />
            <g filter="url(#filter1_d_47_384)">
              <rect x="887" y="125.5" width="93" height="93" rx="20" fill="white" shape-rendering="crispEdges" />
              <rect x="887.5" y="126" width="92" height="92" rx="19.5" stroke="black" stroke-opacity="0.1" shape-rendering="crispEdges" />
              <path
                d="M931.583 170.083V158.583H935.416V170.083H946.916V173.917H935.416V185.417H931.583V173.917H920.083V170.083H931.583Z"
                fill="black"
              />
            </g>
            <rect x="120" y="234.5" width="260" height="260" rx="36" fill="#D9D9D9" />
            <rect x="423.333" y="234.5" width="260" height="260" rx="36" fill="#D9D9D9" />
            <rect x="726.667" y="234.5" width="260" height="260" rx="36" fill="#D9D9D9" />
            <rect x="120" y="544.5" width="260" height="260" rx="36" fill="#D9D9D9" />
            <rect x="423.333" y="544.5" width="260" height="260" rx="36" fill="#D9D9D9" />
            <rect x="726.667" y="544.5" width="260" height="260" rx="36" fill="#D9D9D9" />
            <path
              d="M951.079 187.501C949.44 183.721 952.821 179.692 956.828 180.649L1026.16 197.211C1030.56 198.263 1031.41 204.164 1027.48 206.414L1001.19 221.455C1000.16 222.045 999.371 222.984 998.968 224.103L988.721 252.605C987.188 256.868 981.23 257.059 979.428 252.902L951.079 187.501Z"
              fill="black"
            />
            <path
              d="M946.491 189.49C943.214 181.929 949.975 173.871 957.99 175.786L1027.32 192.347C1036.13 194.452 1037.83 206.254 1029.96 210.753L1003.67 225.795L993.426 254.297C990.36 262.823 978.444 263.204 974.841 254.891L946.491 189.49ZM956.828 180.649C952.821 179.692 949.44 183.721 951.079 187.501L979.428 252.902C981.23 257.059 987.188 256.868 988.721 252.605L998.968 224.103C999.371 222.984 1000.16 222.045 1001.19 221.455L1027.48 206.414C1031.41 204.164 1030.56 198.263 1026.16 197.211L956.828 180.649Z"
              fill="white"
            />
          </g>
          <defs>
            <filter id="filter0_d_47_384" x="35" y="42.5" width="1030" height="845" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feFlood flood-opacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
              <feOffset />
              <feGaussianBlur stdDeviation="12.5" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0" />
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_47_384" />
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_47_384" result="shape" />
            </filter>
            <filter id="filter1_d_47_384" x="886" y="124.5" width="95" height="95" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feFlood flood-opacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
              <feOffset />
              <feGaussianBlur stdDeviation="0.5" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_47_384" />
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_47_384" result="shape" />
            </filter>
          </defs>
        </svg>
      </div>
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
          coming: true,
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
