"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, CheckCircle2 } from 'lucide-react';

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: number;
}

export default function CompletionDialog({
  open,
  onOpenChange,
  progress,
}: CompletionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center animate-scale-in">
        <DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full" />
                <Trophy className="w-20 h-20 text-accent relative mx-auto animate-bounce" />
              </div>
            </div>

            <div className="space-y-3">
              <DialogTitle className="text-3xl font-bold">
                Congratulations!
              </DialogTitle>
              <p className="text-muted-foreground text-base">
                You&apos;ve completed all steps of the Pakistan to USA spousal immigration journey!
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Journey Completion</span>
                <span className="text-lg font-bold text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Achievement badges */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground mb-3">Your Achievements:</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: "📋", label: "I-130 Filed" },
                  { icon: "✈️", label: "Visa Received" },
                  { icon: "🎫", label: "Ready to Travel" },
                ].map((achievement, i) => (
                  <div
                    key={i}
                    className="bg-secondary/50 rounded-lg p-2 text-center space-y-1 animate-slide-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="text-2xl">{achievement.icon}</div>
                    <p className="text-xs font-semibold text-foreground">{achievement.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Call to action */}
            <div className="bg-accent/10 border border-accent rounded-lg p-3 space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                Next: Plan Your Travel
              </p>
              <p className="text-xs text-muted-foreground">
                Start preparing your move to the United States
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Close
          </Button>
          <Button onClick={() => onOpenChange(false)} className="flex-1">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
