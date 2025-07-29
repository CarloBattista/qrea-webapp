<template>
  <div class="card-qr w-full rounded-2xl flex md:flex-col flex-row items-start pr-shadow bg-white">
    <div
      ref="qrCodeContainer"
      class="qr-container w-full min-w-[130px] min-h-[150px] max-h-[250px] px-4 md:py-0 py-4 aspect-square flex items-center justify-center overflow-hidden"
    ></div>
    <div class="w-full md:h-fit h-full md:py-0 py-4 flex flex-col justify-between">
      <div class="w-full px-4 pb-4 flex flex-col gap-1">
        <h2 class="text-black text-base font-semibold">{{ data?.name }}</h2>
        <p class="text-gray-500 text-sm font-normal">{{ data?.content }}</p>
      </div>
      <div class="w-full px-4 py-2 flex flex-wrap gap-2 items-center justify-start">
        <buttonLg @click="handleQrCode" variant="secondary" :label="$t('qr.edit')" :disabled="loading" />
        <buttonLg @click="deleteQrCode" variant="destructive" :label="$t('qr.delete')" :disabled="loading" />
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../../lib/supabase';

import QRCodeStyling from 'qr-code-styling';

import buttonLg from '../button/button-lg.vue';

export default {
  name: 'card-qr',
  components: {
    buttonLg,
  },
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
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
        width: 250,
        height: 250,
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
      } catch (e) {
        console.error(e);
      }
    },
    handleQrCode() {
      const QR_ID = this.data.id;

      if (!QR_ID) return;

      this.$router.push({ name: 'edit-qr', params: { id: QR_ID } });
    },

    async deleteQrCode() {
      if (confirm('Sei sicuro di voler eliminare il QR code?')) {
        try {
          const { error } = await supabase.from('qr_codes').delete().eq('id', this.data.id);

          if (!error) {
            // console.log(data);
            this.$emit('load-qr-codes');
          }
        } catch (e) {
          console.error(e);
        }
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

<style scoped>
.qr-container canvas {
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  object-fit: contain !important;
}
</style>
