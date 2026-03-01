"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const AccordionContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  collapsible?: boolean;
  type?: "single" | "multiple";
}>({});

const Accordion = ({
  type = "single",
  collapsible = true,
  className,
  children,
  defaultValue,
  onValueChange,
}: {
  type?: "single" | "multiple";
  collapsible?: boolean;
  className?: string;
  children: React.ReactNode;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);

  const handleValueChange = (val: string) => {
    if (type === "single") {
      const newValue = collapsible && internalValue === val ? undefined : val;
      setInternalValue(newValue);
      onValueChange?.(newValue || "");
    }
  };

  return (
    <AccordionContext.Provider
      value={{
        value: internalValue,
        onValueChange: handleValueChange,
        collapsible,
        type,
      }}
    >
      <div className={cn("space-y-1", className)}>{children}</div>
    </AccordionContext.Provider>
  );
};

const AccordionItem = ({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) => {
  const { value: activeValue } = React.useContext(AccordionContext);
  const isOpen = activeValue === value;

  return (
    <div
      data-state={isOpen ? "open" : "closed"}
      className={cn("border-b border-slate-200", className)}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child as React.ReactElement<{ value?: string }>,
            {
              value,
            },
          );
        }
        return child;
      })}
    </div>
  );
};

const AccordionTrigger = ({
  children,
  className,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  value?: string;
}) => {
  const { value: activeValue, onValueChange } =
    React.useContext(AccordionContext);
  const isOpen = activeValue === value;

  return (
    <button
      type="button"
      data-state={isOpen ? "open" : "closed"}
      onClick={() => value && onValueChange?.(value)}
      className={cn(
        "flex w-full items-center justify-between py-4 text-left font-medium transition-all hover:underline",
        className,
      )}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          isOpen && "rotate-180",
        )}
      />
    </button>
  );
};

const AccordionContent = ({
  children,
  className,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  value?: string;
}) => {
  const { value: activeValue } = React.useContext(AccordionContext);
  const isOpen = activeValue === value;

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          data-state={isOpen ? "open" : "closed"}
          className="overflow-hidden"
        >
          <div className={cn("pb-4 pt-0", className)}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
