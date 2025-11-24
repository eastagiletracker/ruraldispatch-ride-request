/**
 * Date/Time Utility Functions (Backend)
 *
 * Timezone Handling Strategy:
 * - All server operations use UTC
 * - All database storage is UTC (ISO 8601 format)
 * - No timezone conversion on server side
 * - Frontend handles display timezone conversions
 */

export type DateInput = string | Date | number;

export interface TimezoneValidation {
  isUTC: boolean;
  timezone: string;
  offset: number;
  message: string;
}

/**
 * Get current UTC timestamp as ISO string
 */
export function getCurrentUTC(): string {
  return new Date().toISOString();
}

/**
 * Validate if a date string is valid ISO 8601 format
 */
export function isValidISODate(dateString: string): boolean {
  if (!dateString) return false;

  const date = new Date(dateString);
  return !Number.isNaN(date.getTime());
}

/**
 * Convert any date input to UTC ISO string
 * Handles various input formats and ensures UTC output
 */
export function toUTCString(dateInput: DateInput): string | null {
  if (!dateInput) return null;

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    console.warn('Invalid date input:', dateInput);
    return null;
  }

  return date.toISOString();
}

/**
 * Add minutes to a UTC date
 */
export function addMinutes(dateInput: DateInput, minutes: number): string {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date input');
  }

  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString();
}

/**
 * Add hours to a UTC date
 */
export function addHours(dateInput: DateInput, hours: number): string {
  return addMinutes(dateInput, hours * 60);
}

/**
 * Check if a UTC date is in the past
 */
export function isPast(dateInput: DateInput): boolean {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return false;

  return date.getTime() < Date.now();
}

/**
 * Check if a UTC date is in the future
 */
export function isFuture(dateInput: DateInput): boolean {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return false;

  return date.getTime() > Date.now();
}

/**
 * Get difference in minutes between two dates
 */
export function getDifferenceInMinutes(date1: DateInput, date2: DateInput): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) {
    throw new Error('Invalid date input');
  }

  return Math.floor((d1.getTime() - d2.getTime()) / 60000);
}

/**
 * Get difference in hours between two dates
 */
export function getDifferenceInHours(date1: DateInput, date2: DateInput): number {
  return getDifferenceInMinutes(date1, date2) / 60;
}

/**
 * Format UTC date for logging (includes timezone indicator)
 */
export function formatForLogging(dateInput: DateInput): string {
  if (!dateInput) return 'N/A';

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return 'Invalid Date';

  // Returns format like: "2024-01-15 14:30:00 UTC"
  return `${date.toISOString().replace('T', ' ').substring(0, 19)} UTC`;
}

/**
 * Ensure a date field is stored as UTC ISO string
 * Useful for data validation/sanitization
 */
export function sanitizeDateField(value: any): string | null {
  if (!value) return null;

  // If already ISO string, validate and return
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  // If Date object, convert to ISO string
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  // If timestamp number
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
}

/**
 * Validate that server is running in UTC
 * Call this on server startup
 */
export function validateServerTimezone(): TimezoneValidation {
  const now = new Date();
  const offset = now.getTimezoneOffset();

  // Timezone offset should be 0 for UTC
  const isUTC = offset === 0;

  return {
    isUTC,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    offset,
    message: isUTC
      ? '✅ Server is running in UTC'
      : `⚠️  Server timezone is not UTC (offset: ${offset} minutes). Consider setting TZ=UTC or remove TZ variable.`,
  };
}
