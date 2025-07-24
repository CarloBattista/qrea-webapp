<template>
  <div class="w-full md:h-svh h-[calc(100svh-300px)] flex md:flex-row flex-col items-start">
    <div class="relative z-20 w-full h-full">
      <div
        v-for="(step, stepIndex) in steps.steps"
        :key="stepIndex"
        class="step-container w-full h-full md:px-9 px-3 pt-32 flex flex-none flex-col items-start justify-start"
        :style="{ transform: `translateY(-${(steps.currentStep - 1) * 100}%)` }"
      >
        <!-- Step 1: Inserisci il link -->
        <div v-if="steps.currentStep === 1" class="w-full">
          <h2 class="text-black text-3xl font-semibold">{{ step.title }}</h2>
          <div class="relative mt-32 w-full h-18">
            <input v-model="value" type="text" placeholder="www.example.com" class="w-full h-full outline-0" />
          </div>
        </div>

        <!-- Step 2: Scegli il tipo di QR -->
        <div v-else-if="steps.currentStep === 2" class="w-full">
          <h2 class="text-black text-3xl font-semibold">{{ step.title }}</h2>
          <div class="mt-8 space-y-6">
            <!-- Dimensioni -->
            <div class="w-full max-w-[500px] flex flex-col">
              <h2>Dimensioni</h2>
              <sliderBar v-model="qrSize" :min="200" :max="500" :step="1" previewExtraValue="px" />
            </div>

            <!-- Colori -->
            <div class="grid grid-cols-2 gap-4">
              <div class="control-group">
                <label class="text-lg font-medium mb-2 block">Colore Principale:</label>
                <div class="flex items-center gap-2">
                  <input v-model="foreground" type="color" class="w-12 h-10 rounded border-0" />
                  <span class="text-sm">{{ foreground }}</span>
                </div>
              </div>
              <div class="control-group">
                <label class="text-lg font-medium mb-2 block">Colore Sfondo:</label>
                <div class="flex items-center gap-2">
                  <input v-model="background" type="color" class="w-12 h-10 rounded border-0" />
                  <span class="text-sm">{{ background }}</span>
                </div>
              </div>
            </div>

            <!-- Stili -->
            <div class="control-group">
              <label class="text-lg font-medium mb-2 block">Stile Punti:</label>
              <div class="flex flex-wrap gap-2">
                <buttonLg
                  v-for="style in dotStyles"
                  :key="style.value"
                  @click="dotsStyle = style.value"
                  type="button"
                  :variant="dotsStyle === style.value ? 'primary' : 'secondary'"
                  :label="style.label"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Personalizza il QR -->
        <div v-else-if="steps.currentStep === 3" class="w-full">
          <h2 class="text-black text-3xl font-semibold">{{ step.title }}</h2>
          <div class="mt-8 space-y-6">
            <!-- Stile Angoli -->
            <div class="control-group">
              <label class="text-lg font-medium mb-2 block">Stile Angoli:</label>
              <div class="flex flex-wrap gap-2">
                <buttonLg
                  v-for="style in cornerStyles"
                  :key="style.value"
                  @click="cornerStyle = style.value"
                  type="button"
                  :variant="cornerStyle === style.value ? 'primary' : 'secondary'"
                  :label="style.label"
                />
              </div>
            </div>

            <checkbox @click="gradient = !gradient" :selected="gradient" label="Abilita Gradiente" :disabled="false" />
            <div v-if="gradient" class="ml-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium mb-1 block">Colore iniziale:</label>
                  <div class="flex items-center gap-2">
                    <input v-model="gradientStartColor" type="color" class="w-10 h-8 rounded" />
                    <span class="text-xs">{{ gradientStartColor }}</span>
                  </div>
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">Colore finale:</label>
                  <div class="flex items-center gap-2">
                    <input v-model="gradientEndColor" type="color" class="w-10 h-8 rounded" />
                    <span class="text-xs">{{ gradientEndColor }}</span>
                  </div>
                </div>
              </div>
              <div class="w-full max-w-[500px] flex flex-col">
                <h2>Rotazione</h2>
                <sliderBar v-model="gradientRotation" :min="0" :max="360" :step="1" previewExtraValue="°" />
              </div>
            </div>

            <!-- Logo -->
            <checkbox @click="showImage = !showImage" :selected="showImage" label="Abilita Logo" :disabled="false" />
            <div v-if="showImage" class="ml-6 space-y-4">
              <div>
                <label class="text-sm font-medium mb-1 block">URL Immagine:</label>
                <input v-model="imageSettings.src" type="text" placeholder="URL dell'immagine" class="w-full h-18 outline-0" />
              </div>
              <div class="w-full max-w-[500px] flex flex-col">
                <h2>Dimensione</h2>
                <sliderBar v-model="imageSize" :min="10" :max="50" :step="1" previewExtraValue="%" />
              </div>
            </div>

            <!-- Margine -->
            <div class="w-full max-w-[500px] flex flex-col">
              <h2>Margine</h2>
              <sliderBar v-model="margin" :min="0" :max="50" :step="1" previewExtraValue="px" />
            </div>

            <!-- Pulsanti Azione -->
            <div class="flex gap-4 mt-8">
              <buttonLg @click="resetToDefaults" type="button" variant="secondary" label="Reset" />
              <buttonLg @click="downloadQR" :actions="true" type="button" variant="primary" label="Scarica">
                <template #options>
                  <div
                    v-for="(option, optionIndex) in downloadFormats"
                    :key="optionIndex"
                    @click.stop="selectedFormat = option.value"
                    class="w-full h-9 px-2 rounded-sm flex items-center text-sm cursor-pointer"
                    :class="{
                      'bg-transparent hover:bg-gray-100': selectedFormat !== option.value,
                      'bg-black text-white': selectedFormat === option.value,
                    }"
                  >
                    {{ option.label }}
                  </div>
                </template>
              </buttonLg>
            </div>
          </div>
        </div>
      </div>

      <div class="absolute top-0 right-0 w-16 h-full flex flex-col justify-between">
        <div
          @click="handlePrevStep"
          class="relative w-full aspect-square flex items-center justify-center"
          :class="{ 'cursor-pointer': steps.currentStep >= 2 }"
        >
          <ArrowUp v-if="steps.currentStep >= 2" size="28" />
        </div>
        <div
          @click="handleNextStep"
          class="relative w-full aspect-square flex items-center justify-center"
          :class="{ 'cursor-pointer': steps.currentStep < 3 }"
        >
          <ArrowDown v-if="steps.currentStep < 3" size="28" />
        </div>
      </div>
    </div>

    <!-- Anteprima QR Code -->
    <div class="relative z-30 w-full md:min-h-full min-h-[300px] md:max-w-[500px] bg-gray-100 flex flex-col items-center justify-center p-6">
      <h3 class="text-xl font-semibold mb-4">Anteprima</h3>
      <div class="qr-container" ref="qrCodeContainer"></div>
    </div>
  </div>
