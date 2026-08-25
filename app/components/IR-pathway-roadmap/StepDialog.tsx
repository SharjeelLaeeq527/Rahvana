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
import { SafeHtml } from "../shared/SafeHTML";

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
      <DialogContent className="animate-scale-in max-h-[90vh] max-w-4xl">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                    isCompleted
                      ? "from-accent to-accent/80 text-accent-foreground bg-gradient-to-br"
                      : "bg-primary/20 text-primary dark:bg-primary/30"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : step.id}
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl md:text-3xl">{step.title}</DialogTitle>
                  <DialogDescription className="mt-1 text-base">{step.subtitle}</DialogDescription>
                </div>
              </div>
            </div>

            {isCompleted && (
              <div className="bg-accent/10 text-accent flex items-center gap-2 rounded-full px-3 py-1.5 whitespace-nowrap">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-semibold">Completed</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <div className="bg-secondary flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm">
              <span className="font-semibold">{step.who}</span>
            </div>
            <div className="bg-muted flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">{step.timeline}</span>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-300px)] pr-4">
          <SafeHtml
            className="prose prose-lg dark:prose-invert text-foreground max-w-none space-y-4"
            html={step.content}
          />
        </ScrollArea>

        <div className="border-border flex justify-between gap-3 border-t pt-6">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Close
            </Button>

            {isCompleted && (
              <Button
                variant="outline"
                onClick={handleUndo}
                className="gap-2 border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-900 dark:text-amber-500 dark:hover:bg-amber-950/20 dark:hover:text-amber-400"
              >
                <RotateCcw className="h-4 w-4" />
                Undo
              </Button>
            )}
          </div>

          <Button
            onClick={onComplete}
            disabled={isCompleted}
            className={`gap-2 transition-all duration-300 ${
              isCompleted ? "cursor-not-allowed opacity-50" : "hover:shadow-lg"
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Mark as Complete
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
