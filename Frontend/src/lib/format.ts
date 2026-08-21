import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export function formatRelative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function formatDate(iso: string): string {
  return format(new Date(iso), "MMM d, yyyy");
}

export function formatDateInput(iso: string | null): string {
  return iso ? format(new Date(iso), "yyyy-MM-dd") : "";
}

/** Compact timestamp for a chat bubble: time-only for today, otherwise a short date. */
export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return `Yesterday ${format(date, "h:mm a")}`;
  return format(date, "MMM d, h:mm a");
}
