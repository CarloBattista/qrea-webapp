<template>
  <navigation />
  <div class="w-full min-h-screen bg-gray-50 md:px-6 px-3 pt-30 pb-10">
    <div class="max-w-6xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ $t('editor.editTitle') }}</h1>
        <p class="text-gray-600">{{ $t('editor.editSubtitle') }}</p>
      </div>
      <div v-if="qrCode.data" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 md:order-1 order-2">
          <h2 class="text-xl font-semibold mb-6">{{ $t('editor.configuration') }}</h2>

          <!-- Nome QR Code (nuovo campo) -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('editor.qrName') }}</label>
            <input
              v-model="qrCode.data.name"
              type="text"
              :placeholder="$t('editor.qrNamePlaceholder')"
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <!-- Contenuto QR -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('editor.qrContent') }}</label>
            <textarea
              v-model="qrCode.data.content"
              :placeholder="$t('editor.qrContentPlaceholder')"
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              rows="3"
            ></textarea>
          </div>

          <!-- Dimensioni -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('qr.size') }} ({{ qrCode.data.config.qrSize }}px)</label>
            <slider-bar v-model="qrCode.data.config.qrSize" :min="200" :max="600" :step="10" preview-extra-value="px" />
          </div>

          <!-- Margine -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('editor.margin') }} ({{ qrCode.data.config.margin }}px)</label>
            <slider-bar v-model="qrCode.data.config.margin" :min="0" :max="50" :step="1" preview-extra-value="px" />
          </div>

          <!-- Colori -->
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('editor.colors') }}</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('editor.backgroundColor') }}</label>
                <color-picker v-model="qrCode.data.config.background" size="48px" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('editor.foregroundColor') }}</label>
                <color-picker v-model="qrCode.data.config.foreground" size="48px" />
              </div>
            </div>
          </div>

          <!-- Gradiente -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
              <checkbox
                :selected="qrCode.data.config.gradient"
                @click="handleGradientToggle"
                :label="$t('editor.enableGradient')"
                :disabled="isFreePlan"
              />
              <badge v-if="auth.profile.plan === 'free'" label="Pro" />
            </div>
            <div v-if="!isFreePlan && qrCode.data.config.gradient" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('editor.gradientStartColor') }}</label>
                  <color-picker v-model="qrCode.data.config.gradientStartColor" size="48px" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('editor.gradientEndColor') }}</label>
                  <color-picker v-model="qrCode.data.config.gradientEndColor" size="48px" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >{{ $t('editor.gradientRotation') }} ({{ qrCode.data.config.gradientRotation }}°)</label
                >
                <slider-bar v-model="qrCode.data.config.gradientRotation" :min="0" :max="360" :step="1" preview-extra-value="°" />
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
                      qrCode.data.config.dotsStyle = option.value;
                      disabledFunctionRedirect(option);
                    "
                    :key="optionIndex"
                    :value="option.value"
                    :option="option.label"
                    :selected="qrCode.data.config.dotsStyle"
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
                      qrCode.data.config.cornerStyle = option.value;
                      disabledFunctionRedirect(option);
                    "
                    :key="optionIndex"
                    :value="option.value"
                    :option="option.label"
                    :selected="qrCode.data.config.cornerStyle"
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
            <div class="flex items-center mb-4 justify-between">
              <checkbox
                :selected="qrCode.data.config.showImage"
                @click="handleImageToggle"
                :label="$t('editor.addCenterImage')"
                :disabled="isFreePlan"
              />
              <badge v-if="auth.profile.plan === 'free'" label="Pro" />
            </div>
            <div v-if="!isFreePlan && qrCode.data.config.showImage" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('editor.imageUrl') }}</label>
                <input
                  v-model="qrCode.data.config.imageSettings.src"
                  type="url"
                  :placeholder="$t('editor.imageUrlPlaceholder')"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >{{ $t('editor.imageSize') }} ({{ qrCode.data.config.imageSettings.size }}%)</label
                >
                <slider-bar v-model="qrCode.data.config.imageSettings.size" :min="10" :max="60" :step="1" preview-extra-value="%" />
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
                    qrCode.data.config.selectedFormat = option.value;
                    disabledFunctionRedirect(option);
                  "
                  :key="optionIndex"
                  :value="option.value"
                  :option="option.label"
                  :selected="qrCode.data.config.selectedFormat"
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
                  @click="saveQrCode"
                  v-if="!editingQrId"
                  variant="primary"
                  :label="isSaving ? $t('qr.saving') : $t('qr.saveQr')"
                  :disabled="!qrCode.data.content || !qrCode.data.name || !auth.isAuthenticated || isSaving"
                  class="sm:w-fit w-full"
                />
              </div>
              <buttonLg
                @click="downloadQR"
                variant="secondary"
                :label="$t('qr.downloadQr')"
                :disabled="!qrCode.data.content"
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
                <div v-if="!qrCode.data" class="text-gray-400 text-center">
                  <div class="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <span class="text-sm">{{ $t('qr.previewPlaceholder') }}</span>
                  </div>
                </div>
              </div>
              <div v-if="qrCode.data" class="text-center text-sm text-gray-600">
                <p>{{ $t('qr.size') }}: {{ qrCode.data.config.qrSize }}x{{ qrCode.data.config.qrSize }}px</p>
                <p>{{ $t('qr.format') }}: {{ qrCode.data.config.selectedFormat.toUpperCase() }}</p>
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
import colorPicker from '../components/input/color-picker.vue';
import sliderBar from '../components/slider/slider-bar.vue';
import checkbox from '../components/toggle/checkbox.vue';
import buttonLg from '../components/button/button-lg.vue';
import badge from '../components/badge/badge.vue';
import dropdown from '../components/dropdown/dropdown.vue';
import dropdownOption from '../components/dropdown/dropdown-option.vue';

