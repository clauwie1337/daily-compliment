export type DayKey = `${number}-${string}-${string}`;

/**
 * Convert a Date (or date-like input) into a UTC day key (YYYY-MM-DD).
 * If input is already a YYYY-MM-DD string, it's returned as-is.
 */
export function toUtcDayKey(date: Date | string): DayKey {
  if (typeof date === "string") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Invalid day key string: ${date}`);
    }
    return date as DayKey;
  }

  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}` as DayKey;
}
