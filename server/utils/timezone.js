/**
 * Timezone Utility for Eastern Time (ET) Handling
 *
 * Server runs on UTC (Render default), but team operates in Eastern Time.
 * This utility ensures all time scheduling and comparisons happen in ET.
 *
 * Handles both EST (UTC-5) and EDT (UTC-4) automatically based on DST.
 */

const moment = require('moment-timezone');

// Eastern Time zone identifier
const ET_TIMEZONE = 'America/New_York';

/**
 * Get current time in Eastern Time
 * @returns {moment.Moment} Current ET time
 */
function nowET() {
  return moment.tz(ET_TIMEZONE);
}

/**
 * Parse a datetime string as Eastern Time
 * Handles strings like "2025-01-14T14:45:00" and interprets them as ET
 *
 * @param {string|Date} dateTimeString - ISO string or Date object
 * @returns {moment.Moment} Moment object in ET timezone
 */
function parseAsET(dateTimeString) {
  if (!dateTimeString) {
    console.warn('⚠️  [Timezone] Received null/undefined datetime');
    return null;
  }

  // If it's already a Date object, convert to ET
  if (dateTimeString instanceof Date) {
    return moment(dateTimeString).tz(ET_TIMEZONE);
  }

  // Parse string as if it's in ET timezone
  // This is critical: "2025-01-14T14:45:00" is interpreted as 2:45 PM ET
  return moment.tz(dateTimeString, ET_TIMEZONE);
}

/**
 * Convert any date to ET timezone
 * @param {Date|string|moment.Moment} date - Date to convert
 * @returns {moment.Moment} Moment in ET timezone
 */
function toET(date) {
  if (!date) return null;
  return moment(date).tz(ET_TIMEZONE);
}

/**
 * Get delay in milliseconds from now (ET) to target time (ET)
 * @param {string|Date|moment.Moment} targetTime - Target time in ET
 * @returns {number} Delay in milliseconds (negative if in past)
 */
function getDelayFromNow(targetTime) {
  const now = nowET();
  const target = parseAsET(targetTime);

  if (!target) {
    console.error('❌ [Timezone] Invalid target time for delay calculation');
    return 0;
  }

  return target.diff(now);
}

/**
 * Check if a time is in the future (in ET)
 * @param {string|Date|moment.Moment} time - Time to check
 * @returns {boolean} True if time is in future
 */
function isInFuture(time) {
  const delay = getDelayFromNow(time);
  return delay > 0;
}

/**
 * Add time to a date in ET
 * @param {string|Date|moment.Moment} baseTime - Starting time
 * @param {number} amount - Amount to add
 * @param {string} unit - Unit (minutes, hours, days, etc.)
 * @returns {moment.Moment} New time in ET
 */
function addTimeET(baseTime, amount, unit) {
  const base = parseAsET(baseTime);
  if (!base) return null;
  return base.add(amount, unit);
}

/**
 * Format a time for display (in ET)
 * @param {string|Date|moment.Moment} time - Time to format
 * @param {string} format - Moment format string (default: 'M/D/YYYY, h:mm:ss A')
 * @returns {string} Formatted time string
 */
function formatET(time, format = 'M/D/YYYY, h:mm:ss A') {
  const et = parseAsET(time);
  if (!et) return 'Invalid Date';
  return et.format(format);
}

/**
 * Get timezone offset string for logging
 * @returns {string} Current ET offset (e.g., "EST (UTC-5)" or "EDT (UTC-4)")
 */
function getTimezoneInfo() {
  const now = nowET();
  const abbreviation = now.format('z'); // EST or EDT
  const offset = now.format('Z'); // e.g., -05:00 or -04:00
  return `${abbreviation} (UTC${offset})`;
}

/**
 * Log time comparison for debugging
 * Helps verify timezone conversions are working correctly
 */
function logTimeComparison(label, time) {
  const et = parseAsET(time);
  const utc = moment(time).utc();

  console.log(`🕐 [Timezone] ${label}:`);
  console.log(`   ET:  ${et.format('M/D/YYYY h:mm:ss A z')}`);
  console.log(`   UTC: ${utc.format('M/D/YYYY HH:mm:ss')} UTC`);
  console.log(`   Offset: ${getTimezoneInfo()}`);
}

module.exports = {
  ET_TIMEZONE,
  nowET,
  parseAsET,
  toET,
  getDelayFromNow,
  isInFuture,
  addTimeET,
  formatET,
  getTimezoneInfo,
  logTimeComparison
};
