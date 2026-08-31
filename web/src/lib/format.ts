const dateTime = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

const timeOnly = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

const full = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

// SQLite hands back "2026-08-06 21:46:20" (UTC, no timezone marker). Safari and
// Firefox will not reliably parse that, so normalise it to an ISO string first.
function parseTimestamp(value: string): Date {
  if (!value) return new Date(NaN);
  const normalised = value.includes("T") ? value : value.replace(" ", "T");
  const withZone = /[Zz]|[+-]\d{2}:?\d{2}$/.test(normalised) ? normalised : `${normalised}Z`;
  return new Date(withZone);
}

function safeFormat(formatter: Intl.DateTimeFormat, value: string): string {
  const date = parseTimestamp(value);
  return Number.isNaN(date.getTime()) ? value : formatter.format(date);
}

export const formatDateTime = (value: string) => safeFormat(dateTime, value);
export const formatTime = (value: string) => safeFormat(timeOnly, value);
export const formatFull = (value: string) => safeFormat(full, value);

/** Value for a datetime-local input, defaulting to the next round hour. */
export function defaultPickupValue(now = new Date()) {
  const d = new Date(now.getTime() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
