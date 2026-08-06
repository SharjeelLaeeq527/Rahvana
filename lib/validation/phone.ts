import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from "libphonenumber-js";
import type { Value as E164Number } from "react-phone-number-input";

/**
 * Validates a phone number using libphonenumber-js
 * @param phoneNumber - The full phone number in E.164 format (e.g., "+923001234567") or E164Number type
 * @returns boolean - true if valid, false otherwise
 */
export function validatePhoneNumber(phoneNumber: string | E164Number | undefined): boolean {
  if (!phoneNumber || phoneNumber.trim() === "") {
    return false;
  }

  try {
    return isValidPhoneNumber(phoneNumber);
  } catch (error) {
    return false;
  }
}

/**
 * Validates a phone number with a specific country
 * @param phoneNumber - The phone number (with or without country code)
 * @param country - The country code (e.g., "PK", "US")
 * @returns boolean - true if valid, false otherwise
 */
export function validatePhoneNumberWithCountry(
  phoneNumber: string | E164Number | undefined,
  country: CountryCode
): boolean {
  if (!phoneNumber || phoneNumber.trim() === "") {
    return false;
  }

  try {
    return isValidPhoneNumber(phoneNumber, country);
  } catch (error) {
    return false;
  }
}

/**
 * Formats a phone number to international format
 * @param phoneNumber - The phone number to format
 * @returns string - The formatted phone number or original if invalid
 */
export function formatPhoneNumber(phoneNumber: string | E164Number | undefined): string {
  if (!phoneNumber) {
    return "";
  }

  try {
    const parsed = parsePhoneNumber(phoneNumber);
    if (parsed) {
      return parsed.formatInternational();
    }
    return phoneNumber;
  } catch (error) {
    return phoneNumber;
  }
}

/**
 * Extracts country code from a phone number
 * @param phoneNumber - The phone number in E.164 format
 * @returns string - The country code (e.g., "PK") or empty string if invalid
 */
export function getCountryFromPhoneNumber(phoneNumber: string | E164Number | undefined): string {
  if (!phoneNumber) {
    return "";
  }

  try {
    const parsed = parsePhoneNumber(phoneNumber);
    if (parsed) {
      return parsed.country || "";
    }
    return "";
  } catch (error) {
    return "";
  }
}

/**
 * Gets the national (local) number without country code
 * @param phoneNumber - The phone number in E.164 format
 * @returns string - The national number or original if invalid
 */
export function getNationalNumber(phoneNumber: string | E164Number | undefined): string {
  if (!phoneNumber) {
    return "";
  }

  try {
    const parsed = parsePhoneNumber(phoneNumber);
    if (parsed) {
      return parsed.nationalNumber;
    }
    return phoneNumber;
  } catch (error) {
    return phoneNumber;
  }
}

/**
 * Validates phone number and returns an error message if invalid
 * @param phoneNumber - The phone number to validate
 * @returns string | null - Error message or null if valid
 */
export function getPhoneValidationError(phoneNumber: string | E164Number | undefined): string | null {
  if (!phoneNumber || phoneNumber.trim() === "") {
    return "Phone number is required";
  }

  if (!validatePhoneNumber(phoneNumber)) {
    return "Please enter a valid phone number";
  }

  return null;
}
