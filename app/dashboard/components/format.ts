const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

// Fixed locale so the server-rendered string matches what the client hydrates.
const LOCALE = "en-US";

export function formatDate(value: string | number | Date) {
  return new Date(value).toLocaleDateString(LOCALE, DATE_FORMAT);
}

export function formatTime(value: string | number | Date) {
  return new Date(value).toLocaleTimeString(LOCALE, TIME_FORMAT);
}

export function formatDateTime(value: string | number | Date) {
  return `${formatDate(value)}, ${formatTime(value)}`;
}

/** "2 hours ago" / "1 day ago", relative to `now` (passed in so it stays stable). */
export function formatRelative(value: string | number | Date, now: number) {
  const diffSeconds = Math.round((now - new Date(value).getTime()) / 1000);
  if (diffSeconds < 60) return "just now";

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["minute", 60],
    ["hour", 3600],
    ["day", 86400],
    ["month", 2592000],
    ["year", 31536000],
  ];

  let unit: Intl.RelativeTimeFormatUnit = "minute";
  let seconds = 60;
  for (const [candidateUnit, candidateSeconds] of units) {
    if (diffSeconds >= candidateSeconds) {
      unit = candidateUnit;
      seconds = candidateSeconds;
    }
  }

  const amount = Math.floor(diffSeconds / seconds);
  return `${amount} ${unit}${amount === 1 ? "" : "s"} ago`;
}

/** Wall-clock read for Server Components, where render-time freshness is the point. */
export function currentTimestamp() {
  return Date.now();
}
