'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Loader } from "@/components/ui/spinner";

// ── Animated Credit Card ─────────────────────────────────────────────────────
function AnimatedCard() {
  return (
    <div className="relative mx-auto mb-5" style={{ width: 280, height: 172 }}>
      {/* Card shadow layer */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, var(--rahvana-primary) 0%, var(--rahvana-secondary) 100%)',
          transform: 'rotate(-6deg) translateY(8px)',
          opacity: 0.25,
          borderRadius: 18,
        }}
      />

      {/* Main Card */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--rahvana-primary-dark) 0%, var(--rahvana-primary) 60%, var(--rahvana-primary-light) 100%)',
          borderRadius: 18,
          boxShadow: '0 20px 60px rgba(13,115,119,0.35), 0 4px 16px rgba(0,0,0,0.3)',
          animation: 'cardFloat 3.5s ease-in-out infinite',
        }}
      >
        {/* Holographic shine overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.07) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.07) 55%, transparent 70%)',
            animation: 'shimmer 3s ease-in-out infinite',
            borderRadius: 18,
          }}
        />

        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 110,
            height: 110,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />

        {/* Card Content */}
        <div className="relative h-full flex flex-col justify-between p-6">
          {/* Top row: chip + logo */}
          <div className="flex items-center justify-between">
            {/* EMV Chip */}
            <div
              style={{
                width: 38,
                height: 28,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 50%, #d97706 100%)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: '1fr 1fr 1fr',
                gap: 2,
                padding: 6,
                overflow: 'hidden',
              }}
            >
              {/* Chip lines */}
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: i === 4 ? '#b45309' : 'rgba(180,83,9,0.5)',
                    borderRadius: 1,
                  }}
                />
              ))}
            </div>

            {/* Network logo circles */}
            <div className="flex items-center">
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'var(--rahvana-primary)',
                  marginRight: -10,
                  zIndex: 1,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  border: '2px solid rgba(255,255,255,0.2)'
                }}
              />
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'var(--rahvana-secondary)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  border: '2px solid rgba(255,255,255,0.2)'
                }}
              />
            </div>
          </div>

          {/* Card Number */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 15,
              letterSpacing: '0.18em',
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 600,
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}
          >
            •••• •••• •••• 4242
          </div>

          {/* Bottom row */}
          <div className="flex items-end justify-between">
            <div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 2 }}>
                CARD HOLDER
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600, letterSpacing: '0.04em' }}>
                JOHN DOE
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 2 }}>
                EXPIRES
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                12/28
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success badge on card */}
      <div
        style={{
          position: 'absolute',
          top: -14,
          right: -14,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--rahvana-secondary), var(--rahvana-primary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(50,224,196,0.5)',
          border: '3px solid white',
          zIndex: 10,
          animation: 'badgePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both',
        }}
      >
        <CheckCircle style={{ width: 22, height: 22, color: 'white' }} strokeWidth={2.5} />
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes cardFloat {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes badgePop {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Main Content ─────────────────────────────────────────────────────────────
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
    const timer = setTimeout(() => setIsVerifying(false), 2000);
    return () => clearTimeout(timer);
  }, [sessionId, router]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rahvana-primary-pale to-slate-50">
        <Loader size="md" text="Verifying your payment..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rahvana-primary-pale via-white to-rahvana-primary-pale/30 px-4 py-4 relative">
      <div className="relative z-10 max-w-md w-full">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl shadow-rahvana-primary/10 px-6 pt-6 pb-5 text-center border border-rahvana-primary-pale">
          <AnimatedCard />

          <h1 className="text-[22px] font-extrabold text-slate-900 mb-1 tracking-tight">
            Payment Successful!
          </h1>
          <p className="text-slate-500 text-[13px] leading-relaxed mb-4">
            Thank you for your purchase. Your payment has been processed successfully.
          </p>

          {/* What's Next */}
          <div className="bg-gradient-to-br from-rahvana-primary-pale/50 to-white rounded-2xl px-4 py-3 mb-4 text-left border border-rahvana-primary-pale">
            <h2 className="font-bold text-rahvana-primary-dark mb-2 text-[11px] tracking-widest uppercase">
              What&apos;s Next?
            </h2>
            <ul className="space-y-1.5">
              {[
                "You'll receive a confirmation email shortly",
                "Your account has been upgraded with new features",
                "Access your dashboard to explore premium features",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-[13px] text-rahvana-primary-dark">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-rahvana-primary flex items-center justify-center">
                    <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                      <path d="M2 6l2.5 2.5L10 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <Link
              href="/user-dashboard"
              className="flex-1 px-4 py-2.5 rounded-lg bg-rahvana-primary text-white text-[14px] font-semibold hover:bg-rahvana-primary-dark transition-colors text-center"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-[14px] font-semibold hover:border-rahvana-primary hover:text-rahvana-primary transition-colors text-center"
            >
              Back to Home
            </Link>
          </div>

          {sessionId && (
            <p className="text-[10px] text-slate-300 mt-3 font-mono">
              Session ID: {sessionId.slice(0, 24)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page Export ───────────────────────────────────────────────────────────────
export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rahvana-primary-pale to-slate-50">
          <Loader size="md" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}