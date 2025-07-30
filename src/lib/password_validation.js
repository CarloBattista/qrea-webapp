// Regex patterns per la validazione della password
export const PASSWORD_PATTERNS = {
  minLength: (length = 8) => new RegExp(`^.{${length},}$`),
  hasLowercase: /[a-z]/,
  hasUppercase: /[A-Z]/,
  hasNumber: /[0-9]/,
  // eslint-disable-next-line no-useless-escape
  hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

// Funzione helper per validare tutti i requisiti
export const validatePasswordRequirements = (password) => {
  return {
    minLength: PASSWORD_PATTERNS.minLength().test(password),
    hasLowercase: PASSWORD_PATTERNS.hasLowercase.test(password),
    hasUppercase: PASSWORD_PATTERNS.hasUppercase.test(password),
    hasNumber: PASSWORD_PATTERNS.hasNumber.test(password),
    hasSymbol: PASSWORD_PATTERNS.hasSymbol.test(password),
  };
};

// Funzione per verificare se la password è completamente valida
export const isPasswordValid = (password) => {
  const requirements = validatePasswordRequirements(password);
  return Object.values(requirements).every(Boolean);
};
