/**
 * Frontend validation utilities for authentication forms
 * These mirror the backend validators for client-side validation
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(String(email).toLowerCase());
};

/**
 * Validate phone number format (exactly 10 digits)
 * @param {string} phone - Phone number to validate
 * @returns {object} - { isValid: boolean, error?: string }
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: false, error: "Phone number is required" };
  }

  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length !== 10) {
    return { isValid: false, error: "Phone number must be exactly 10 digits" };
  }

  return { isValid: true };
};

/**
 * Check individual password requirements
 * @param {string} password - Password to check
 * @returns {object} - Requirements status
 */
export const getPasswordRequirements = (password) => {
  return {
    minLength: password?.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password) {
    return { isValid: false, errors: ["Password is required"] };
  }

  const requirements = getPasswordRequirements(password);

  if (!requirements.minLength) {
    errors.push("At least 8 characters");
  }

  if (!requirements.hasUppercase) {
    errors.push("At least one uppercase letter (A-Z)");
  }

  if (!requirements.hasLowercase) {
    errors.push("At least one lowercase letter (a-z)");
  }

  if (!requirements.hasNumber) {
    errors.push("At least one number (0-9)");
  }

  if (!requirements.hasSpecialChar) {
    errors.push("At least one special character (!@#$%^&*...)");
  }

  return {
    isValid: errors.length === 0,
    errors,
    requirements
  };
};

/**
 * Get password strength score (0-5)
 * @param {string} password - Password to evaluate
 * @returns {number} - Strength score
 */
export const getPasswordStrength = (password) => {
  if (!password) return 0;

  let score = 0;
  const requirements = getPasswordRequirements(password);

  if (requirements.minLength) score++;
  if (requirements.hasUppercase) score++;
  if (requirements.hasLowercase) score++;
  if (requirements.hasNumber) score++;
  if (requirements.hasSpecialChar) score++;

  return score;
};

/**
 * Get password strength label
 * @param {number} score - Strength score
 * @returns {string} - Strength label
 */
export const getPasswordStrengthLabel = (score) => {
  if (score <= 1) return "Very Weak";
  if (score <= 2) return "Weak";
  if (score <= 3) return "Fair";
  if (score <= 4) return "Good";
  return "Strong";
};

/**
 * Format phone number for display
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";

  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
};
