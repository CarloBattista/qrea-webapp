import { ref, reactive } from 'vue';
import { validators, validateFields, validateField, VALIDATION_MESSAGES } from '../lib/validation';

export function useValidation() {
  const errors = reactive({});
  const isValidating = ref(false);
  
  // Pulisce tutti gli errori
  const clearErrors = () => {
    Object.keys(errors).forEach(key => {
      delete errors[key];
    });
  };
  
  // Pulisce l'errore di un campo specifico
  const clearError = (field) => {
    delete errors[field];
  };
  
  // Imposta un errore per un campo
  const setError = (field, message) => {
    errors[field] = message;
  };
  
  // Valida un singolo campo
  const validateSingle = (field, value, validator, options = {}) => {
    isValidating.value = true;
    
    const result = validateField(value, validator, options);
    
    if (result.isValid) {
      clearError(field);
    } else {
      setError(field, result.error);
    }
    
    isValidating.value = false;
    return result.isValid;
  };
  
  // Valida più campi contemporaneamente
  const validateMultiple = (data, rules) => {
    isValidating.value = true;
    clearErrors();
    
    const result = validateFields(data, rules);
    
    Object.assign(errors, result.errors);
    
    isValidating.value = false;
    return result.isValid;
  };
  
  // Validatori specifici per i form di autenticazione
  const authValidators = {
    email: (email, options = {}) => {
      return validateSingle('email', email, validators.email.validate, {
        requiredMessage: VALIDATION_MESSAGES.EMAIL_REQUIRED,
        invalidMessage: VALIDATION_MESSAGES.EMAIL_INVALID,
        ...options
      });
    },
    
    emailAddress: (email) => {
      return validateSingle('email', email, validators.email.validate, {
        requiredMessage: VALIDATION_MESSAGES.EMAIL_REQUIRED_ADDRESS,
        invalidMessage: VALIDATION_MESSAGES.EMAIL_INVALID_ADDRESS
      });
    },
    
    password: (password, requireStrong = true) => {
      return validateSingle('password', password, validators.password.validate, {
        requireStrong,
        requiredMessage: VALIDATION_MESSAGES.PASSWORD_REQUIRED
      });
    },
    
    firstName: (firstName) => {
      return validateSingle('first_name', firstName, validators.name.validate, 'first_name');
    },
    
    lastName: (lastName) => {
      return validateSingle('last_name', lastName, validators.name.validate, 'last_name');
    },
    
    // Validazione completa per il form di signup
    signupForm: (data) => {
      return validateMultiple(data, {
        first_name: (value) => validators.name.validate(value, 'first_name'),
        last_name: (value) => validators.name.validate(value, 'last_name'),
        email: (value) => validators.email.validate(value),
        password: (value) => validators.password.validate(value)
      });
    },
    
    // Validazione completa per il form di signin
    signinForm: (data) => {
      return validateMultiple(data, {
        email: (value) => validators.email.validate(value),
        password: (value) => validators.password.validate(value, { requireStrong: false })
      });
    },
    
    // Validazione per reset password
    resetPasswordForm: (data) => {
      return validateMultiple(data, {
        password: (value) => validators.password.validate(value)
      });
    },
    
    // Validazione per forgot password
    forgotPasswordForm: (data) => {
      return validateMultiple(data, {
        email: (value) => validators.email.validate(value, {
          requiredMessage: VALIDATION_MESSAGES.EMAIL_REQUIRED_ADDRESS,
          invalidMessage: VALIDATION_MESSAGES.EMAIL_INVALID_ADDRESS
        })
      });
    }
  };
  
  return {
    errors,
    isValidating,
    clearErrors,
    clearError,
    setError,
    validateSingle,
    validateMultiple,
    ...authValidators
  };
}