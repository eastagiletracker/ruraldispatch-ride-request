/**
 * Display ID Generator
 * Generates short, human-readable IDs for entities
 *
 * Format: PREFIX-XXXX (e.g., RIDE-X7K9, RIDE-M3P2)
 * - 4-character random alphanumeric code
 * - URL-safe characters (uppercase letters and numbers, excluding ambiguous chars)
 * - ~1.6 million combinations (36^4)
 * - Collision probability is very low for typical use cases
 */

// Character set excluding ambiguous characters (0/O, 1/I/L)
const CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const ID_LENGTH = 4;

/**
 * Generate a random short ID
 */
function generateRandomCode(length = ID_LENGTH): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

/**
 * Generate a display ID for a ride request
 */
export function generateRideDisplayId(): string {
  return `RIDE-${generateRandomCode()}`;
}

/**
 * Generate a display ID for a user
 */
export function generateUserDisplayId(): string {
  return `USER-${generateRandomCode()}`;
}

/**
 * Generate a display ID for a driver
 */
export function generateDriverDisplayId(): string {
  return `DRV-${generateRandomCode()}`;
}

/**
 * Generate a display ID for a vehicle
 */
export function generateVehicleDisplayId(): string {
  return `VEH-${generateRandomCode()}`;
}

/**
 * Validate display ID format
 */
export function isValidDisplayId(displayId: string, prefix: string): boolean {
  if (typeof displayId !== 'string') return false;

  const pattern = new RegExp(`^${prefix}-[${CHARS}]{${ID_LENGTH}}$`);
  return pattern.test(displayId);
}

export { generateRandomCode };
