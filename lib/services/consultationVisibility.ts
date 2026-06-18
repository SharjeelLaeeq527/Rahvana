export const shouldShowConsultationForAdmin = (booking: {
  payment_status?: string | null;
}): boolean => {
  const normalized = (booking.payment_status || "").toLowerCase();

  return normalized === "paid" || normalized === "free";
};
