import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface AlertProps {
  variant?: "info" | "success" | "error";
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  info: {
    wrapper: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200",
    icon: Info,
  },
  success: {
    wrapper:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
    icon: CheckCircle2,
  },
  error: {
    wrapper: "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200",
    icon: AlertTriangle,
  },
} as const;

export function Alert({ variant = "info", children, className }: AlertProps) {
  const { wrapper, icon: Icon } = variantStyles[variant];

  return (
    <div role="status" className={cn("flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm", wrapper, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
