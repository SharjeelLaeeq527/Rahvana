import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Step } from "@/lib/steps";

interface Props {
  step: Step;
  isCompleted: boolean;
  onClick: () => void;
}

export default function IslandCard({ step, isCompleted, onClick }: Props) {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 group relative overflow-hidden ${
        isCompleted
          ? "border-accent bg-gradient-to-br from-accent/5 to-accent/10 dark:from-accent/10 dark:to-accent/20"
          : "border-border hover:border-primary/50"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all duration-300" />

      <CardContent className="p-6 text-center relative z-10">
        {/* Icon/Number Circle */}
        <div
          className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold shadow-md transition-all duration-300 ${
            isCompleted
              ? "bg-gradient-to-br from-accent to-accent/80 text-accent-foreground"
              : "bg-gradient-to-br from-primary/20 to-primary/10 text-primary dark:from-primary/30 dark:to-primary/20"
          }`}
        >
          {isCompleted ? <CheckCircle2 className="w-10 h-10" /> : <span>{step.id}</span>}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
          {step.title}
        </h3>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground mb-4">{step.subtitle}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          <Badge variant="secondary" className="text-xs">
            {step.who}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {step.timeline}
          </Badge>
        </div>

        <div className="flex items-center justify-center gap-1 text-primary group-hover:translate-x-1 transition-transform">
          <span className="text-xs font-semibold">View Details</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </CardContent>
    </Card>
  );
}
