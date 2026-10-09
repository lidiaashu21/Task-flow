import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "blue" | "amber" | "emerald" | "red" | "zinc";
  className?: string;
}

const variantClasses = {
  default: "bg-blue-100 text-blue-600",
  blue: "bg-blue-100 text-blue-600",
  amber: "bg-blue-100 text-blue-600",
  emerald: "bg-blue-100 text-blue-600",
  red: "bg-blue-100 text-blue-600",
  zinc: "bg-blue-600 text-white",
} as const;

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
