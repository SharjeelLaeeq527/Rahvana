import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'motion/react';

const InteractiveClockWidget = () => {
  const clockRef = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState(60); // Default to a nice angle
  const [isHovered, setIsHovered] = useState(false);
  
  const springAngle = useSpring(60, { stiffness: 30, damping: 15, mass: 1 });
  
  useEffect(() => {
    springAngle.set(angle);
  }, [angle, springAngle]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let deg = (rad * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    
    // Snap to 5-minute intervals for premium feel
    const snap = 30; // 30 degrees = 1 hour
    const fineSnap = 6; // 6 degrees = 12 minutes (approx 5 min interval snap)
    deg = Math.round(deg / fineSnap) * fineSnap;
    
    setAngle(deg);
  };

  const totalMinutes = Math.floor((angle / 360) * 12 * 60);
  let h = Math.floor(totalMinutes / 60) || 12;
  let m = totalMinutes % 60;
  m = Math.round(m / 5) * 5;
  if (m === 60) {
    m = 0;
    h = h === 12 ? 1 : h + 1;
  }
  const timeStr = `${h}:${m.toString().padStart(2, '0')}`;

  const CLOCK_RADIUS = 130;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col items-center justify-center gap-8 w-full"
    >
      {/* Ambient Glass Glow behind clock */}
      <motion.div 
        animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] bg-[#0B666A]/20 blur-[40px] rounded-full pointer-events-none" 
      />

      <motion.div
        animate={{ 
          y: isHovered ? -5 : 0,
          boxShadow: isHovered 
            ? "0 32px 64px rgba(11,102,106,0.15), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.05)" 
            : "0 16px 40px rgba(11,102,106,0.1), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.02)"
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        ref={clockRef}
        onPointerMove={handlePointerMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative flex items-center justify-center touch-none cursor-pointer bg-gradient-to-br from-white/70 via-white/30 to-white/10 backdrop-blur-2xl border-t border-l border-white/60 border-b border-r border-white/20 rounded-full group z-10"
        style={{ width: CLOCK_RADIUS * 2, height: CLOCK_RADIUS * 2 }}
      >
        {/* Shimmer sweep effect on hover */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
           <div className="absolute top-0 left-[-100%] w-[50%] h-[200%] bg-gradient-to-r from-transparent via-white/50 to-transparent -rotate-45 group-hover:left-[200%] transition-all duration-1000 ease-in-out" />
        </div>

        {/* Inner depth ring */}
        <div className="absolute inset-4 rounded-full border-[1.5px] border-white/40 shadow-[inset_0_4px_16px_rgba(0,0,0,0.04)] pointer-events-none" />
        <div className="absolute inset-[18px] rounded-full border border-[#0B666A]/5 pointer-events-none" />

        {/* Crisp Dial Markers */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${
              i % 3 === 0 ? 'w-[2px] h-4 bg-gradient-to-b from-[#0B666A] to-[#0A2342] shadow-sm' : 'w-[1.5px] h-2 bg-[#0B666A]/20'
            }`}
            style={{ transform: `rotate(${i * 30}deg) translateY(-${CLOCK_RADIUS * 0.72}px)` }}
          />
        ))}

        {/* Hands Container */}
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
          {/* Subtle fixed minute hand for realism */}
          <div
            className="absolute w-[1.5px] rounded-full bg-[#0B666A]/20 origin-bottom"
            style={{ height: CLOCK_RADIUS * 0.6, bottom: '50%', transform: `rotate(180deg)` }}
          />
          
          {/* Active Hand */}
          <motion.div
            className="absolute origin-bottom filter drop-shadow-[0_4px_8px_rgba(11,102,106,0.3)]"
            style={{ height: CLOCK_RADIUS * 0.55, bottom: '50%', rotate: springAngle }}
          >
            <div className="w-[2.5px] h-full rounded-full bg-gradient-to-t from-[#0B666A] to-[#0F969C]" />
            {/* Hand tip indicator */}
            <div className="absolute -top-1 -left-[3px] w-2 h-2 rounded-full bg-white border-2 border-[#0B666A] shadow-sm" />
          </motion.div>

          {/* Center Pin Stack */}
          <div className="absolute w-4 h-4 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] z-10 flex items-center justify-center border border-gray-100">
             <div className="w-1.5 h-1.5 rounded-full bg-[#0B666A]" />
          </div>
        </div>
      </motion.div>

      {/* Floating Time Display */}
      <motion.div 
        animate={{ y: isHovered ? -2 : 0 }}
        className="bg-white/60 backdrop-blur-xl border border-white/80 px-8 py-3.5 rounded-2xl shadow-[0_8px_24px_rgba(11,102,106,0.06),inset_0_1px_0_rgba(255,255,255,1)] z-10 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
        <span className="text-[28px] font-semibold bg-gradient-to-br from-[#0B666A] to-[#0A2342] bg-clip-text text-transparent tracking-tight font-['Inter',sans-serif]">
          {timeStr} <span className="text-sm font-medium text-[#0B666A]/60 uppercase ml-1.5 tracking-widest">EST</span>
        </span>
      </motion.div>
    </motion.div>
  );
};

export default function App() {
  const [confirmed, setConfirmed] = useState(false);

  const helpWith = [
    "Talk through your exact case",
    "Clarity on the roadmap & timelines",
    "Understand document preparation",
    "Get expert, tailored guidance"
  ];

  const leaveWith = [
    "A clear, defined next step",
    "Better case understanding",
    "Confidence on preparation",
    "Actionable, strategic direction"
  ];

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#F4F7F6] text-[#2C3E3F] font-['Inter',sans-serif] flex flex-col items-center justify-center px-6 lg:px-12 py-16 overflow-x-hidden">
      
      {/* Elevated Dynamic Jewel-Tone Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Teal Orb */}
        <motion.div
          animate={{
            transform: ['translate(0%, 0%) scale(1)', 'translate(5%, 8%) scale(1.1)', 'translate(0%, 0%) scale(1)'],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-[#0B666A]/15 rounded-full blur-[120px]"
        />
        {/* Sapphire/Navy Orb */}
        <motion.div
          animate={{
            transform: ['translate(0%, 0%) scale(1)', 'translate(-8%, -5%) scale(1.15)', 'translate(0%, 0%) scale(1)'],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[20%] -right-[10%] w-[45vw] h-[45vw] bg-[#0A2342]/10 rounded-full blur-[130px]"
        />
        {/* Emerald Glow */}
        <motion.div
          animate={{
            transform: ['translate(0%, 0%) scale(1)', 'translate(10%, -10%) scale(1.05)', 'translate(0%, 0%) scale(1)'],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] bg-[#097969]/10 rounded-full blur-[140px]"
        />
        
        {/* Subtle Noise Texture for high-end feel */}
        <div className="absolute inset-0 opacity-[0.025] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      </div>

      {/* Main Single-Page Layout */}
      <main className="relative z-10 w-full max-w-[1140px] grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-16 lg:gap-24 items-center">

        {/* Left Side: Hero + Cards */}
        <div className="flex flex-col gap-12">

          {/* Hero Copy */}
          <div className="flex flex-col items-start">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/80 mb-8 shadow-[0_4px_12px_rgba(11,102,106,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]"
            >
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-1.5 h-1.5 rounded-full bg-[#0B666A]" 
              />
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#0B666A] font-bold">One-On-One Guidance</span>
            </motion.div>

            <h1 className="max-w-[520px] text-[clamp(42px,4.6vw,68px)] font-black leading-[0.96] tracking-[-0.05em] text-[#12233a] mb-8" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              <div className="overflow-hidden pb-2"><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>You don't have</motion.div></div>
              <div className="overflow-hidden pb-2"><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>to do it <span className="relative inline-block text-[#0B666A]">
                alone.
                <svg className="absolute w-[110%] h-5 -bottom-2 -left-[5%] text-[#0B666A]/80 pointer-events-none drop-shadow-sm" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <motion.path 
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
                    d="M2,15 Q30,22 50,15 T98,10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" 
                  />
                </svg>
              </span></motion.div></div>
            </h1>

            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-[17px] text-[#4A5D5E] leading-relaxed max-w-[460px] font-medium"
            >
              If the roadmap feels like too much or a tool isn't enough, book a consultation for tailored clarity on your immigration case.
            </motion.p>
          </div>

          {/* Gapless Architectural Grid Cards - High Contrast Editorial Design */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col sm:flex-row rounded-[2rem] shadow-[0_32px_64px_rgba(11,102,106,0.12)] relative overflow-hidden ring-1 ring-white/60"
          >
            {/* Card 1 - Bright Frosted Glass */}
            <div className="flex-1 p-8 sm:p-10 bg-white/80 backdrop-blur-2xl flex flex-col relative z-10">
              {/* Subtle abstract geometric accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#0B666A]/5 to-transparent rounded-bl-full pointer-events-none" />
              
              <div className="flex items-center justify-between mb-10 relative">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-[2px] bg-[#0B666A]" />
                  <h3 className="text-[11px] uppercase tracking-[0.25em] text-[#0A2342] font-bold">What we discuss</h3>
                </div>
              </div>
              
              <div className="space-y-0 mt-auto relative">
                {helpWith.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 + (i * 0.1) }}
                    key={i} 
                    className="flex items-center justify-between group/item cursor-default border-b border-[#0B666A]/10 py-4 first:pt-0 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-5">
                      <div className="text-[11px] font-mono font-semibold text-[#0B666A]/30 w-4 group-hover/item:text-[#0B666A] transition-colors">{(i+1).toString().padStart(2, '0')}</div>
                      <span className="text-[15px] text-[#1A2B3C] font-medium group-hover/item:translate-x-1.5 transition-transform duration-300">{item}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Card 2 - Deep Jewel Tone Glass */}
            <div className="flex-1 p-8 sm:p-10 bg-gradient-to-br from-[#0B666A] to-[#0A2342] backdrop-blur-2xl flex flex-col relative z-10 overflow-hidden">
              {/* Architectural grid lines background */}
              <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              
              <div className="flex items-center justify-between mb-10 relative">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-[2px] bg-white/60" />
                  <h3 className="text-[11px] uppercase tracking-[0.25em] text-white font-bold">What you leave with</h3>
                </div>
              </div>
              
              <div className="space-y-0 mt-auto relative">
                {leaveWith.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1 + (i * 0.1) }}
                    key={i} 
                    className="flex items-center justify-between group/item cursor-default border-b border-white/10 py-4 first:pt-0 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0 text-white/20 group-hover/item:text-white group-hover/item:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-500">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[18px] h-[18px] group-hover/item:rotate-90 transition-transform duration-700 ease-[0.16,1,0.3,1]">
                          <path d="M12 4V20M4 12H20" strokeWidth="1.5" className="group-hover/item:opacity-0 transition-opacity duration-300" />
                          <path d="M12 2L22 12L12 22L2 12Z" strokeWidth="1.5" className="opacity-0 group-hover/item:opacity-100 scale-50 group-hover/item:scale-100 transition-all duration-500 ease-out origin-center" />
                          <rect x="10" y="10" width="4" height="4" transform="rotate(45 12 12)" fill="currentColor" className="opacity-0 group-hover/item:opacity-100 scale-0 group-hover/item:scale-100 transition-all duration-500 delay-100 ease-out origin-center stroke-none" />
                        </svg>
                      </div>
                      <span className="text-[15px] text-white/80 font-medium group-hover/item:text-white transition-colors duration-300 group-hover/item:translate-x-1.5">{item}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>

        {/* Right Side: Clock & CTA */}
        <div className="flex flex-col items-center justify-center w-full relative">
          
          {/* subtle connecting line/glow indicating relation between clock and button */}
          <div className="absolute top-[40%] bottom-[20%] w-[1px] bg-gradient-to-b from-transparent via-[#0B666A]/20 to-transparent -z-10" />

          {/* Availability Header */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-col items-center mb-10 gap-4"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-[#0B666A]/20 shadow-[0_2px_12px_rgba(11,102,106,0.1),inset_0_1px_0_rgba(255,255,255,0.8)]">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0B666A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0B666A]"></span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#2C3E3F] font-bold">Live Availability</span>
            </div>
            <p className="text-[13px] text-[#4A5D5E] font-medium text-center max-w-[240px] leading-relaxed">
              Drag the hand to select an available consultation time.
            </p>
          </motion.div>

          <InteractiveClockWidget />

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setConfirmed(true)}
            className="relative overflow-hidden mt-14 w-full max-w-[280px] bg-gradient-to-r from-[#0B666A] to-[#0A4144] text-white py-4.5 px-6 rounded-xl text-[15px] font-semibold transition-all shadow-[0_12px_24px_rgba(11,102,106,0.25)] hover:shadow-[0_20px_40px_rgba(11,102,106,0.35)] flex items-center justify-center gap-2 group border border-white/10"
          >
            {/* Button Shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
            
            <span className="relative z-10 flex items-center gap-2">
              {confirmed ? (
                <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
                  Consultation Booked 
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </motion.span>
              ) : (
                <>
                  Book a Consultation
                  <motion.svg 
                    animate={{ x: [0, 4, 0] }} 
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </motion.svg>
                </>
              )}
            </span>
          </motion.button>
        </div>

      </main>

    </div>
  );
}