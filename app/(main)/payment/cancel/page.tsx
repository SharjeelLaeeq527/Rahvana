"use client";

import { XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Canceled</h1>
          <p className="text-slate-600">
            Your payment was canceled. No charges have been made to your account.
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-3">Need Help?</h2>
          <p className="text-sm text-slate-600 mb-4">
            If you encountered any issues during checkout or have questions about our pricing,
            we&apos;re here to help.
          </p>
          <Link
            href="mailto:support@rahvana.com"
            className="text-teal-600 hover:text-teal-700 font-medium text-sm"
          >
            Contact Support →
          </Link>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="block w-full px-6 py-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/pricing"
            className="block w-full px-6 py-3 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:border-teal-600 hover:text-teal-600 transition-colors"
          >
            View Pricing
          </Link>
          <Link
            href="/"
            className="block w-full px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
