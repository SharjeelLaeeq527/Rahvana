import { validateStrongPassword } from "@/lib/security/password";

describe("validateStrongPassword", () => {
  it("accepts a strong password", () => {
    expect(validateStrongPassword("GoodPass1!")).toBe(true);
  });

  it("rejects short, missing-case, missing-digit, and missing-symbol passwords", () => {
    expect(validateStrongPassword("Short1!")).toBe(false);
    expect(validateStrongPassword("alllower1!")).toBe(false);
    expect(validateStrongPassword("ALLUPPER1!")).toBe(false);
    expect(validateStrongPassword("NoDigits!!")).toBe(false);
    expect(validateStrongPassword("NoSymbol12")).toBe(false);
  });
});
