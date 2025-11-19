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
 * @param {number} length - Length of the random portion (default: 4)
 * @returns {string} Random alphanumeric string
 */
function generateRandomCode(length = ID_LENGTH) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    return result;
}

/**
 * Generate a display ID for a ride request
 * @returns {string} Display ID in format RIDE-XXXX
 */
function generateRideDisplayId() {
    return `RIDE-${generateRandomCode()}`;
}

/**
 * Generate a display ID for a user
 * @returns {string} Display ID in format USER-XXXX
 */
function generateUserDisplayId() {
    return `USER-${generateRandomCode()}`;
}

/**
 * Generate a display ID for a driver
 * @returns {string} Display ID in format DRV-XXXX
 */
function generateDriverDisplayId() {
    return `DRV-${generateRandomCode()}`;
}

/**
 * Generate a display ID for a vehicle
 * @returns {string} Display ID in format VEH-XXXX
 */
function generateVehicleDisplayId() {
    return `VEH-${generateRandomCode()}`;
}

/**
 * Validate display ID format
 * @param {string} displayId - Display ID to validate
 * @param {string} prefix - Expected prefix (e.g., 'RIDE', 'USER')
 * @returns {boolean} True if valid format
 */
function isValidDisplayId(displayId, prefix) {
    if (typeof displayId !== 'string') return false;

    const pattern = new RegExp(`^${prefix}-[${CHARS}]{${ID_LENGTH}}$`);
    return pattern.test(displayId);
}

module.exports = {
    generateRideDisplayId,
    generateUserDisplayId,
    generateDriverDisplayId,
    generateVehicleDisplayId,
    isValidDisplayId,
    generateRandomCode
};
