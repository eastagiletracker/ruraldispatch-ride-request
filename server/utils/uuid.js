import { v7 as uuidv7 } from 'uuid';

/**
 * Generate a UUIDv7 identifier
 *
 * UUIDv7 provides:
 * - Timestamp-based prefix for sequential ordering (B-Tree performance)
 * - Global uniqueness guarantees
 * - RFC 9562 standard compliance
 * - Distributed-safe generation
 * - Security through unpredictability
 *
 * Performance benefit: Sequential ordering means new records are always
 * inserted at the end of the B-Tree index, avoiding page splits and
 * fragmentation that occur with random UUIDs (UUIDv4).
 *
 * @returns {string} A UUIDv7 string (e.g., "018e5f4e-8b5a-7000-8000-0123456789ab")
 */
function generateUuid() {
    return uuidv7();
}

/**
 * Validate if a string is a valid UUID format
 * @param {string} uuid - String to validate
 * @returns {boolean} True if valid UUID format
 */
function isValidUuid(uuid) {
    if (typeof uuid !== 'string') return false;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

export { generateUuid,
    isValidUuid };
