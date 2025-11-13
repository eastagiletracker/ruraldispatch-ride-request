/**
 * Utility functions for formatting data for display
 */

/**
 * Format a UUID for display by showing only the last 6 digits
 * This makes IDs more readable while keeping them unique enough
 *
 * @param uuid - The full UUID (typically a timestamp like 1731532800000)
 * @returns Shortened ID (e.g., "532800")
 *
 * @example
 * formatShortId(1731532800000) // "532800"
 * formatShortId("1731532800000") // "532800"
 */
export function formatShortId(uuid: number | string | undefined): string {
  if (!uuid) return 'N/A';

  const uuidStr = String(uuid);
  // Take last 6 digits for a shorter, readable ID
  return uuidStr.slice(-6);
}

/**
 * Format a UUID with a prefix for specific entity types
 *
 * @param uuid - The full UUID
 * @param prefix - Optional prefix (R for rider, D for driver, V for vehicle, etc.)
 * @returns Formatted ID with prefix (e.g., "R-532800")
 *
 * @example
 * formatIdWithPrefix(1731532800000, 'R') // "R-532800"
 * formatIdWithPrefix(1731532800000, 'D') // "D-532800"
 */
export function formatIdWithPrefix(uuid: number | string | undefined, prefix?: string): string {
  if (!uuid) return 'N/A';

  const shortId = formatShortId(uuid);
  return prefix ? `${prefix}-${shortId}` : shortId;
}

/**
 * Format ride UUID with # prefix
 *
 * @param uuid - The ride UUID
 * @returns Formatted ride ID (e.g., "#532800")
 *
 * @example
 * formatRideId(1731532800000) // "#532800"
 */
export function formatRideId(uuid: number | string | undefined): string {
  if (!uuid) return 'N/A';

  return `#${formatShortId(uuid)}`;
}
