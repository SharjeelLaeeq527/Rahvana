'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Loader } from "@/components/ui/spinner";

// ── Confetti Particle Component ─────────────────────────────────────────────
function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ['#14b8a6', '#0d9488', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#10b981'];
    const SHAPES = ['rect', 'circle', 'triangle'];

    interface Particle {
      x: number; y: number; w: number; h: number;
      color: string; shape: string;
      rotation: number; rotationSpeed: number;
      vx: number; vy: number; opacity: number;
    }

    const particles: Particle[] = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 10,
      h: 4 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      opacity: 0.85 + Math.random() * 0.15,
    }));

    let animId: number;
    let frame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Fade out near bottom
        if (p.y > canvas.height * 0.7) {
          p.opacity = Math.max(0, p.opacity - 0.012);
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();

        if (p.shape === 'rect') {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else if (p.shape === 'circle') {
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.moveTo(0, -p.h);
          ctx.lineTo(p.w / 2, p.h / 2);
          ctx.lineTo(-p.w / 2, p.h / 2);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();

        // Reset when off screen
        if (p.y > canvas.height + 20 || p.opacity <= 0) {
          if (frame < 180) {
            p.x = Math.random() * canvas.width;
            p.y = -20;
            p.opacity = 0.85 + Math.random() * 0.15;
          }
        }
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// ── Success Icon with Pulse Ring ─────────────────────────────────────────────
function AnimatedSuccessIcon() {
  return (
    <div className="relative flex items-center justify-center mx-auto mb-6" style={{ width: 96, height: 96 }}>
      {/* Pulse rings */}
      <div className="absolute inset-0 rounded-full bg-teal-400/20 animate-ping" />
      <div className="absolute inset-2 rounded-full bg-teal-300/20 animate-ping" style={{ animationDelay: '0.2s' }} />
      {/* Icon circle */}
      <div className="relative w-20 h-20 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
        <CheckCircle className="w-11 h-11 text-white" strokeWidth={2.5} />
      </div>
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
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-teal-50 to-cyan-50">
        <Loader size="md" text="Verifying your payment..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-teal-50 via-white to-cyan-50 px-4 py-12 relative">
      <ConfettiCanvas />

      <div className="relative z-10 max-w-md w-full">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl shadow-teal-200/50 p-8 text-center border border-teal-100">
          <AnimatedSuccessIcon />

          <h1 className="text-[26px] font-extrabold text-slate-900 mb-2 tracking-tight">
            Payment Successful!
          </h1>
          <p className="text-slate-500 text-[15px] leading-relaxed mb-7">
            Thank you for your purchase. Your payment has been<br className="hidden sm:block" /> processed successfully.
          </p>

          {/* What's Next */}
          <div className="bg-linear-to-br from-teal-50 to-cyan-50 rounded-2xl p-5 mb-6 text-left border border-teal-100">
            <h2 className="font-bold text-teal-900 mb-3 text-[14px] tracking-widest uppercase">
              What&apos;s Next?
            </h2>
            <ul className="space-y-2.5">
              {[
                "You'll receive a confirmation email shortly",
                "Your account has been upgraded with new features",
                "Access your dashboard to explore premium features",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14px] text-teal-800">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center mt-0.5">
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                      <path d="M2 6l2.5 2.5L10 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

        <div className="space-y-3">
          <Link
            href="/user-dashboard"
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

          {/* Session ID */}
          {sessionId && (
            <p className="text-[11px] text-slate-300 mt-6 font-mono">
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
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-teal-50 to-cyan-50">
          <Loader size="md" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}