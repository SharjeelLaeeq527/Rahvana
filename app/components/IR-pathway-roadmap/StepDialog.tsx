import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, ChevronLeft, Clock, RotateCcw } from "lucide-react";
import { Step } from "@/lib/steps";
import { useStore } from "@/lib/store";

interface Props {
  step?: Step;
  isCompleted: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export default function StepDialog({ step, isCompleted, open, onOpenChange, onComplete }: Props) {
  const { uncompleteStep } = useStore(); // MUST come before return

  if (!step) return null;

  const handleUndo = () => {
    uncompleteStep(step.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] animate-scale-in">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    isCompleted
                      ? "bg-gradient-to-br from-accent to-accent/80 text-accent-foreground"
                      : "bg-primary/20 text-primary dark:bg-primary/30"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : step.id}
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl md:text-3xl">{step.title}</DialogTitle>
                  <DialogDescription className="text-base mt-1">{step.subtitle}</DialogDescription>
                </div>
              </div>
            </div>

            {isCompleted && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-full whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-semibold">Completed</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-sm">
              <span className="font-semibold">{step.who}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-sm">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">{step.timeline}</span>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-300px)] pr-4">
          <div
            className="prose prose-lg dark:prose-invert max-w-none space-y-4 text-foreground"
            dangerouslySetInnerHTML={{ __html: step.content }}
          />
        </ScrollArea>

        <div className="flex justify-between gap-3 pt-6 border-t border-border">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Close
            </Button>

            {isCompleted && (
              <Button
                variant="outline"
                onClick={handleUndo}
                className="gap-2 text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 border-amber-200 hover:bg-amber-50 dark:border-amber-900 dark:hover:bg-amber-950/20"
              >
                <RotateCcw className="w-4 h-4" />
                Undo
              </Button>
            )}
          </div>

          <Button
            onClick={onComplete}
            disabled={isCompleted}
            className={`gap-2 transition-all duration-300 ${
              isCompleted ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg"
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Completed
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Mark as Complete
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
