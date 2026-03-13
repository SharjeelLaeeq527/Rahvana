import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Baby, Users, HeartHandshake, CheckCircle } from "lucide-react";

type ScenarioType = "bio" | "step" | "adopted";

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: ScenarioType) => void;
  currentType?: ScenarioType | null;
}

export default function ScenarioSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  currentType,
}: ScenarioModalProps) {
  const [selected, setSelected] = useState<ScenarioType | null>(null);

  useEffect(() => {
    setSelected(currentType ?? null);
  }, [currentType]);

  if (!isOpen) return null;

  const options = [
    {
      id: "bio",
      title: "Biological Child",
      desc: "You are petitioning your biological child. Birth certificate documentation will be required.",
      bg: "bg-[#e8f6f6]",
      hover: "hover:bg-[#d5f0f1]",
      icon: Baby,
    },
    {
      id: "step",
      title: "Stepchild",
      desc: "Marriage between the petitioner and biological parent must occur before the child turns 18.",
      bg: "bg-[#fef3c7]",
      hover: "hover:bg-[#fde68a]",
      icon: Users,
    },
    {
      id: "adopted",
      title: "Adopted Child",
      desc: "Adoption must be finalized before age 16 and child must be in legal custody for 2 years.",
      bg: "bg-[#eef2ff]",
      hover: "hover:bg-[#e0e7ff]",
      icon: HeartHandshake,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-xl overflow-hidden">
        {/* Header */}

        <div className="px-6 pt-6 pb-4 border-b border-border">
          <h3 className="text-lg font-semibold">Select Relationship Type</h3>

          <p className="text-sm text-muted-foreground mt-1">
            Choose the relationship type that applies to your case.
          </p>
        </div>

        {/* Body */}

        <div className="px-6 py-6 space-y-4">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            const Icon = opt.icon;

            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id as ScenarioType)}
                className={`
        group w-full text-left p-4 rounded-xl border transition-all duration-200
        flex gap-3 items-start

        ${opt.bg}

        ${
          isSelected ? "border-primary ring-2 ring-primary/30" : "border-border"
        }

        ${opt.hover}
      `}
              >
                <div className="mt-1 flex items-center justify-center">
                  {isSelected ? (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  ) : (
                    <Icon className="w-5 h-5 text-slate-600" />
                  )}
                </div>

                <div>
                  <p className="font-medium">{opt.title}</p>

                  <p className="text-sm opacity-80 mt-1">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-3">
          {/* <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cancel
          </Button> */}

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
