const keys = [
  { color: "#0a5a5d", delay: "0s" },
  { color: "#0d7377", delay: "0.15s" },
  { color: "#14a0a6", delay: "0.3s" },
  { color: "#32e0c4", delay: "0.45s" },
  { color: "#14a0a6", delay: "0.6s" },
];

function Loader ({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = { sm: { w: 8, h: 32, gap: 4 }, md: { w: 12, h: 48, gap: 6 }, lg: { w: 16, h: 64, gap: 8 } };
  const d = dims[size];

  return (
    <div className="flex items-center justify-center" style={{ gap: d.gap }}>
      <style>{`
        @keyframes pianoWave {
          0%, 100% { transform: scaleY(0.35); opacity: 0.45; border-radius: 6px; }
          25% { transform: scaleY(0.7); opacity: 0.75; }
          50% { transform: scaleY(1); opacity: 1; }
          75% { transform: scaleY(0.7); opacity: 0.75; }
        }
      `}</style>
      {keys.map((key, i) => (
        <div
          key={i}
          style={{
            width: d.w,
            height: d.h,
            backgroundColor: key.color,
            borderRadius: d.w / 2.5,
            animation: `pianoWave 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) ${key.delay} infinite`,
            transformOrigin: "center",
          }}
        />
      ))}
    </div>
  );
};

export { Loader };
