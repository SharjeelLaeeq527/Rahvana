import { cn } from "@/lib/utils";

interface LoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  subText?: string;
  fullScreen?: boolean;
  className?: string;
}

function Loader({ 
  size = "md", 
  text, 
  subText, 
  fullScreen = false,
  className 
}: LoaderProps) {
  const sizes = {
    sm: { outer: "w-6 h-6", inner: "w-3 h-3", border: "border-2" },
    md: { outer: "w-12 h-12", inner: "w-6 h-6", border: "border-4" },
    lg: { outer: "w-16 h-16", inner: "w-8 h-8", border: "border-4" },
    xl: { outer: "w-20 h-20", inner: "w-10 h-10", border: "border-4" },
  };

  const { outer, inner, border } = sizes[size];

  const content = (
    <div className={cn("flex flex-col items-center justify-center", (text || subText) ? "gap-4" : "gap-0", className)}>
      <div className="relative">
        <div className={cn(
          outer, 
          border, 
          "border-primary/20 border-t-primary rounded-full animate-spin"
        )} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            inner, 
            border, 
            "border-primary/10 border-b-primary rounded-full animate-spin-reverse"
          )} />
        </div>
      </div>
      
      {(text || subText) && (
        <div className="flex flex-col items-center gap-2">
          {text && (
            <h2 className={cn(
              "font-bold text-foreground",
              size === "sm" ? "text-sm" : size === "md" ? "text-lg" : "text-2xl"
            )}>
              {text}
            </h2>
          )}
          {subText && (
            <p className={cn(
              "text-muted-foreground animate-pulse",
              size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-lg"
            )}>
              {subText}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/60 backdrop-blur-md transition-all duration-300">
        {content}
      </div>
    );
  }

  return content;
}

export { Loader };
