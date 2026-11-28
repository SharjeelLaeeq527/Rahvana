import { isDarkReadyRoute, DARK_READY_PREFIXES } from "@/lib/theme/darkReadyRoutes";

describe("isDarkReadyRoute", () => {
  const ready = ["/login", "/settings", "/"];

  it("matches a prefix and the routes under it", () => {
    expect(isDarkReadyRoute("/login", ready)).toBe(true);
    expect(isDarkReadyRoute("/login/reset", ready)).toBe(true);
    expect(isDarkReadyRoute("/settings/billing", ready)).toBe(true);
  });

  it("does not match a route that only starts with the same letters", () => {
    expect(isDarkReadyRoute("/login-help", ready)).toBe(false);
    expect(isDarkReadyRoute("/settingsx", ready)).toBe(false);
  });

  it("treats '/' as the home page only", () => {
    expect(isDarkReadyRoute("/", ready)).toBe(true);
    expect(isDarkReadyRoute("/pricing", ready)).toBe(false);
  });

  it("keeps never-dark routes light even if listed", () => {
    expect(isDarkReadyRoute("/admin", ["/admin"])).toBe(false);
    expect(isDarkReadyRoute("/admin/users", ["/"])).toBe(false);
  });

  it("is false for an empty path", () => {
    expect(isDarkReadyRoute(null, ready)).toBe(false);
    expect(isDarkReadyRoute("", ready)).toBe(false);
  });

  it("starts with Phase 3 dark-ready routes enabled", () => {
    expect(DARK_READY_PREFIXES).toEqual([
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
      "/mfa-setup",
      "/complete-profile",
      "/settings",
      "/profile",
    ]);
    expect(isDarkReadyRoute("/login")).toBe(true);
    expect(isDarkReadyRoute("/signup")).toBe(true);
    expect(isDarkReadyRoute("/settings")).toBe(true);
    expect(isDarkReadyRoute("/profile")).toBe(true);
    expect(isDarkReadyRoute("/user-dashboard")).toBe(false);
  });
});
