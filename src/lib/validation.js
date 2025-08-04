import supportedDomains from '../json/supported_domains.json';

// Messaggi di errore centralizzati
export const VALIDATION_MESSAGES = {
  // Email
  EMAIL_REQUIRED: 'Inserisci la tua email',
  EMAIL_REQUIRED_ADDRESS: 'Inserisci un indirizzo email',
  EMAIL_INVALID: 'Inserisci una email valida',
  EMAIL_INVALID_ADDRESS: 'Inserisci un indirizzo email valido',
  
  // Password
  PASSWORD_REQUIRED: 'Inserisci una password',
  PASSWORD_REQUIRED_NEW: 'Inserisci una password',
  PASSWORD_MIN_LENGTH: 'La password deve contenere almeno 8 caratteri',
  PASSWORD_LOWERCASE: 'La password deve contenere almeno una lettera minuscola',
  PASSWORD_UPPERCASE: 'La password deve contenere almeno una lettera maiuscola',
  PASSWORD_NUMBER: 'La password deve contenere almeno un numero',
  PASSWORD_SYMBOL: 'La password deve contenere almeno un simbolo (!@#$%^&*()_+-=[]{};\':"|,.<>/?)',
  
  // Nomi
  FIRST_NAME_REQUIRED: 'Inserisci il tuo nome',
  LAST_NAME_REQUIRED: 'Inserisci il tuo cognome',
  
  // Sessione
  SESSION_EXPIRED: 'La sessione è scaduta',
  
  // Errori generali
  INVALID_CREDENTIALS: "L'email o la password inserite non sono corrette",
  EMAIL_NOT_CONFIRMED: "L'email non è stata confermata",
  GENERAL_ERROR: 'Si è verificato un errore generale, riprova più tardi'
};

// Pattern per la validazione delle password
export const PASSWORD_PATTERNS = {
  minLength: (length = 8) => new RegExp(`^.{${length},}$`),
  hasLowercase: /[a-z]/,
  hasUppercase: /[A-Z]/,
  hasNumber: /[0-9]/,
  hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

// Classe per la gestione degli errori di validazione
export class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.field = field;
    this.name = 'ValidationError';
  }
}

