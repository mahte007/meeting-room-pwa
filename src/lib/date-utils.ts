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
