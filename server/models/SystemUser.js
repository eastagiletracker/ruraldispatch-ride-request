// System User model for authentication and authorization
// This is separate from the "users" collection which stores service users (riders, etc.)

const bcrypt = require('bcryptjs');
const { generateUuid } = require('../utils/uuid');

/**
 * System User Schema
 *
 * Roles:
 * - admin: Full access to all features and system management
 * - dispatcher: View/manage/assign ride requests, manage dashboard
 * - driver: View assigned rides, update ride status
 * - case_manager: Submit ride requests via public form (minimal internal access)
 */

class SystemUser {
    /**
     * Create a new system user object
     */
    constructor({uuid, username, passwordHash, role, fullName, email, phone, createdAt, updatedAt, lastLogin, isActive}) {
        this.uuid = uuid || generateUuid();
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role; // 'admin', 'dispatcher', 'driver', 'case_manager'
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt || new Date();
        this.lastLogin = lastLogin || null;
        this.isActive = isActive !== undefined ? isActive : true;
    }

    /**
     * Hash password before storing
     */
    static async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }

    /**
     * Compare plain text password with hashed password
     */
    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Validate role
     */
    static isValidRole(role) {
        const validRoles = ['admin', 'dispatcher', 'driver', 'case_manager'];
        return validRoles.includes(role);
    }

    /**
     * Create a new system user with hashed password
     */
    static async create({username, password, role, fullName, email, phone}) {
        if (!this.isValidRole(role)) {
            throw new Error(`Invalid role: ${role}`);
        }

        const passwordHash = await this.hashPassword(password);

        return new SystemUser({
            uuid: generateUuid(),
            username,
            passwordHash,
            role,
            fullName,
            email,
            phone,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
        });
    }

    /**
     * Convert to plain object for database storage (without sensitive data for API responses)
     */
    toJSON() {
        return {
            uuid: this.uuid,
            username: this.username,
            role: this.role,
            fullName: this.fullName,
            email: this.email,
            phone: this.phone,
            lastLogin: this.lastLogin,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Convert to database document (includes password hash)
     */
    toDocument() {
        return {
            uuid: this.uuid,
            username: this.username,
            passwordHash: this.passwordHash,
            role: this.role,
            fullName: this.fullName,
            email: this.email,
            phone: this.phone,
            lastLogin: this.lastLogin,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = SystemUser;
