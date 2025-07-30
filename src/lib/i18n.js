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

const fallbackLocale = 'it-IT';

// Funzione per aggiornare i meta tag
function updateMetaTags(locale) {
  const meta = messages[locale]?.meta;
  if (!meta) return;

  // Aggiorna il title
  document.title = meta.title;

  // Aggiorna meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', meta.description);
  }

  // Aggiorna Open Graph title
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', meta.ogTitle);
  }

  // Aggiorna Open Graph description
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    ogDescription.setAttribute('content', meta.ogDescription);
  }
}

// Funzione per ottenere la lingua di default
function getDefaultLocale() {
  // Se il profilo esiste e ha una lingua impostata, usala
  if (auth.profile && auth.profile.lang && messages[auth.profile.lang]) {
    return auth.profile.lang;
  }

  return fallbackLocale;
}

const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: fallbackLocale,
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
    // Aggiorna i meta tag
    updateMetaTags(locale);
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
    updateMetaTags(auth.profile.lang);
  } else {
    // Se non c'è una lingua valida nel profilo, usa il fallback
    i18n.global.locale.value = fallbackLocale;
    document.documentElement.lang = fallbackLocale;
    updateMetaTags(fallbackLocale);
  }
}

// Funzione per inizializzare i meta tag
export function initializeMetaTags() {
  updateMetaTags(getCurrentLocale());
}
