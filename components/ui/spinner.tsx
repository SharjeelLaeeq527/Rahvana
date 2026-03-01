import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

function Spinner({ size = "md", className }: SpinnerProps) {
  const sizeMap = { sm: 20, md: 32, lg: 48 };
  const px = sizeMap[size];
  const border = size === "sm" ? 2.5 : size === "md" ? 3 : 4;

  return (
    <div
      className={cn("inline-flex items-center justify-center", className)}
      role="status"
      aria-label="Loading"
    >
      <div
        style={{
          width: px,
          height: px,
          borderRadius: "50%",
          border: `${border}px solid #0d7377`,
          animation: "spinner-wobble 1.8s ease-in-out infinite",
        }}
      >
      </div>
      <style>{`
        @keyframes spinner-wobble {
          0%   { transform: perspective(${px * 4}px) rotateX(0deg)   rotateY(0deg); }
          25%  { transform: perspective(${px * 4}px) rotateX(180deg) rotateY(0deg); }
          50%  { transform: perspective(${px * 4}px) rotateX(180deg) rotateY(180deg); }
          75%  { transform: perspective(${px * 4}px) rotateX(0deg)   rotateY(180deg); }
          100% { transform: perspective(${px * 4}px) rotateX(0deg)   rotateY(0deg); }
      `}</style>
    </div>
  );
}

export { Spinner };
