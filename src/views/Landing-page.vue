<template>
  <navLp />
  <section class="relative w-full lg:px-8 px-4">
    <div class="relative max-w-[1280px] mx-auto">
      <div class="relative my-[100px] flex flex-col items-center justify-center text-center">
        <div class="max-w-[720px] flex flex-col gap-3.5">
          <h1 class="text-black text-5xl font-semibold text-balance">il generatore QR perfetto per il tuo brand</h1>
          <p class="text-[#373737] text-base font-normal">Personalizza, scansiona e condividi. Logo, colori e contenuti tuoi, in pochi click.</p>
        </div>
        <div class="flex mt-8 gap-4 items-center justify-center">
          <RouterLink to="/signup">
            <buttonLg variant="primary" :label="$t('pricing.startNow')" />
          </RouterLink>
          <RouterLink to="/pricing">
            <buttonLg variant="secondary" label="Vedi i prezzi" />
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
        <h1 class="text-black text-4xl font-semibold text-balance">QR code professionali con opzioni di personalizzazione avanzate</h1>
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
        <h1 class="text-white text-4xl font-semibold text-balance">Sei pronto a creare il tuo primo QR Code?</h1>
        <p class="text-white text-xl font-normal text-balance">
          Unisciti a migliaia di utenti che si fidano della nostra piattaforma per le loro esigenze di QR code.
        </p>
        <RouterLink to="/signup">
          <buttonLg variant="secondary-inverted" label="Inizia a creare ora" />
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
          title: 'Stile personalizzato',
          description: 'Personalizza colori, forme e aggiungi il tuo logo per creare QR code brandizzati.',
        },
        {
          icon: 'Sparkles',
          title: 'Veloce come un Fulmine',
          description: 'Genera QR code di alta qualità istantaneamente con il nostro motore ottimizzato.',
        },
        {
          icon: 'ArrowDownToLine',
          title: 'Formati Multipli',
          description: 'Scarica i tuoi QR code in vari formati: PNG, SVG e PDF per ogni esigenza.',
        },
        {
          icon: 'Shield',
          title: 'Sicuro e Privato',
          description: 'I tuoi dati sono protetti e non vengono mai condivisi con terze parti.',
        },
        {
          icon: 'ChartSpline',
          title: 'Analisi Dettagliate',
          description: 'Traccia le scansioni e ottieni insights dettagliati sui tuoi QR code.',
        },
        {
          icon: 'TabletSmartphone',
          title: 'Ottimizzato Mobile',
          description: 'Interfaccia responsive perfetta per dispositivi mobili e desktop.',
        },
      ],
    };
  },
};
</script>

<style scoped>
.gradient {
  background: linear-gradient(180deg, rgba(238, 253, 240, 0) 0%, #eefdf0 100%);
}
</style>
