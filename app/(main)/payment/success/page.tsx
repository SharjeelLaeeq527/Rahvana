'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Loader } from "@/components/ui/spinner";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      router.push('/pricing');
      return;
    }

    // Simulate verification (in production, you might want to verify with your backend)
    const timer = setTimeout(() => {
      setIsVerifying(false);
      // In a real app, you would set payment details here after verifying with backend
      // setPaymentDetails({
      //   sessionId,
      //   // You can fetch actual payment details from your API if needed
      // });
    }, 2000);

    return () => clearTimeout(timer);
  }, [sessionId, router]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-teal-50 to-cyan-50">
        <Loader size="md" text="Verifying your payment..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-teal-50 to-cyan-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Payment Successful! 🎉
          </h1>
          <p className="text-slate-600">
            Thank you for your purchase. Your payment has been processed successfully.
          </p>
        </div>

        <div className="bg-teal-50 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-teal-900 mb-3">What&apos;s Next?</h2>
          <ul className="text-left space-y-2 text-sm text-teal-800">
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold mt-0.5">✓</span>
              <span>You&apos;ll receive a confirmation email shortly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold mt-0.5">✓</span>
              <span>Your account has been upgraded with new features</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold mt-0.5">✓</span>
              <span>Access your dashboard to explore premium features</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full px-6 py-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="block w-full px-6 py-3 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:border-teal-600 hover:text-teal-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {sessionId && (
          <p className="text-xs text-slate-400 mt-6">
            Session ID: {sessionId.slice(0, 20)}...
          </p>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-teal-50 to-cyan-50">
          <Loader size="md" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}