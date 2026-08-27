// src/components/ui/input.tsx
"use client";
import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { className = "", ...rest } = props;
  return (
    <input
      ref={ref}
      {...rest}
      className={`appearance-none outline-none w-full h-12 px-4 rounded-xl border border-border bg-muted/20 focus:bg-card focus:border-border focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground ${className}`}
    />
  );
});

Input.displayName = "Input";
export { Input };
export default Input;
