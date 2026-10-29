"use client";

import React, { Suspense } from "react";
import BookConsultationTool from "@/components/tools/BookConsultationTool";

export default function ConsultationBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
            <p className="font-medium text-gray-500">Loading Booking System...</p>
          </div>
        </div>
      }
    >
      <BookConsultationTool />
    </Suspense>
  );
}
