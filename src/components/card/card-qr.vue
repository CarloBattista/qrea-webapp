<template>
  <div class="card-qr w-full rounded-2xl pr-shadow bg-white">
    <div ref="qrCodeContainer" class="qr-container w-full max-h-[250px] px-4 aspect-square flex items-center justify-center"></div>
    <div class="w-full px-4 pb-4 flex flex-col gap-1">
      <h2 class="text-black text-base font-semibold">{{ data?.name }}</h2>
      <p class="text-gray-500 text-sm font-normal">{{ data?.content }}</p>
    </div>
  </div>
</template>

<script>
import QRCodeStyling from 'qr-code-styling';

export default {
  name: 'card-qr',
  props: {
    data: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      qrCode: null,
    };
  },
  computed: {
    qrOptions() {
      if (!this.data?.config || !this.data?.content) return null;

      const config = this.data.config;

      return {
        type: 'svg',
        data: this.data.content,
        image: config.showImage ? config.imageSettings?.src : undefined,
        margin: config.margin || 10,
        dotsOptions: {
          color: config.foreground || '#000000',
          type: config.dotsStyle || 'square',
          gradient: config.gradient
            ? {
                type: 'linear',
                rotation: (config.gradientRotation * Math.PI) / 180,
                colorStops: [
                  { offset: 0, color: config.gradientStartColor || '#000000' },
                  { offset: 1, color: config.gradientEndColor || '#38bdf8' },
                ],
              }
            : undefined,
        },
        backgroundOptions: {
          color: config.background || '#ffffff',
        },
        cornersSquareOptions: {
          type: config.cornerStyle || 'square',
          color: config.foreground || '#000000',
        },
        cornersDotOptions: {
          type: config.cornerStyle === 'square' ? 'square' : 'dot',
          color: config.foreground || '#000000',
        },
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: config.imageSettings?.size ? config.imageSettings.size / 100 : 0.4,
          margin: 5,
          crossOrigin: 'anonymous',
        },
      };
    },
  },
  methods: {
    generateQRCode() {
      if (!this.qrOptions || !this.$refs.qrCodeContainer) return;

      // Pulisce il container precedente
      if (this.qrCode) {
        this.$refs.qrCodeContainer.innerHTML = '';
      }

      try {
        this.qrCode = new QRCodeStyling(this.qrOptions);
        this.qrCode.append(this.$refs.qrCodeContainer);
      } catch (error) {
        console.error('Errore nella generazione del QR code:', error);
        // Mostra un messaggio di errore nel container
        this.$refs.qrCodeContainer.innerHTML = '<div class="text-red-500 text-xs text-center p-2">Errore nel caricamento</div>';
      }
    },
  },
  watch: {
    data: {
      handler() {
        this.$nextTick(() => {
          this.generateQRCode();
        });
      },
      deep: true,
      immediate: true,
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.generateQRCode();
    });
  },
};
</script>

<style scoped></style>
