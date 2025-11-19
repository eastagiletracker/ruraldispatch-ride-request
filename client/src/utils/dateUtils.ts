/**
 * Date/Time Utility Functions
 *
 * Timezone Handling Strategy:
 * - Backend stores all times in UTC
 * - Frontend displays times in user's local timezone
 * - datetime-local inputs work with local time, must convert to/from UTC
 */

/**
 * Format a UTC date string for display in user's local timezone
 * @param utcDateString - ISO 8601 date string from backend (UTC)
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in user's local timezone
 */
export function formatLocalDateTime(
  utcDateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!utcDateString) return 'N/A';

  const date = new Date(utcDateString);

  // Check if date is valid
  if (isNaN(date.getTime())) return 'Invalid Date';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options
  };

  return date.toLocaleString('en-US', defaultOptions);
}

/**
 * Convert UTC date string to datetime-local input format (YYYY-MM-DDTHH:mm)
 * datetime-local uses local timezone, so we need to convert UTC to local
 * @param utcDateString - ISO 8601 date string from backend (UTC)
 * @returns Date string in format for datetime-local input
 */
export function utcToDateTimeLocal(utcDateString: string | null | undefined): string {
  if (!utcDateString) return '';

  const date = new Date(utcDateString);
  if (isNaN(date.getTime())) return '';

  // Get local time components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert datetime-local input value to UTC ISO string for backend
 * datetime-local is in local timezone, needs to be converted to UTC
 * @param dateTimeLocalString - Value from datetime-local input (YYYY-MM-DDTHH:mm)
 * @returns ISO 8601 string in UTC
 */
export function dateTimeLocalToUTC(dateTimeLocalString: string): string {
  if (!dateTimeLocalString) return '';

  // datetime-local value is interpreted as local time
  const date = new Date(dateTimeLocalString);

  if (isNaN(date.getTime())) return '';

  // Convert to UTC ISO string
  return date.toISOString();
}

/**
 * Get current date/time in datetime-local format (for default values)
 * @returns Current local time in YYYY-MM-DDTHH:mm format
 */
export function getCurrentDateTimeLocal(): string {
  const now = new Date();
  return utcToDateTimeLocal(now.toISOString());
}

/**
 * Format date for display (date only, no time)
 * @param utcDateString - ISO 8601 date string from backend (UTC)
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatLocalDate(utcDateString: string | null | undefined): string {
  if (!utcDateString) return 'N/A';

  const date = new Date(utcDateString);
  if (isNaN(date.getTime())) return 'Invalid Date';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format time for display (time only, no date)
 * @param utcDateString - ISO 8601 date string from backend (UTC)
 * @returns Formatted time string (e.g., "3:30 PM")
 */
export function formatLocalTime(utcDateString: string | null | undefined): string {
  if (!utcDateString) return 'N/A';

  const date = new Date(utcDateString);
  if (isNaN(date.getTime())) return 'Invalid Time';

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 30 minutes")
 * @param utcDateString - ISO 8601 date string from backend (UTC)
 * @returns Relative time string
 */
export function getRelativeTime(utcDateString: string | null | undefined): string {
  if (!utcDateString) return '';

  const date = new Date(utcDateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (Math.abs(diffMins) < 1) return 'now';
  if (diffMins < 0) {
    // Past
    if (Math.abs(diffMins) < 60) return `${Math.abs(diffMins)} min ago`;
    if (Math.abs(diffHours) < 24) return `${Math.abs(diffHours)} hr ago`;
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`;
  } else {
    // Future
    if (diffMins < 60) return `in ${diffMins} min`;
    if (diffHours < 24) return `in ${diffHours} hr`;
    return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }
}

/**
 * Check if a date is today (in user's local timezone)
 * @param utcDateString - ISO 8601 date string from backend (UTC)
 * @returns true if date is today in user's timezone
 */
export function isToday(utcDateString: string | null | undefined): boolean {
  if (!utcDateString) return false;

  const date = new Date(utcDateString);
  if (isNaN(date.getTime())) return false;

  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Validate datetime-local input value
 * @param dateTimeLocalString - Value from datetime-local input
 * @returns Error message if invalid, null if valid
 */
export function validateDateTime(dateTimeLocalString: string): string | null {
  if (!dateTimeLocalString) return 'Date and time are required';

  const date = new Date(dateTimeLocalString);
  if (isNaN(date.getTime())) return 'Invalid date/time format';

  // Optional: Check if date is in the past
  const now = new Date();
  if (date < now) {
    return 'Date/time cannot be in the past';
  }

  return null; // Valid
}
