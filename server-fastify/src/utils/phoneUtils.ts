/**
 * Phone Number Utility Functions
 * Provides consistent phone number normalization and comparison across the application
 */

/**
 * Normalize phone number by removing spaces, dashes, and ensuring + prefix
 * This handles various formats like "+1 8777804236", "+1-877-780-4236", "18777804236"
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  // Remove spaces, dashes, parentheses, and dots
  const cleaned = phone.replace(/[-\s().]/g, '');
  // Ensure + prefix for international format
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Compare two phone numbers after normalization
 * Returns true if both phones represent the same number
 */
export function phonesMatch(
  phone1: string | null | undefined,
  phone2: string | null | undefined
): boolean {
  return normalizePhone(phone1) === normalizePhone(phone2);
}
