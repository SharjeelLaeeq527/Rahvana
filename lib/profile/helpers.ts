import { MasterProfile } from "@/types/profile";

/**
 * Profile helper utilities
 * Provides functions for profile completeness calculation and data formatting
 */

/**
 * Calculate profile completeness percentage
 */
export function getProfileCompleteness(profile: Partial<MasterProfile>): number {
  const fields = [
    // Core required fields (weight: 2 each)
    { value: profile.name?.first, weight: 2 },
    { value: profile.name?.last, weight: 2 },
    { value: profile.dateOfBirth, weight: 2 },
    { value: profile.phone, weight: 2 },
    { value: profile.email, weight: 2 },
    { value: profile.currentAddress?.street, weight: 2 },
    { value: profile.currentAddress?.city, weight: 2 },
    { value: profile.currentAddress?.country, weight: 2 },

    // Important fields (weight: 1 each)
    { value: profile.name?.middle, weight: 1 },
    { value: profile.placeOfBirth?.city, weight: 1 },
    { value: profile.placeOfBirth?.country, weight: 1 },
    { value: profile.sex, weight: 1 },
    { value: profile.maritalStatus, weight: 1 },
    { value: profile.occupation, weight: 1 },
    { value: profile.annualIncome, weight: 1 },
    { value: profile.educationLevel, weight: 1 },
    { value: profile.passportNumber, weight: 1 },
    { value: profile.cnic, weight: 1 },
    { value: profile.employer?.name, weight: 1 },
    { value: profile.currentAddress?.state, weight: 1 },
    { value: profile.currentAddress?.zipCode, weight: 1 },
  ];

  const totalWeight = fields.reduce((sum, field) => sum + field.weight, 0);
  const filledWeight = fields.reduce((sum, field) => {
    return sum + (field.value ? field.weight : 0);
  }, 0);

  return Math.round((filledWeight / totalWeight) * 100);
}

/**
 * Get list of missing required fields
 */
export function getMissingRequiredFields(profile: Partial<MasterProfile>): string[] {
  const missing: string[] = [];

  if (!profile.name?.first) missing.push("First Name");
  if (!profile.name?.last) missing.push("Last Name");
  if (!profile.dateOfBirth) missing.push("Date of Birth");
  if (!profile.phone) missing.push("Phone Number");
  if (!profile.email) missing.push("Email");
  if (!profile.currentAddress?.street) missing.push("Street Address");
  if (!profile.currentAddress?.city) missing.push("City");
  if (!profile.currentAddress?.country) missing.push("Country");

  return missing;
}

/**
 * Format profile data for display
 */
export function formatProfileForDisplay(profile: Partial<MasterProfile>): Record<string, string> {
  return {
    fullName:
      `${profile.name?.first || ""} ${profile.name?.middle || ""} ${profile.name?.last || ""}`.trim(),
    dateOfBirth: profile.dateOfBirth ? formatDate(profile.dateOfBirth) : "",
    placeOfBirth: profile.placeOfBirth
      ? `${profile.placeOfBirth.city}, ${profile.placeOfBirth.country}`
      : "",
    address: formatAddress(profile.currentAddress),
    phone: formatPhoneNumber(profile.phone || ""),
    income: profile.annualIncome ? `$${Number(profile.annualIncome).toLocaleString()}` : "",
  };
}

/**
 * Format date to readable format (MM/DD/YYYY)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Format address object to string
 */
function formatAddress(address?: Partial<MasterProfile["currentAddress"]>): string {
  if (!address) return "";

  const parts = [
    address.street,
    address.city,
    address.state,
    address.zipCode,
    address.country,
  ].filter(Boolean);

  return parts.join(", ");
}

/**
 * Format phone number for display
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Format as (XXX) XXX-XXXX for 10 digit numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}

/**
 * Sanitize profile data before saving
 * Removes empty strings and null values
 */
export function sanitizeProfileData(profile: Partial<MasterProfile>): Partial<MasterProfile> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(profile)) {
    if (value === null || value === "" || value === undefined) {
      continue;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      const sanitizedObj = sanitizeProfileData(value as Partial<MasterProfile>);
      if (Object.keys(sanitizedObj).length > 0) {
        sanitized[key] = sanitizedObj;
      }
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        sanitized[key] = value;
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as Partial<MasterProfile>;
}

/**
 * Convert date from MM/DD/YYYY to YYYY-MM-DD
 */
export function convertToISODate(dateString: string): string {
  // Check if already in ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Try to parse and convert
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toISOString().split("T")[0];
}
