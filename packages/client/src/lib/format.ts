const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function formatEventDate(iso: string | null): string {
  if (!iso) return "Date to be announced";
  return dateFormatter.format(new Date(iso));
}

export function formatEventDateTime(iso: string | null): string {
  if (!iso) return "Date to be announced";
  const date = new Date(iso);
  return `${dateFormatter.format(date)} · ${timeFormatter.format(date)}`;
}

export function formatLocation(location: string | null): string {
  return location ?? "Location to be announced";
}

export function formatCapacity(capacity: number | null): string {
  return capacity === null ? "Open capacity" : `${capacity} spots`;
}

/**
 * Converts a <input type="datetime-local"> value ("2026-12-01T18:00") into
 * the "YYYY-MM-DD HH:MM:SS" format MySQL expects — the API forwards the date
 * string as-is without parsing it, so an ISO string with "T"/"Z" fails the insert.
 */
export function toMySQLDateTime(localDateTimeValue: string): string {
  return `${localDateTimeValue.replace("T", " ")}:00`;
}

export function formatPrice(price: number): string {
  return price === 0 ? "Free" : `$${price.toFixed(2)}`;
}

/** Converts an ISO date string into a <input type="datetime-local"> value, in local time. */
export function toDateTimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
