const bahtCompact = new Intl.NumberFormat("en-TH", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const plain = new Intl.NumberFormat("en-TH");

/** 450000 -> "450,000" */
export function num(value: number): string {
  return plain.format(value);
}

/** 450000 -> "฿450,000" */
export function baht(value: number): string {
  return `฿${plain.format(Math.round(value))}`;
}

/** 12400000 -> "฿12.4M" — for KPI tiles where the exact figure is secondary. */
export function bahtCompactly(value: number): string {
  return `฿${bahtCompact.format(value)}`;
}

export function units(value: number): string {
  return `${plain.format(value)} ${value === 1 ? "unit" : "units"}`;
}

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateOnly = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function stamp(iso: string): string {
  return dateTime.format(new Date(iso));
}

export function day(iso: string): string {
  return dateOnly.format(new Date(iso));
}

/**
 * Relative age, rendered from a fixed "now" passed by the caller so server and
 * client agree and hydration does not mismatch.
 */
export function since(iso: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Joins class names, dropping falsy values. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
