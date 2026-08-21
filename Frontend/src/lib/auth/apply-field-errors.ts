import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "../api/error";

/**
 * Maps the backend's Zod `fieldErrors` onto react-hook-form fields, and reports whether any
 * field-level error was actually applied — callers fall back to a toast when none match.
 */
export function applyFieldErrors<T extends FieldValues>(error: ApiError, setError: UseFormSetError<T>): boolean {
  if (!error.fieldErrors) return false;

  let applied = false;
  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    if (!messages || messages.length === 0) continue;
    setError(field as Path<T>, { type: "server", message: messages[0] });
    applied = true;
  }
  return applied;
}
