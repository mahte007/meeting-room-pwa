// The backend uses timezone-less local date-times ("2026-10-06T10:00:00"),
// so these helpers work in the browser's local time and never use toISOString
// (which converts to UTC).

const pad = (n: number) => String(n).padStart(2, "0");

/** Formats a date as a datetime-local input value: "YYYY-MM-DDTHH:mm". */
export function toLocalDateTimeInputValue(date: Date) {
  return `${toLocalDateValue(date)}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

/** Formats a date as "YYYY-MM-DD" in local time. */
export function toLocalDateValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

/** Start of the hour `hoursFromNow` hours from now, as a datetime-local value. */
export function roundedHoursFromNow(hoursFromNow: number) {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + hoursFromNow);
  return toLocalDateTimeInputValue(date);
}

/** Turns a datetime-local value into the backend format by adding seconds. */
export function withSeconds(value: string) {
  return value.length === 16 ? `${value}:00` : value;
}

/** Whether `value` is a usable datetime-local or backend date-time string. */
export function isValidDateTime(value: string | null | undefined) {
  return !!value && !Number.isNaN(new Date(value).getTime());
}

/** Parses "YYYY-MM-DD" as local midnight, or returns null if invalid. */
export function parseLocalDate(value: string | null | undefined) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Monday 00:00 of the week containing `date`. */
export function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  // getDay() is 0 for Sunday; shift so the week starts on Monday.
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
