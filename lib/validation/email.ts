export function validateEmail(email: string): string | null {
    const value = email.trim();
  
    if (!value) {
      return "Email address is required.";
    }
  
    if (value.length > 254) {
      return "Email address is too long.";
    }
  
    const emailRegex =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address.";
    }
  
    // Prevent consecutive dots
    if (value.includes("..")) {
      return "Email address cannot contain consecutive dots.";
    }
  
    // Prevent dot at beginning/end of local part
    const [localPart, domain] = value.split("@");
  
    if (
      localPart.startsWith(".") ||
      localPart.endsWith(".")
    ) {
      return "Please enter a valid email address.";
    }
  
    // Prevent invalid domain formatting
    if (
      domain.startsWith("-") ||
      domain.endsWith("-") ||
      domain.startsWith(".") ||
      domain.endsWith(".")
    ) {
      return "Please enter a valid email address.";
    }
  
    return null;
  }