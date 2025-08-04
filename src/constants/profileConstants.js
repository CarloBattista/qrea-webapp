// Mapping per gli stati dei pagamenti
export const PAYMENT_STATUS_MAP = {
  paid: 'Pagato',
  open: 'In attesa',
  draft: 'In attesa',
  void: 'Annullato',
  uncollectible: 'Non riscuotibile',
}

// Tipi di piano
export const PLAN_TYPES = {
  FREE: 'free',
  PRO: 'pro',
}

// Etichette per i tipi di abbonamento
export const SUBSCRIPTION_LABELS = {
  FREE: 'Free',
  PRO: 'Pro',
  SUSPENDED: 'Sospeso',
}

// Configurazione per la formattazione delle date
export const DATE_FORMAT_CONFIG = {
  locale: 'it-IT',
  options: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  },
}

// Messaggi di conferma
export const CONFIRMATION_MESSAGES = {
  CANCEL_SUBSCRIPTION: 'Sei sicuro di voler cancellare il tuo abbonamento? Rimarrà attivo fino alla fine del periodo di fatturazione corrente.',
}

// Messaggi di successo
export const SUCCESS_MESSAGES = {
  SUBSCRIPTION_CANCELLED: 'Abbonamento cancellato con successo. Rimarrà attivo fino alla fine del periodo di fatturazione corrente.',
  PAYMENT_COMPLETED: 'Pagamento completato con successo!',
  LANGUAGE_UPDATED: 'Lingua aggiornata con successo',
}