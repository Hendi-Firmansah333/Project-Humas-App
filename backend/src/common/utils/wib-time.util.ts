const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Build a UTC Date instant corresponding to a calendar date + wall-clock time in WIB (Asia/Jakarta, UTC+7),
 * regardless of the host server timezone (Vercel UTC vs local WIB).
 */
export function buildWibDateTime(
  dateInput: Date | string,
  timeStr?: string | null,
  fallback = '08:00',
  endOfMinute = false,
): Date {
  const dateOnly =
    typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())
      ? dateInput.trim()
      : new Date(new Date(dateInput).getTime() + WIB_OFFSET_MS)
          .toISOString()
          .split('T')[0];

  const [yearStr, monthStr, dayStr] = dateOnly.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const fallbackParts = fallback.split(':');
  const cleaned = (timeStr || fallback)
    .replace(/WIB/gi, '')
    .replace('.', ':')
    .trim();
  const parts = cleaned.split(':');

  const parsedHour = Number.parseInt(parts[0] ?? '', 10);
  const parsedMinute = Number.parseInt(parts[1] ?? '', 10);
  const hour = Number.isFinite(parsedHour)
    ? parsedHour
    : Number.parseInt(fallbackParts[0] || '8', 10);
  const minute = Number.isFinite(parsedMinute)
    ? parsedMinute
    : Number.parseInt(fallbackParts[1] || '0', 10);

  const second = endOfMinute ? 59 : 0;
  const ms = endOfMinute ? 999 : 0;

  const utcMs =
    Date.UTC(year, month - 1, day, hour, minute, second, ms) - WIB_OFFSET_MS;
  return new Date(utcMs);
}

export function formatWibTimeLabel(date: Date): string {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(date);
  return `${formatted} WIB`;
}