export default {
  name: 'Edit-qr',
  components: {
    navigation,
    colorPicker,
    sliderBar,
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
      qrCodeId: this.$route.params.id,
      qrCode: {
        data: null,
        error: null,
        loading: false,
      },
      qrCodeInstance: null,
      isSaving: false,
    };
  },
  computed: {
    qrOptions() {
      if (!this.qrCode.data?.content) return null;

      const config = this.qrCode.data.config;

      return {
        type: 'svg',
        data: this.qrCode.data.content,
        image: config.showImage && config.imageSettings?.src ? config.imageSettings.src : undefined,
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
    isFreePlan() {
      return !this.auth.profile || this.auth.profile.plan === 'free';
    },
    selectedDotsStyleLabel() {
      const selectedStyle = this.store.qrConfig.dotStyles.find((style) => style.value === this.qrCode.data?.config?.dotsStyle);
      return selectedStyle ? selectedStyle.label : '';
    },
    selectedCornerStyleLabel() {
      const selectedStyle = this.store.qrConfig.cornerStyles.find((style) => style.value === this.qrCode.data?.config?.cornerStyle);
      return selectedStyle ? selectedStyle.label : '';
    },
    selectedFormatLabel() {
      const selectedFormat = this.store.qrConfig.downloadFormats.find((format) => format.value === this.qrCode.data?.config?.selectedFormat);
      return selectedFormat ? selectedFormat.label : '';
    },
  },
  methods: {
    generateQRCode() {
      if (!this.qrOptions || !this.$refs.qrCodeContainer) return;

      if (this.qrCodeInstance) {
        this.$refs.qrCodeContainer.innerHTML = '';
      }

      try {
        this.qrCodeInstance = new QRCodeStyling(this.qrOptions);
        this.qrCodeInstance.append(this.$refs.qrCodeContainer);
      } catch (e) {
        console.error(e);
      }
    },
    downloadQR() {
      if (this.qrCodeInstance) {
        this.qrCodeInstance.download({
          name: 'personalized-qr-code',
          extension: this.store.qrConfig.selectedFormat,
        });
      }
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
      this.qrCode.data.config.gradient = !this.qrCode.data.config.gradient;
    },
    handleImageToggle() {
      if (this.isFreePlan) {
        this.$router.push({ name: 'pricing' });
        window.location.reload();
        return;
      }
      this.qrCode.data.config.showImage = !this.qrCode.data.config.showImage;
    },

    async getQrCode() {
      this.qrCode.loading = true;

      const PID = this.auth.profile.id;

      if (!PID) {
        this.qrCode.loading = false;
        return;
      }

      try {
        const { data, error } = await supabase.from('qr_codes').select('*').eq('pid', PID).eq('id', this.qrCodeId).single();

        if (!error && data) {
          this.qrCode.data = data;
        } else if (error.code === '22P02' || error.code === 'PGRST116') {
          this.$router.push({ name: 'not-found' });
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.qrCode.loading = false;
      }
    },
    async saveQrCode() {
      this.isSaving = true;

      try {
        const { error } = await supabase
          .from('qr_codes')
          .update({
            name: this.qrCode.data.name,
            content: this.qrCode.data.content,
            config: this.qrCode.data.config,
          })
          .eq('id', this.qrCodeId);

        if (!error) {
          this.$emit('load-qr-codes');
          this.$router.push({ name: 'home' });
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.isSaving = false;
      }
    },
  },
  watch: {
    '$route.params.id': {
      handler(value) {
        if (value) {
          this.qrCodeId = value;
        }
      },
      immediate: true,
      deep: true,
    },
    'auth.profile': {
      handler(value) {
        if (value) {
          this.getQrCode();
        }
      },
      deep: true,
    },
    qrCode: {
      handler() {
        this.$nextTick(() => {
          this.generateQRCode();
        });
      },
      deep: true,
    },
  },
  async mounted() {
    window.scrollTo(0, 0);

    this.generateQRCode();

    if (this.auth.profile && this.qrCodeId) await this.getQrCode();
  },
};
</script>

<style scoped></style>
