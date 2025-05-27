import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility classes for dark mode compatibility
export const textStyles = {
  // For headings and important content
  heading: "text-gray-900 dark:text-gray-100",
  // For standard content
  standard: "text-gray-700 dark:text-gray-300",
  // For secondary or muted content
  muted: "text-gray-500 dark:text-gray-400",
  // For link or accent text
  accent: "text-primary dark:text-primary-foreground"
};
