import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { ScenarioOption } from "./types";

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: string) => void;
  currentType?: string | null;
  options: ScenarioOption[];
  title?: string;
  description?: string;
}

export default function ScenarioSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  currentType,
  options,
  title = "Select Option",
  description = "Choose the option that applies to your case.",
}: ScenarioModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setSelected(currentType ?? null);
  }, [currentType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          {options.map((opt) => {
            const isSelected = selected === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={`
                w-full text-left p-4 rounded-xl border transition
                flex gap-3 items-start
                ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                }
                `}
              >
                <div className="mt-1">
                  {isSelected ? (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-muted-foreground" />
                  )}
                </div>

                <div>
                  <p className="font-medium text-foreground">{opt.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-3">
          <Button
            disabled={!selected}
            onClick={() => {
              if (selected) {
                onConfirm(selected);
                onClose();
              }
            }}
            className="rounded-xl"
          >
            Confirm Selection
          </Button>
        </div>
      </div>
    </div>
  );
}
