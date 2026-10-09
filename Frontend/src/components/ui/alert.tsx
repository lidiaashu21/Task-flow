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
    wrapper: "border-blue-600 bg-blue-600 text-white",
    icon: Info,
  },
  success: {
    wrapper: "border-blue-600 bg-blue-600 text-white",
    icon: CheckCircle2,
  },
  error: {
    wrapper: "border-blue-600 bg-blue-600 text-white",
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
