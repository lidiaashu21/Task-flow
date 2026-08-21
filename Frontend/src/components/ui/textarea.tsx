import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid = false, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid}
      className={cn(
        "w-full resize-y rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500",
        "dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800/50",
        invalid
          ? "border-red-400 focus-visible:ring-red-500 dark:border-red-500/70"
          : "border-zinc-300 dark:border-zinc-700",
        className
      )}
      {...props}
    />
  );
});