// Validatori individuali
export const validators = {
  // Validazione email
  email: {
    validate(email, options = {}) {
      const { requiredMessage = VALIDATION_MESSAGES.EMAIL_REQUIRED, invalidMessage = VALIDATION_MESSAGES.EMAIL_INVALID } = options;
      
      if (!email || email.trim() === '') {
        throw new ValidationError('email', requiredMessage);
      }
      
      const supportedDomainsPattern = supportedDomains.join('|');
      const emailRegex = new RegExp(`^[^\\s@]+@(${supportedDomainsPattern})\\.(com|it|org|net|edu|gov|io)$`, 'i');
      
      if (!emailRegex.test(email.trim())) {
        throw new ValidationError('email', invalidMessage);
      }
      
      return true;
    },
    
    // Validazione email semplice (senza controllo domini supportati)
    validateSimple(email, options = {}) {
      const { requiredMessage = VALIDATION_MESSAGES.EMAIL_REQUIRED, invalidMessage = VALIDATION_MESSAGES.EMAIL_INVALID } = options;
      
      if (!email || email.trim() === '') {
        throw new ValidationError('email', requiredMessage);
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(email.trim())) {
        throw new ValidationError('email', invalidMessage);
      }
      
      return true;
    }
  },
  
  // Validazione password
  password: {
    validate(password, options = {}) {
      const { 
        requireStrong = true,
        requiredMessage = VALIDATION_MESSAGES.PASSWORD_REQUIRED 
      } = options;
      
      if (!password || password.trim() === '') {
        throw new ValidationError('password', requiredMessage);
      }
      
      if (!requireStrong) {
        return true;
      }
      
      // Validazione password forte
      if (!PASSWORD_PATTERNS.minLength().test(password)) {
        throw new ValidationError('password', VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH);
      }
      
      if (!PASSWORD_PATTERNS.hasLowercase.test(password)) {
        throw new ValidationError('password', VALIDATION_MESSAGES.PASSWORD_LOWERCASE);
      }
      
      if (!PASSWORD_PATTERNS.hasUppercase.test(password)) {
        throw new ValidationError('password', VALIDATION_MESSAGES.PASSWORD_UPPERCASE);
      }
      
      if (!PASSWORD_PATTERNS.hasNumber.test(password)) {
        throw new ValidationError('password', VALIDATION_MESSAGES.PASSWORD_NUMBER);
      }
      
      if (!PASSWORD_PATTERNS.hasSymbol.test(password)) {
        throw new ValidationError('password', VALIDATION_MESSAGES.PASSWORD_SYMBOL);
      }
      
      return true;
    },
    
    // Verifica i requisiti della password e restituisce un oggetto dettagliato
    checkRequirements(password) {
      return {
        minLength: PASSWORD_PATTERNS.minLength().test(password),
        hasLowercase: PASSWORD_PATTERNS.hasLowercase.test(password),
        hasUppercase: PASSWORD_PATTERNS.hasUppercase.test(password),
        hasNumber: PASSWORD_PATTERNS.hasNumber.test(password),
        hasSymbol: PASSWORD_PATTERNS.hasSymbol.test(password),
        isValid: this.isValid(password)
      };
    },
    
    // Verifica se la password è completamente valida
    isValid(password) {
      try {
        this.validate(password);
        return true;
      } catch {
        return false;
      }
    }
  },
  
  // Validazione nomi
  name: {
    validate(name, field = 'name') {
      const message = field === 'first_name' 
        ? VALIDATION_MESSAGES.FIRST_NAME_REQUIRED 
        : VALIDATION_MESSAGES.LAST_NAME_REQUIRED;
      
      if (!name || name.trim() === '') {
        throw new ValidationError(field, message);
      }
      
      return true;
    }
  },
  
  // Validazione campi richiesti generici
  required: {
    validate(value, field, message) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        throw new ValidationError(field, message);
      }
      
      return true;
    }
  }
};

// Funzione helper per validare più campi contemporaneamente
export function validateFields(data, rules) {
  const errors = {};
  
  for (const [field, rule] of Object.entries(rules)) {
    try {
      if (typeof rule === 'function') {
        rule(data[field]);
      } else if (rule.validator && typeof rule.validator === 'function') {
        rule.validator(data[field], rule.options || {});
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        errors[field] = error.message;
      } else {
        errors[field] = 'Errore di validazione';
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Funzione helper per validare un singolo campo
export function validateField(value, validator, options = {}) {
  try {
    if (typeof validator === 'function') {
      validator(value, options);
    } else if (validator.validate && typeof validator.validate === 'function') {
      validator.validate(value, options);
    }
    return { isValid: true, error: null };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { isValid: false, error: error.message };
    }
    return { isValid: false, error: 'Errore di validazione' };
  }
}

// Gestione errori di autenticazione Supabase
export function handleAuthError(error) {
  switch (error.code) {
    case 'invalid_credentials':
      return {
        type: 'invalid_credentials',
        message: VALIDATION_MESSAGES.INVALID_CREDENTIALS,
        field: 'general'
      };
    case 'email_not_confirmed':
      return {
        type: 'email_not_confirmed',
        message: VALIDATION_MESSAGES.EMAIL_NOT_CONFIRMED,
        field: 'general'
      };
    default:
      return {
        type: 'general_error',
        message: VALIDATION_MESSAGES.GENERAL_ERROR,
        field: 'general'
      };
  }
}

// Export delle funzioni legacy per compatibilità
export const validatePasswordRequirements = validators.password.checkRequirements;
export const isPasswordValid = validators.password.isValid;