</template>

<script>
import QRCodeStyling from 'qr-code-styling';

import buttonLg from '../components/button/button-lg.vue';
import sliderBar from '../components/slider/slider-bar.vue';
import checkbox from '../components/toggle/checkbox.vue';

// ICONS
import { ArrowUp, ArrowDown } from 'lucide-vue-next';

export default {
  name: 'Home',
  components: {
    buttonLg,
    sliderBar,
    checkbox,

    // ICONS
    ArrowUp,
    ArrowDown,
  },
  data() {
    return {
      steps: {
        currentStep: 1,
        steps: [
          {
            step: 1,
            title: 'Inserisci il link',
            description: '',
          },
          {
            step: 2,
            title: 'Scegli il tipo di QR',
            description: '',
          },
          {
            step: 3,
            title: 'Personalizza il QR',
            description: '',
          },
        ],
      },

      // QR Code settings
      value: '',
      qrSize: 300,
      background: '#ffffff',
      foreground: '#000000',
      margin: 10,
      dotsStyle: 'square',
      cornerStyle: 'square',
      gradient: false,
      gradientStartColor: '#000000',
      gradientEndColor: '#38bdf8',
      gradientRotation: 0,
      showImage: false,
      imageSize: 40,
      imageSettings: {
        src: '',
      },
      qrCode: null,

      dotStyles: [
        { label: 'Quadrato', value: 'square' },
        { label: 'Arrotondato', value: 'rounded' },
        { label: 'Punti', value: 'dots' },
        { label: 'Elegante', value: 'classy' },
        { label: 'Extra Arrotondato', value: 'extra-rounded' },
      ],

      cornerStyles: [
        { label: 'Quadrato', value: 'square' },
        { label: 'Punto', value: 'dot' },
        { label: 'Arrotondato', value: 'rounded' },
        { label: 'Extra Arrotondato', value: 'extra-rounded' },
      ],

      // Formati di download disponibili
      selectedFormat: 'png',
      downloadFormats: [
        { label: 'PNG', value: 'png' },
        { label: 'JPG', value: 'jpeg' },
        { label: 'SVG', value: 'svg' },
        { label: 'PDF', value: 'pdf' },
      ],
    };
  },
  computed: {
    qrOptions() {
      return {
        width: this.qrSize,
        height: this.qrSize,
        type: 'svg',
        data: this.value,
        image: this.showImage ? this.imageSettings.src : undefined,
        margin: this.margin,
        dotsOptions: {
          color: this.foreground,
          type: this.dotsStyle,
          gradient: this.gradient
            ? {
                type: 'linear',
                rotation: (this.gradientRotation * Math.PI) / 180,
                colorStops: [
                  { offset: 0, color: this.gradientStartColor },
                  { offset: 1, color: this.gradientEndColor },
                ],
              }
            : undefined,
        },
        backgroundOptions: {
          color: this.background,
        },
        cornersSquareOptions: {
          type: this.cornerStyle,
          color: this.foreground,
        },
        cornersDotOptions: {
          type: this.cornerStyle === 'square' ? 'square' : 'dot',
          color: this.foreground,
        },
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: this.imageSize / 100,
          margin: 5,
          crossOrigin: 'anonymous',
        },
      };
    },
  },
  methods: {
    handlePrevStep() {
      if (this.steps.currentStep > 1) {
        this.steps.currentStep--;
      }
    },
    handleNextStep() {
      if (this.steps.currentStep === 1 && !this.value) {
        alert('Inserisci un link');
        return;
      }

      if (this.steps.currentStep < 3) {
        this.steps.currentStep++;
      }
    },
    generateQRCode() {
      if (this.qrCode) {
        this.$refs.qrCodeContainer.innerHTML = '';
      }

      this.qrCode = new QRCodeStyling(this.qrOptions);
      this.qrCode.append(this.$refs.qrCodeContainer);
    },
    resetToDefaults() {
      // this.value = '';
      if (confirm('Sei sicuro di voler resettare le impostazioni?')) {
        // this.value = '';
        this.qrSize = 300;
        this.background = '#ffffff';
        this.foreground = '#000000';
        this.margin = 10;
        this.dotsStyle = 'square';
        this.cornerStyle = 'square';
        this.gradient = false;
        this.gradientStartColor = '#000000';
        this.gradientEndColor = '#38bdf8';
        this.gradientRotation = 0;
        this.showImage = false;
        this.imageSize = 40;
        this.imageSettings.src = '';
        this.selectedFormat = 'png';

        this.steps.currentStep = 1;
      }
    },
    downloadQR() {
      if (this.qrCode) {
        this.qrCode.download({
          name: 'personalized-qr-code',
          extension: this.selectedFormat,
        });
      }
    },
  },
  watch: {
    qrOptions: {
      handler() {
        this.generateQRCode();
      },
      deep: true,
    },
  },
  mounted() {
    this.generateQRCode();
  },
};
</script>

<style scoped>
input,
input::placeholder {
  font-size: 2rem;
  color: #040f0f;
}

input::placeholder {
  opacity: 0.3;
}

.step-container {
  transition-property: transform;
  transition-duration: 300ms;
  transition-timing-function: ease;
}

.control-group {
  margin-bottom: 1rem;
}

.slider {
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #007bff;
  cursor: pointer;
}

.qr-container {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
