"use client";
import { useState, useRef, useEffect } from "react";
import { Eye, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionMenuProps {
  onView: () => void;
  onDelete: () => void;
}

export default function ActionMenu({ onView, onDelete }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // close menu when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <Button
        variant="outline"
        size="sm"
        className="p-2"
        onClick={() => setOpen((prev) => !prev)}
      >
        <MoreHorizontal className="w-5 h-5" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md border border-slate-200 z-50">
          <button
            className="flex items-center gap-2 w-full px-4 py-2 hover:bg-slate-100"
            onClick={() => {
              setOpen(false);
              onView();
            }}
          >
            <Eye className="w-4 h-4" /> View Details
          </button>
          <button
            className="flex items-center gap-2 w-full px-4 py-2 hover:bg-slate-100 text-red-600"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}