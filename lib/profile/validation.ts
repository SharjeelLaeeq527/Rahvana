import { MasterProfile } from "@/types/profile";

/**
 * Profile validation helpers
 * Validates MasterProfile data and provides user-friendly error messages
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates the MasterProfile structure
 */
export function validateProfile(profile: Partial<MasterProfile>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!profile.name?.first || !profile.name?.last) {
    errors.push("First and last name are required");
  }

  if (!profile.dateOfBirth) {
    errors.push("Date of birth is required");
  } else {
    // Validate date is in the past
    const dob = new Date(profile.dateOfBirth);
    if (dob >= new Date()) {
      errors.push("Date of birth must be in the past");
    }
  }

  if (!profile.phone) {
    errors.push("Phone number is required");
  }

  if (!profile.email) {
    errors.push("Email is required");
  } else if (!isValidEmail(profile.email)) {
    errors.push("Email format is invalid");
  }

  if (
    !profile.currentAddress?.street ||
    !profile.currentAddress?.city ||
    !profile.currentAddress?.country
  ) {
    errors.push("Current address (street, city, country) is required");
  }

  // Optional fields with warnings
  if (!profile.occupation) {
    warnings.push("Occupation is recommended for visa applications");
  }

  if (!profile.passportNumber) {
    warnings.push("Passport information is recommended");
  } else if (profile.passportExpiry) {
    const expiry = new Date(profile.passportExpiry);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    if (expiry < sixMonthsFromNow) {
      warnings.push("Passport expires within 6 months - renewal may be needed");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Basic email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates US phone number format
 */
export function isValidUSPhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  // US phone numbers should be 10 digits
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Validates SSN format (XXX-XX-XXXX)
 */
export function isValidSSN(ssn: string): boolean {
  const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
  return ssnRegex.test(ssn);
}

/**
 * Validates passport number (basic check - alphanumeric, 6-9 characters)
 */
export function isValidPassportNumber(passportNumber: string): boolean {
  const passportRegex = /^[A-Z0-9]{6,9}$/i;
  return passportRegex.test(passportNumber);
}
