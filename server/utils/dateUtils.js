/**
 * Date/Time Utility Functions (Backend)
 *
 * Timezone Handling Strategy:
 * - All server operations use UTC
 * - All database storage is UTC (ISO 8601 format)
 * - No timezone conversion on server side
 * - Frontend handles display timezone conversions
 */

/**
 * Get current UTC timestamp as ISO string
 * @returns {string} ISO 8601 string in UTC
 */
function getCurrentUTC() {
  return new Date().toISOString();
}

/**
 * Validate if a date string is valid ISO 8601 format
 * @param {string} dateString - Date string to validate
 * @returns {boolean} true if valid
 */
function isValidISODate(dateString) {
  if (!dateString) return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Convert any date input to UTC ISO string
 * Handles various input formats and ensures UTC output
 * @param {string|Date|number} dateInput - Date in any format
 * @returns {string} ISO 8601 string in UTC
 */
function toUTCString(dateInput) {
  if (!dateInput) return null;

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    console.warn('Invalid date input:', dateInput);
    return null;
  }

  return date.toISOString();
}

/**
 * Add minutes to a UTC date
 * @param {string|Date} dateInput - Starting date (UTC)
 * @param {number} minutes - Minutes to add (can be negative)
 * @returns {string} New ISO 8601 string in UTC
 */
function addMinutes(dateInput, minutes) {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date input');
  }

  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString();
}

/**
 * Add hours to a UTC date
 * @param {string|Date} dateInput - Starting date (UTC)
 * @param {number} hours - Hours to add (can be negative)
 * @returns {string} New ISO 8601 string in UTC
 */
function addHours(dateInput, hours) {
  return addMinutes(dateInput, hours * 60);
}

/**
 * Check if a UTC date is in the past
 * @param {string|Date} dateInput - Date to check (UTC)
 * @returns {boolean} true if date is in the past
 */
function isPast(dateInput) {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return false;

  return date.getTime() < Date.now();
}

/**
 * Check if a UTC date is in the future
 * @param {string|Date} dateInput - Date to check (UTC)
 * @returns {boolean} true if date is in the future
 */
function isFuture(dateInput) {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return false;

  return date.getTime() > Date.now();
}

/**
 * Get difference in minutes between two dates
 * @param {string|Date} date1 - First date (UTC)
 * @param {string|Date} date2 - Second date (UTC)
 * @returns {number} Difference in minutes (date1 - date2)
 */
function getDifferenceInMinutes(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    throw new Error('Invalid date input');
  }

  return Math.floor((d1.getTime() - d2.getTime()) / 60000);
}

/**
 * Get difference in hours between two dates
 * @param {string|Date} date1 - First date (UTC)
 * @param {string|Date} date2 - Second date (UTC)
 * @returns {number} Difference in hours (date1 - date2)
 */
function getDifferenceInHours(date1, date2) {
  return getDifferenceInMinutes(date1, date2) / 60;
}

/**
 * Format UTC date for logging (includes timezone indicator)
 * @param {string|Date} dateInput - Date to format (UTC)
 * @returns {string} Formatted string with UTC indicator
 */
function formatForLogging(dateInput) {
  if (!dateInput) return 'N/A';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid Date';

  // Returns format like: "2024-01-15 14:30:00 UTC"
  return `${date.toISOString().replace('T', ' ').substring(0, 19)} UTC`;
}

/**
 * Ensure a date field is stored as UTC ISO string
 * Useful for data validation/sanitization
 * @param {any} value - Value that should be a date
 * @returns {string|null} UTC ISO string or null if invalid
 */
function sanitizeDateField(value) {
  if (!value) return null;

  // If already ISO string, validate and return
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString();
  }

  // If Date object, convert to ISO string
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value.toISOString();
  }

  // If timestamp number
  if (typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
}

/**
 * Validate that server is running in UTC
 * Call this on server startup
 * @returns {object} { isUTC: boolean, timezone: string, offset: number }
 */
function validateServerTimezone() {
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
      : `⚠️  Server timezone is not UTC (offset: ${offset} minutes). Consider setting TZ=UTC or remove TZ variable.`
  };
}

module.exports = {
  getCurrentUTC,
  isValidISODate,
  toUTCString,
  addMinutes,
  addHours,
  isPast,
  isFuture,
  getDifferenceInMinutes,
  getDifferenceInHours,
  formatForLogging,
  sanitizeDateField,
  validateServerTimezone
};
