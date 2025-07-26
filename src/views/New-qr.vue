<template>
  <navigation />
  <div class="w-full min-h-screen bg-gray-50 md:px-6 px-3 pt-30 pb-10">
    <div class="max-w-6xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Crea il tuo QR Code</h1>
        <p class="text-gray-600">Personalizza il tuo QR code con stili, colori e immagini</p>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 md:order-1 order-2">
          <h2 class="text-xl font-semibold mb-6">Configurazione</h2>

          <!-- Nome QR Code (nuovo campo) -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Nome del QR Code</label>
            <input
              v-model="qrName"
              type="text"
              placeholder="Inserisci un nome per il tuo QR code..."
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <!-- Contenuto QR -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Contenuto del QR Code</label>
            <textarea
              v-model="store.qrConfig.value"
              placeholder="Inserisci URL, testo o qualsiasi contenuto..."
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              rows="3"
            ></textarea>
          </div>

          <!-- Dimensioni -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Dimensioni ({{ store.qrConfig.qrSize }}px)</label>
            <slider-bar v-model="store.qrConfig.qrSize" :min="200" :max="600" :step="10" preview-extra-value="px" />
          </div>

          <!-- Margine -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Margine ({{ store.qrConfig.margin }}px)</label>
            <slider-bar v-model="store.qrConfig.margin" :min="0" :max="50" :step="1" preview-extra-value="px" />
          </div>

          <!-- Colori -->
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Colori</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Colore di sfondo</label>
                <color-picker v-model="store.qrConfig.background" size="48px" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Colore principale</label>
                <color-picker v-model="store.qrConfig.foreground" size="48px" />
              </div>
            </div>
          </div>

          <!-- Gradiente -->
          <div class="mb-6">
            <div class="flex items-center mb-4">
              <checkbox :selected="store.qrConfig.gradient" @click="store.qrConfig.gradient = !store.qrConfig.gradient" label="Abilita gradiente" />
            </div>

            <div v-if="store.qrConfig.gradient" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Colore iniziale</label>
                  <color-picker v-model="store.qrConfig.gradientStartColor" size="48px" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Colore finale</label>
                  <color-picker v-model="store.qrConfig.gradientEndColor" size="48px" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Rotazione ({{ store.qrConfig.gradientRotation }}°)</label>
                <slider-bar v-model="store.qrConfig.gradientRotation" :min="0" :max="360" :step="1" preview-extra-value="°" />
              </div>
            </div>
          </div>

          <!-- Stili -->
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Stili</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Stile dei punti</label>
                <select
                  v-model="store.qrConfig.dotsStyle"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option v-for="style in store.qrConfig.dotStyles" :key="style.value" :value="style.value">
                    {{ style.label }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Stile degli angoli</label>
                <select
                  v-model="store.qrConfig.cornerStyle"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option v-for="style in store.qrConfig.cornerStyles" :key="style.value" :value="style.value">
                    {{ style.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Immagine -->
          <div class="mb-6">
            <div class="flex items-center mb-4">
              <checkbox
                :selected="store.qrConfig.showImage"
                @click="store.qrConfig.showImage = !store.qrConfig.showImage"
                label="Aggiungi immagine centrale"
              />
            </div>

            <div v-if="store.qrConfig.showImage" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">URL dell'immagine</label>
                <input
                  v-model="store.qrConfig.imageSettings.src"
                  type="url"
                  placeholder="https://esempio.com/immagine.png"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Dimensione immagine ({{ store.qrConfig.imageSettings.size }}%)</label>
                <slider-bar v-model="store.qrConfig.imageSettings.size" :min="10" :max="80" :step="1" preview-extra-value="%" />
              </div>
            </div>
          </div>

          <!-- Formato Download -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Formato di download</label>
            <select
              v-model="store.qrConfig.selectedFormat"
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option v-for="format in store.qrConfig.downloadFormats" :key="format.value" :value="format.value">
                {{ format.label }}
              </option>
            </select>
          </div>

          <!-- Azioni -->
          <div class="space-y-3">
            <div class="flex gap-3">
              <button-lg variant="primary" label="Scarica QR Code" class="flex-1" @click="downloadQR" :disabled="!store.qrConfig.value" />
              <button-lg variant="secondary" label="Reset" @click="resetToDefaults" />
            </div>

            <!-- Nuovo pulsante per salvare -->
            <div class="flex gap-3">
              <button-lg
                v-if="!editingQrId"
                variant="success"
                :label="isSaving ? 'Salvando...' : 'Salva QR Code'"
                class="flex-1"
                @click="saveQRCode"
                :disabled="!store.qrConfig.value || !qrName || !auth.isAuthenticated || isSaving"
              />
              <button-lg
                v-else
                variant="success"
                :label="isSaving ? 'Aggiornando...' : 'Aggiorna QR Code'"
                class="flex-1"
                @click="updateQRCode"
                :disabled="!store.qrConfig.value || !qrName || !auth.isAuthenticated || isSaving"
              />
              <button-lg v-if="editingQrId" variant="secondary" label="Nuovo QR" @click="createNewQR" />
            </div>

            <!-- Messaggio di stato -->
            <div v-if="statusMessage" class="text-center text-sm" :class="statusMessage.type === 'success' ? 'text-green-600' : 'text-red-600'">
              {{ statusMessage.text }}
            </div>

            <!-- Messaggio per utenti non autenticati -->
            <div v-if="!auth.isAuthenticated" class="text-center text-sm text-gray-500">Effettua il login per salvare i tuoi QR code</div>
          </div>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 md:order-2 order-1">
          <div class="sticky top-8">
            <h2 class="text-xl font-semibold mb-6">Anteprima</h2>
            <div class="flex flex-col items-center">
              <div ref="qrCodeContainer" class="qr-container aspect-square flex items-center justify-center mb-6 p-8 bg-gray-50 rounded-xl">
                <div v-if="!store.qrConfig.value" class="text-gray-400 text-center">
                  <div class="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <span class="text-sm">Inserisci un contenuto per vedere l'anteprima</span>
                  </div>
                </div>
              </div>
              <div v-if="store.qrConfig.value" class="text-center text-sm text-gray-600">
                <p>Dimensioni: {{ store.qrConfig.qrSize }}x{{ store.qrConfig.qrSize }}px</p>
                <p>Formato: {{ store.qrConfig.selectedFormat.toUpperCase() }}</p>
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

export default {
  name: 'New-qr',
  components: {
    navigation,
    sliderBar,
    colorPicker,
    checkbox,
    buttonLg,
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
  },
  methods: {
    generateQRCode() {
      if (this.store.qrConfig.qrCode) {
        this.$refs.qrCodeContainer.innerHTML = '';
      }

      this.store.qrConfig.qrCode = new QRCodeStyling(this.qrOptions);
      this.store.qrConfig.qrCode.append(this.$refs.qrCodeContainer);
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
    downloadQR() {
      if (this.store.qrConfig.qrCode) {
        this.store.qrConfig.qrCode.download({
          name: 'personalized-qr-code',
          extension: this.store.qrConfig.selectedFormat,
        });
      }
    },
    createNewQR() {
      this.editingQrId = null;
      this.qrName = '';
      this.resetToDefaults();
      this.showStatusMessage('Pronto per creare un nuovo QR Code', 'success');
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
    showStatusMessage(text, type) {
      this.statusMessage = { text, type };
      setTimeout(() => {
        this.statusMessage = null;
      }, 5000);
    },

    async loadQRCodeFromRoute() {
      const qrId = this.$route.query.edit;
      if (!qrId || !this.auth.isAuthenticated) return;

      try {
        const { data, error } = await supabase.from('qr_codes').select('*').eq('id', qrId).eq('user_id', this.auth.user.id).single();

        if (error) throw error;

        this.loadQRCode(data);
      } catch (error) {
        console.error('Errore nel caricare il QR Code:', error);
        this.showStatusMessage('Errore nel caricare il QR Code', 'error');
      }
    },
    async saveQRCode() {
      this.isSaving = true;

      const PID = this.auth.profile.id;

      if ((!this.auth.isAuthenticated && !PID) || !this.qrName || !this.store.qrConfig.value) {
        this.showStatusMessage('Assicurati di essere autenticato e di aver inserito nome e contenuto', 'error');
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
          pid: PID,
          created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase.from('qr_codes').insert([qrData]).select();

        if (error) {
          throw error;
        }

        this.editingQrId = data[0].id;
      } catch (e) {
        console.error(e);
      } finally {
        this.isSaving = false;
      }
    },
    async updateQRCode() {
      if (!this.auth.isAuthenticated || !this.qrName || !this.store.qrConfig.value || !this.editingQrId) {
        return;
      }

      this.isSaving = true;

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
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('qr_codes').update(qrData).eq('id', this.editingQrId).eq('user_id', this.auth.user.id);

        if (error) {
          throw error;
        }

        this.showStatusMessage('QR Code aggiornato con successo!', 'success');
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
    this.generateQRCode();

    // Controlla se c'è un QR code da modificare nei parametri della route
    if (this.$route.query.edit) {
      this.loadQRCodeFromRoute();
    }
  },
};
</script>

<style scoped></style>
