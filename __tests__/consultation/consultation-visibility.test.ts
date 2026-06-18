import { shouldShowConsultationForAdmin } from "@/lib/services/consultationVisibility";

describe("consultation admin visibility", () => {
  it("hides bookings that are still awaiting payment", () => {
    expect(shouldShowConsultationForAdmin({ payment_status: "pending" })).toBe(false);
  });

  it("shows paid consultation bookings in the admin list", () => {
    expect(shouldShowConsultationForAdmin({ payment_status: "paid" })).toBe(true);
  });

  it("shows executive-credit bookings as admin-visible", () => {
    expect(shouldShowConsultationForAdmin({ payment_status: "free" })).toBe(true);
  });

  it("does not show records with no payment status", () => {
    expect(shouldShowConsultationForAdmin({ payment_status: null })).toBe(false);
  });
});
