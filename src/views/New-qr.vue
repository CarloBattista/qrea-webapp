<template>
  <navigation />
  <div class="w-full min-h-screen bg-gray-50 md:px-6 px-3 pt-30 pb-10">
    <div class="max-w-6xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ $t('home.createFirstQr') }}</h1>
        <p class="text-gray-600">{{ $t('editor.title') }}</p>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 md:order-1 order-2">
          <h2 class="text-xl font-semibold mb-6">{{ $t('editor.configuration') }}</h2>

          <!-- Nome QR Code (nuovo campo) -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('editor.qrName') }}</label>
            <input
              v-model="qrName"
              type="text"
              :placeholder="$t('editor.qrNamePlaceholder')"
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <!-- Contenuto QR -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('editor.qrContent') }}</label>
            <textarea
              v-model="store.qrConfig.value"
              :placeholder="$t('editor.qrContentPlaceholder')"
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              rows="3"
            ></textarea>
          </div>

          <!-- Dimensioni -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('qr.size') }} ({{ store.qrConfig.qrSize }}px)</label>
            <slider-bar v-model="store.qrConfig.qrSize" :min="200" :max="600" :step="10" preview-extra-value="px" />
          </div>

          <!-- Margine -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('editor.margin') }} ({{ store.qrConfig.margin }}px)</label>
            <slider-bar v-model="store.qrConfig.margin" :min="0" :max="50" :step="1" preview-extra-value="px" />
          </div>

          <!-- Colori -->
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('editor.colors') }}</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('editor.backgroundColor') }}</label>
                <color-picker v-model="store.qrConfig.background" size="48px" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('editor.foregroundColor') }}</label>
                <color-picker v-model="store.qrConfig.foreground" size="48px" />
              </div>
            </div>
          </div>

          <!-- Gradiente -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
              <checkbox
                :selected="store.qrConfig.gradient"
                @click="handleGradientToggle"
                :label="$t('editor.enableGradient')"
                :disabled="isFreePlan"
              />
              <badge v-if="isFreePlan" label="Pro" />
            </div>
            <div v-if="!isFreePlan && store.qrConfig.gradient" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('editor.gradientStartColor') }}</label>
                  <color-picker v-model="store.qrConfig.gradientStartColor" size="48px" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('editor.gradientEndColor') }}</label>
                  <color-picker v-model="store.qrConfig.gradientEndColor" size="48px" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >{{ $t('editor.gradientRotation') }} ({{ store.qrConfig.gradientRotation }}°)</label
                >
                <slider-bar v-model="store.qrConfig.gradientRotation" :min="0" :max="360" :step="1" preview-extra-value="°" />
              </div>
            </div>
          </div>

          <!-- Stili -->
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('editor.styles') }}</h3>
            <div class="space-y-4">
              <dropdown class="w-full" :label="$t('editor.dotsStyle')" :selected="selectedDotsStyleLabel" :disabled="false">
                <template #content>
                  <dropdownOption
                    v-for="(option, optionIndex) in store.qrConfig.dotStyles"
                    @click="
                      store.qrConfig.dotsStyle = option.value;
                      disabledFunctionRedirect(option);
                    "
                    :key="optionIndex"
                    :value="option.value"
                    :option="option.label"
                    :selected="store.qrConfig.dotsStyle"
                    :disabled="isFreePlan && option.for_pro_user"
                  >
                    <template #badge>
                      <badge v-if="isFreePlan && option.for_pro_user" label="Pro" />
                    </template>
                  </dropdownOption>
                </template>
              </dropdown>
              <dropdown class="w-full" :label="$t('editor.cornersStyle')" :selected="selectedCornerStyleLabel" :disabled="false">
                <template #content>
                  <dropdownOption
                    v-for="(option, optionIndex) in store.qrConfig.cornerStyles"
                    @click="
                      store.qrConfig.cornerStyle = option.value;
                      disabledFunctionRedirect(option);
                    "
                    :key="optionIndex"
                    :value="option.value"
                    :option="option.label"
                    :selected="store.qrConfig.cornerStyle"
                    :disabled="isFreePlan && option.for_pro_user"
                  >
                    <template #badge>
                      <badge v-if="isFreePlan && option.for_pro_user" label="Pro" />
                    </template>
                  </dropdownOption>
                </template>
              </dropdown>
            </div>
          </div>

          <!-- Immagine -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
              <checkbox :selected="store.qrConfig.showImage" @click="handleImageToggle" :label="$t('editor.addCenterImage')" :disabled="isFreePlan" />
              <badge v-if="isFreePlan" label="Pro" />
            </div>
            <div v-if="!isFreePlan && store.qrConfig.showImage" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('editor.imageUrl') }}</label>
                <input
                  v-model="store.qrConfig.imageSettings.src"
                  type="url"
                  :placeholder="$t('editor.imageUrlPlaceholder')"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >{{ $t('editor.imageSize') }} ({{ store.qrConfig.imageSettings.size }}%)</label
                >
                <slider-bar v-model="store.qrConfig.imageSettings.size" :min="10" :max="60" :step="1" preview-extra-value="%" />
              </div>
            </div>
          </div>

          <!-- Formato Download -->
          <div class="mb-6">
            <dropdown class="w-full" :label="$t('editor.downloadFormat')" :selected="selectedFormatLabel" :disabled="false">
              <template #content>
                <dropdownOption
                  v-for="(option, optionIndex) in store.qrConfig.downloadFormats"
                  @click="
                    store.qrConfig.selectedFormat = option.value;
                    disabledFunctionRedirect(option);
                  "
                  :key="optionIndex"
                  :value="option.value"
                  :option="option.label"
                  :selected="store.qrConfig.selectedFormat"
                  :disabled="isFreePlan && option.for_pro_user"
                >
                  <template #badge>
                    <badge v-if="isFreePlan && option.for_pro_user" label="Pro" />
                  </template>
                </dropdownOption>
              </template>
            </dropdown>
          </div>

          <!-- Azioni -->
          <div class="space-y-3">
            <div class="w-full flex gap-3 sm:flex-row flex-col items-center justify-between">
              <div class="w-full flex gap-3 items-center">
                <buttonLg @click="resetToDefaults" variant="secondary" :label="$t('common.reset')" />
                <buttonLg
                  @click="saveQRCode"
                  variant="primary"
                  :label="isSaving ? $t('qr.saving') : $t('qr.saveQr')"
                  :disabled="!store.qrConfig.value || !store.planConfig.can_create_qr || !qrName || !auth.isAuthenticated || isSaving"
                  class="sm:w-fit w-full"
                />
              </div>
              <buttonLg
                @click="downloadQR"
                v-if="!editingQrId"
                variant="primary"
                :label="$t('qr.downloadQr')"
                :disabled="!store.qrConfig.value || !store.planConfig.can_create_qr"
                class="sm:w-fit w-full"
              />
            </div>
          </div>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 md:order-2 order-1">
          <div class="sticky top-8">
            <h2 class="text-xl font-semibold mb-6">{{ $t('qr.preview') }}</h2>
            <div class="flex flex-col items-center">
              <div ref="qrCodeContainer" class="qr-container aspect-square flex items-center justify-center mb-6 p-8 bg-gray-50 rounded-xl">
                <div v-if="!store.qrConfig.value" class="text-gray-400 text-center">
                  <div class="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <span class="text-sm">{{ $t('qr.previewPlaceholder') }}</span>
                  </div>
                </div>
              </div>
              <div v-if="store.qrConfig.value" class="text-center text-sm text-gray-600">
                <p>{{ $t('qr.size') }}: {{ store.qrConfig.qrSize }}x{{ store.qrConfig.qrSize }}px</p>
                <p>{{ $t('qr.format') }}: {{ store.qrConfig.selectedFormat.toUpperCase() }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../lib/supabase';
import { auth } from '../data/auth';
import { store } from '../data/store';

import QRCodeStyling from 'qr-code-styling';

import navigation from '../components/navigation/navigation.vue';
import sliderBar from '../components/slider/slider-bar.vue';
import colorPicker from '../components/input/color-picker.vue';
import checkbox from '../components/toggle/checkbox.vue';
import buttonLg from '../components/button/button-lg.vue';
import badge from '../components/badge/badge.vue';
import dropdown from '../components/dropdown/dropdown.vue';
import dropdownOption from '../components/dropdown/dropdown-option.vue';

export default {
  name: 'New-qr',
  components: {
    navigation,
    sliderBar,
    colorPicker,
    checkbox,
    buttonLg,
    badge,
    dropdown,
    dropdownOption,
  },
  data() {
    return {
      auth,
      store,
      qrName: '',
      editingQrId: null,
      isSaving: false,
      statusMessage: null,
    };
  },
  computed: {
    qrOptions() {
      return {
        width: this.store.qrConfig.qrSize,
        height: this.store.qrConfig.qrSize,
        type: 'svg',
        data: this.store.qrConfig.value,
        image: this.store.qrConfig.showImage ? this.store.qrConfig.imageSettings.src : undefined,
        margin: this.store.qrConfig.margin,
        dotsOptions: {
          color: this.store.qrConfig.foreground,
          type: this.store.qrConfig.dotsStyle,
          gradient: this.store.qrConfig.gradient
            ? {
                type: 'linear',
                rotation: (this.store.qrConfig.gradientRotation * Math.PI) / 180,
                colorStops: [
                  { offset: 0, color: this.store.qrConfig.gradientStartColor },
                  { offset: 1, color: this.store.qrConfig.gradientEndColor },
                ],
              }
            : undefined,
        },
        backgroundOptions: {
          color: this.store.qrConfig.background,
        },
        cornersSquareOptions: {
          type: this.store.qrConfig.cornerStyle,
          color: this.store.qrConfig.foreground,
        },
        cornersDotOptions: {
          type: this.store.qrConfig.cornerStyle === 'square' ? 'square' : 'dot',
          color: this.store.qrConfig.foreground,
        },
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: this.store.qrConfig.imageSettings.size / 100,
          margin: 5,
          crossOrigin: 'anonymous',
        },
      };
    },
    isFreePlan() {
      return !this.auth.profile || this.auth.profile.plan === 'free';
    },
    selectedDotsStyleLabel() {
      const selectedStyle = this.store.qrConfig.dotStyles.find((style) => style.value === this.store.qrConfig.dotsStyle);
      return selectedStyle ? selectedStyle.label : '';
    },
    selectedCornerStyleLabel() {
      const selectedStyle = this.store.qrConfig.cornerStyles.find((style) => style.value === this.store.qrConfig.cornerStyle);
      return selectedStyle ? selectedStyle.label : '';
    },
    selectedFormatLabel() {
      const selectedFormat = this.store.qrConfig.downloadFormats.find((format) => format.value === this.store.qrConfig.selectedFormat);
      return selectedFormat ? selectedFormat.label : '';
    },
  },
  methods: {
    generateQRCode() {
      this.$nextTick(() => {
        if (!this.$refs.qrCodeContainer) {
          return;
        }

        if (this.store.qrConfig.qrCode) {
          this.$refs.qrCodeContainer.innerHTML = '';
        }

        this.store.qrConfig.qrCode = new QRCodeStyling(this.qrOptions);
        this.store.qrConfig.qrCode.append(this.$refs.qrCodeContainer);
      });
    },
    resetToDefaults() {
      if (confirm('Sei sicuro di voler resettare le impostazioni?')) {
        this.store.qrConfig.value = '';
        this.store.qrConfig.qrSize = 300;
        this.store.qrConfig.background = '#ffffff';
        this.store.qrConfig.foreground = '#000000';
        this.store.qrConfig.margin = 10;
        this.store.qrConfig.dotsStyle = 'square';
        this.store.qrConfig.cornerStyle = 'square';
        this.store.qrConfig.gradient = false;
        this.store.qrConfig.gradientStartColor = '#000000';
        this.store.qrConfig.gradientEndColor = '#38bdf8';
        this.store.qrConfig.gradientRotation = 0;
        this.store.qrConfig.showImage = false;
        this.store.qrConfig.imageSettings.size = 40;
        this.store.qrConfig.imageSettings.src = '';
        this.store.qrConfig.selectedFormat = 'png';
      }
    },
    resetToDefaultsWithoutConfirm() {
      this.store.qrConfig.value = '';
      this.store.qrConfig.qrSize = 300;
      this.store.qrConfig.background = '#ffffff';
      this.store.qrConfig.foreground = '#000000';
      this.store.qrConfig.margin = 10;
      this.store.qrConfig.dotsStyle = 'square';
      this.store.qrConfig.cornerStyle = 'square';
      this.store.qrConfig.gradient = false;
      this.store.qrConfig.gradientStartColor = '#000000';
      this.store.qrConfig.gradientEndColor = '#38bdf8';
      this.store.qrConfig.gradientRotation = 0;
      this.store.qrConfig.showImage = false;
      this.store.qrConfig.imageSettings.size = 40;
      this.store.qrConfig.imageSettings.src = '';
      this.store.qrConfig.selectedFormat = 'png';
    },
    downloadQR() {
      const canCreate = this.store.planConfig.can_create_qr;

      if (!canCreate) {
        return;
      }

      if (this.store.qrConfig.qrCode) {
        this.store.qrConfig.qrCode.download({
          name: 'personalized-qr-code',
          extension: this.store.qrConfig.selectedFormat,
        });
      }
    },
    loadQRCode(qrCodeData) {
      // Funzione per caricare un QR code esistente per la modifica
      this.editingQrId = qrCodeData.id;
      this.qrName = qrCodeData.name;
      this.store.qrConfig.value = qrCodeData.content;

      const config = qrCodeData.config;
      this.store.qrConfig.qrSize = config.qrSize;
      this.store.qrConfig.background = config.background;
      this.store.qrConfig.foreground = config.foreground;
      this.store.qrConfig.margin = config.margin;
      this.store.qrConfig.dotsStyle = config.dotsStyle;
      this.store.qrConfig.cornerStyle = config.cornerStyle;
      this.store.qrConfig.gradient = config.gradient;
      this.store.qrConfig.gradientStartColor = config.gradientStartColor;
      this.store.qrConfig.gradientEndColor = config.gradientEndColor;
      this.store.qrConfig.gradientRotation = config.gradientRotation;
      this.store.qrConfig.showImage = config.showImage;
      this.store.qrConfig.imageSettings = config.imageSettings;
      this.store.qrConfig.selectedFormat = config.selectedFormat;
    },
    disabledFunctionRedirect(option) {
      if (this.isFreePlan && option.for_pro_user) {
        this.$router.push({ name: 'pricing' });
        return;
      }
    },
    handleGradientToggle() {
      if (this.isFreePlan) {
        this.$router.push({ name: 'pricing' });
        window.location.reload();
        return;
      }
      this.store.qrConfig.gradient = !this.store.qrConfig.gradient;
    },
    handleImageToggle() {
      if (this.isFreePlan) {
        this.$router.push({ name: 'pricing' });
        window.location.reload();
        return;
      }
      this.store.qrConfig.showImage = !this.store.qrConfig.showImage;
    },

    async loadQRCodeFromRoute() {
      const qrId = this.$route.query.edit;
      if (!qrId || !this.auth.isAuthenticated) return;

      try {
        const { data, error } = await supabase.from('qr_codes').select('*').eq('id', qrId).eq('user_id', this.auth.user.id).single();

        if (error) throw error;

        this.loadQRCode(data);
      } catch (e) {
        console.error(e);
      }
    },
    async saveQRCode() {
      this.isSaving = true;

      const PID = this.auth.profile.id;
      const canCreate = this.store.planConfig.can_create_qr;

      if (!canCreate) {
        this.isSaving = false;
        return;
      }

      if ((!this.auth.isAuthenticated && !PID) || !this.qrName || !this.store.qrConfig.value) {
        this.isSaving = false;
        return;
      }

      try {
        const qrData = {
          name: this.qrName,
          content: this.store.qrConfig.value,
          config: {
            qrSize: this.store.qrConfig.qrSize,
            background: this.store.qrConfig.background,
            foreground: this.store.qrConfig.foreground,
            margin: this.store.qrConfig.margin,
            dotsStyle: this.store.qrConfig.dotsStyle,
            cornerStyle: this.store.qrConfig.cornerStyle,
            gradient: this.store.qrConfig.gradient,
            gradientStartColor: this.store.qrConfig.gradientStartColor,
            gradientEndColor: this.store.qrConfig.gradientEndColor,
            gradientRotation: this.store.qrConfig.gradientRotation,
            showImage: this.store.qrConfig.showImage,
            imageSettings: this.store.qrConfig.imageSettings,
            selectedFormat: this.store.qrConfig.selectedFormat,
          },
        };

        if (this.editingQrId) {
          qrData.updated_at = new Date().toISOString();

          const { error } = await supabase.from('qr_codes').update(qrData).eq('id', this.editingQrId).eq('user_id', this.auth.user.id);

          if (error) {
            throw error;
          }
        } else {
          qrData.pid = PID;
          qrData.created_at = new Date().toISOString();

          const { data, error } = await supabase.from('qr_codes').insert([qrData]).select();

          if (error) {
            throw error;
          }

          this.editingQrId = data[0].id;
        }

        this.resetToDefaultsWithoutConfirm();
        this.$emit('load-qr-codes');
        this.$router.push({ name: 'home' });
      } catch (e) {
        console.error(e);
      } finally {
        this.isSaving = false;
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
    window.scrollTo(0, 0);

    this.generateQRCode();

    if (this.$route.query.edit) {
      this.loadQRCodeFromRoute();
    }
  },
};
</script>

<style scoped></style>
