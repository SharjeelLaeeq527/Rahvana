import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Baby, Users, HeartHandshake, CheckCircle } from "lucide-react";

interface ScenarioOption {
  id: string;
  title: string;
  desc: string;
  bg?: string;
  hover?: string;
  icon?: React.ElementType;
}

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

  // Icon mapping for known IR-2 scenarios if not provided in data
  const getIcon = (opt: ScenarioOption) => {
    if (opt.icon) return opt.icon;
    switch (opt.id) {
      case "bio": return Baby;
      case "step": return Users;
      case "adopted": return HeartHandshake;
      default: return CheckCircle;
    }
  };

  const getBg = (opt: ScenarioOption) => {
    if (opt.bg) return opt.bg;
    switch (opt.id) {
      case "bio": return "bg-[#e8f6f6]";
      case "step": return "bg-[#fef3c7]";
      case "adopted": return "bg-[#eef2ff]";
      default: return "bg-slate-50";
    }
  };

  const getHover = (opt: ScenarioOption) => {
    if (opt.hover) return opt.hover;
    switch (opt.id) {
      case "bio": return "hover:bg-[#d5f0f1]";
      case "step": return "hover:bg-[#fde68a]";
      case "adopted": return "hover:bg-[#e0e7ff]";
      default: return "hover:bg-slate-100";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-xl overflow-hidden">
        {/* Header */}

        <div className="px-6 pt-6 pb-4 border-b border-border">
          <h3 className="text-lg font-semibold">{title}</h3>

          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        </div>

        {/* Body */}

        <div className="px-6 py-6 space-y-4">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            const Icon = getIcon(opt);
            const bgColor = getBg(opt);
            const hoverColor = getHover(opt);

            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={`
        group w-full text-left p-4 rounded-xl border transition-all duration-200
        flex gap-3 items-start

        ${bgColor}

        ${
          isSelected ? "border-primary ring-2 ring-primary/30" : "border-border"
        }

        ${hoverColor}
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