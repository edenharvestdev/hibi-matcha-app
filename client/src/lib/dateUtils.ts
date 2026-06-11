/**
 * Date formatting utilities for Hibi Matcha
 * Uses CE (ค.ศ.) year instead of BE (พ.ศ.) while keeping Thai month names
 */

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const THAI_MONTHS_LONG = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function toDate(d: any): Date | null {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Format: "7 เม.ย. 2026" or "7 เม.ย. 26" (short year)
 */
export function formatDate(d: any, options?: { shortYear?: boolean }): string {
  const date = toDate(d);
  if (!date) return "-";
  const day = date.getDate();
  const month = THAI_MONTHS_SHORT[date.getMonth()];
  const year = options?.shortYear
    ? String(date.getFullYear()).slice(-2)
    : String(date.getFullYear());
  return `${day} ${month} ${year}`;
}

/**
 * Format: "7 เมษายน 2026"
 */
export function formatDateLong(d: any): string {
  const date = toDate(d);
  if (!date) return "-";
  const day = date.getDate();
  const month = THAI_MONTHS_LONG[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format: "7 เม.ย. 26 14:30" (with time)
 */
export function formatDateTime(d: any, options?: { shortYear?: boolean }): string {
  const date = toDate(d);
  if (!date) return "-";
  const day = date.getDate();
  const month = THAI_MONTHS_SHORT[date.getMonth()];
  const year = options?.shortYear
    ? String(date.getFullYear()).slice(-2)
    : String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} ${hours}:${minutes}`;
}

/**
 * Format: "7 เม.ย. 2026 14:30:45" (with full time)
 */
export function formatDateTimeFull(d: any): string {
  const date = toDate(d);
  if (!date) return "-";
  const day = date.getDate();
  const month = THAI_MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Format: "14:30" (time only)
 */
export function formatTime(d: any): string {
  const date = toDate(d);
  if (!date) return "-";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Format: "เม.ย. 2026" (month + year)
 */
export function formatMonthYear(d: any): string {
  const date = toDate(d);
  if (!date) return "-";
  const month = THAI_MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
}
