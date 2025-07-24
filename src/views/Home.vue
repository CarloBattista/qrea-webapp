<template>
  <div class="qr-generator-container">
    <!-- Pannello di controllo -->
    <div class="controls-panel">
      <h2>Personalizza il tuo QR Code</h2>

      <!-- URL Input -->
      <div class="control-group">
        <label>URL/Testo:</label>
        <input v-model="value" type="text" placeholder="Inserisci URL o testo" class="text-input" />
      </div>

      <!-- Dimensioni -->
      <div class="control-group">
        <label>Dimensioni: {{ qrSize }}px</label>
        <input v-model="qrSize" type="range" min="200" max="500" class="slider" />
      </div>

      <!-- Colore Foreground -->
      <div class="control-group">
        <label>Colore Principale:</label>
        <div class="color-controls">
          <input v-model="foreground" type="color" class="color-picker" />
          <span>{{ foreground }}</span>
        </div>
      </div>

      <!-- Colore Background -->
      <div class="control-group">
        <label>Colore Sfondo:</label>
        <div class="color-controls">
          <input v-model="background" type="color" class="color-picker" />
          <span>{{ background }}</span>
        </div>
      </div>

      <!-- Stile Dots -->
      <div class="control-group">
        <label>Stile Punti:</label>
        <div class="button-group">
          <button
            v-for="style in dotStyles"
            :key="style.value"
            @click="dotsStyle = style.value"
            :class="{ active: dotsStyle === style.value }"
            class="style-button"
          >
            {{ style.label }}
          </button>
        </div>
      </div>

      <!-- Stile Angoli -->
      <div class="control-group">
        <label>Stile Angoli:</label>
        <div class="button-group">
          <button
            v-for="style in cornerStyles"
            :key="style.value"
            @click="cornerStyle = style.value"
            :class="{ active: cornerStyle === style.value }"
            class="style-button"
          >
            {{ style.label }}
          </button>
        </div>
      </div>

      <!-- Gradiente -->
      <div class="control-group">
        <label>
          <input v-model="gradient" type="checkbox" />
          Abilita Gradiente
        </label>
      </div>

      <div v-if="gradient" class="gradient-controls">
        <div class="control-group">
          <label>Colore Inizio Gradiente:</label>
          <div class="color-controls">
            <input v-model="gradientStartColor" type="color" class="color-picker" />
            <span>{{ gradientStartColor }}</span>
          </div>
        </div>

        <div class="control-group">
          <label>Colore Fine Gradiente:</label>
          <div class="color-controls">
            <input v-model="gradientEndColor" type="color" class="color-picker" />
            <span>{{ gradientEndColor }}</span>
          </div>
        </div>

        <div class="control-group">
          <label>Rotazione Gradiente: {{ gradientRotation }}°</label>
          <input v-model="gradientRotation" type="range" min="0" max="360" class="slider" />
        </div>
      </div>

      <!-- Logo/Immagine -->
      <div class="control-group">
        <label>
          <input v-model="showImage" type="checkbox" />
          Mostra Logo
        </label>
      </div>

      <div v-if="showImage" class="image-controls">
        <div class="control-group">
          <label>URL Immagine:</label>
          <input v-model="imageSettings.src" type="text" placeholder="URL dell'immagine" class="text-input" />
        </div>

        <div class="control-group">
          <label>Dimensione Immagine: {{ imageSize }}%</label>
          <input v-model="imageSize" type="range" min="10" max="50" class="slider" />
        </div>
      </div>

      <!-- Margine -->
      <div class="control-group">
        <label>Margine: {{ margin }}px</label>
        <input v-model="margin" type="range" min="0" max="50" class="slider" />
      </div>

      <!-- Pulsanti Azione -->
      <div class="action-buttons">
        <button @click="resetToDefaults" class="reset-button">Reset Impostazioni</button>
        <button @click="downloadQR" class="download-button">Scarica QR Code</button>
      </div>
    </div>

    <!-- Anteprima QR Code -->
    <div class="qr-preview">
      <h3>Anteprima</h3>
      <div class="qr-container" ref="qrCodeContainer">
        <!-- Il QR code verrà generato qui -->
      </div>
    </div>
  </div>
</template>

<script>
import QRCodeStyling from 'qr-code-styling';

export default {
  name: 'Home',
  data() {
    return {
      value: 'https://www.newfarosport.it/',
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
      showImage: true,
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

  methods: {
    generateQRCode() {
      if (this.qrCode) {
        this.$refs.qrCodeContainer.innerHTML = '';
      }

      this.qrCode = new QRCodeStyling(this.qrOptions);
      this.qrCode.append(this.$refs.qrCodeContainer);
    },

    resetToDefaults() {
      this.value = 'https://www.newfarosport.it/';
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
      this.showImage = true;
      this.imageSize = 40;
    },

    downloadQR() {
      if (this.qrCode) {
        this.qrCode.download({
          name: 'qr-code-personalizzato',
          extension: 'png',
        });
      }
    },
  },
};
</script>

<style scoped>
.qr-generator-container {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.controls-panel {
  flex: 1;
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-height: 80vh;
  overflow-y: auto;
}

.qr-preview {
  flex: 1;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-container {
  margin-top: 1rem;
  padding: 1rem;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

h2,
h3 {
  margin-top: 0;
  color: #333;
}

.control-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

.text-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.text-input:focus {
  outline: none;
  border-color: #007bff;
}

.slider {
  width: 100%;
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

.color-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-picker {
  width: 50px;
  height: 40px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.style-button {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.style-button:hover {
  border-color: #007bff;
}

.style-button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.gradient-controls,
.image-controls {
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 3px solid #e0e0e0;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.reset-button,
.download-button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.reset-button {
  background: #6c757d;
  color: white;
}

.reset-button:hover {
  background: #5a6268;
}

.download-button {
  background: #28a745;
  color: white;
}

.download-button:hover {
  background: #218838;
}

@media (max-width: 768px) {
  .qr-generator-container {
    flex-direction: column;
    padding: 1rem;
  }

  .controls-panel {
    max-height: none;
  }
}
</style>
