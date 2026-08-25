export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,72}$/;

export const PASSWORD_REQUIREMENTS = [
  "At least 8 characters long",
  "Includes an uppercase letter",
  "Includes a lowercase letter",
  "Includes a number",
  "Includes a symbol",
];

export function validateStrongPassword(password: string) {
  return STRONG_PASSWORD_REGEX.test(password);
}
