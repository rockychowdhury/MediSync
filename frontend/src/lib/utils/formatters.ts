import { format, parseISO, formatDistanceToNow, isToday, isYesterday } from "date-fns";

/** Format ISO date string to human-readable */
export function formatDate(dateStr: string, pattern = "MMM d, yyyy"): string {
  return format(parseISO(dateStr), pattern);
}

/** Format time from ISO string */
export function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), "h:mm a");
}

/** Format date + time */
export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d, yyyy 'at' h:mm a");
}

/** Relative time ("2 hours ago") */
export function formatRelativeTime(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return formatDistanceToNow(date, { addSuffix: true });
  if (isYesterday(date)) return "Yesterday";
  return formatDate(dateStr);
}

/** Format minutes to "Xh Ym" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Format percentage (e.g. 0.856 → "85.6%") */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/** Format number with commas (e.g. 1234 → "1,234") */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}
