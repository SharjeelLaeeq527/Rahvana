"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RoadmapView from "./RoadmapView";

interface RoadmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
}

export default function RoadmapModal({ open, onOpenChange, title }: RoadmapModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-3/4 max-h-[90vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative h-[90vh] overflow-hidden rounded-lg">
          {/* Custom Close Button to ensure visibility over sticky header */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 z-[60] p-2 bg-white/50 hover:bg-primary/30 backdrop-blur-sm rounded-full border border-slate-200 shadow-sm transition-all"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-600"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <RoadmapView showTitle={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
