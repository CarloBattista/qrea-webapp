import { createI18n } from 'vue-i18n';
import { auth } from '../data/auth';

// Importa manualmente i file delle lingue
import itIT from '../lang/it-IT.json';
import enUS from '../lang/en-US.json';

// Costruisce l'oggetto messages
const messages = {
  'it-IT': itIT,
  'en-US': enUS,
};

// Funzione per ottenere la lingua di default
function getDefaultLocale() {
  // Se il profilo esiste e ha una lingua impostata, usala
  if (auth.profile && auth.profile.lang && messages[auth.profile.lang]) {
    return auth.profile.lang;
  }

  return 'en-US';
}

const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'en-US',
  messages,
  globalInjection: true,
});

export default i18n;

// Funzione helper per cambiare lingua
export function setLocale(locale) {
  if (messages[locale]) {
    i18n.global.locale.value = locale;
    // Salva solo nel profilo auth
    if (auth.profile) {
      auth.profile.lang = locale;
    }
    document.documentElement.lang = locale;
  }
}

// Funzione helper per ottenere la lingua corrente
export function getCurrentLocale() {
  return i18n.global.locale.value;
}

// Funzione per sincronizzare la lingua con il profilo (migliorata)
export function syncLocaleWithProfile() {
  if (auth.profile && auth.profile.lang && messages[auth.profile.lang]) {
    i18n.global.locale.value = auth.profile.lang;
    document.documentElement.lang = auth.profile.lang;
  } else {
    // Se non c'è una lingua valida nel profilo, usa il fallback
    i18n.global.locale.value = 'en-US';
    document.documentElement.lang = 'en-US';
  }
}
