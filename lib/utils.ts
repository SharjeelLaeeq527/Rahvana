import { clsx, type ClassValue } from "clsx";  //clsx ka kaam hai multiple class names ko combine karna
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
