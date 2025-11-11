// Database operations for system users (authentication and authorization)
const SystemUser = require('../models/SystemUser');

/**
 * Get all system users (without password hashes)
 */
async function getAllSystemUsers(collection) {
    const users = await collection.find({}).toArray();
    return users.map(user => {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    });
}

/**
 * Get system user by username
 */
async function getSystemUserByUsername(collection, username) {
    return await collection.findOne({ username: username.toLowerCase() });
}

/**
 * Get system user by UUID
 */
async function getSystemUserByUuid(collection, uuid) {
    return await collection.findOne({ uuid: parseInt(uuid) });
}

/**
 * Get system users by role
 */
async function getSystemUsersByRole(collection, role) {
    const users = await collection.find({ role: role }).toArray();
    return users.map(user => {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    });
}

/**
 * Update system user status
 */
async function updateSystemUserStatus(collection, uuid, isActive) {
    return await collection.updateOne(
        { uuid: parseInt(uuid) },
        {
            $set: {
                isActive: isActive,
                updatedAt: new Date()
            }
        }
    );
}

/**
 * Create a new system user
 */
async function createSystemUser(collection, userData) {
    // Check if username already exists
    const existing = await getSystemUserByUsername(collection, userData.username);
    if (existing) {
        throw new Error('Username already exists');
    }

    // Create system user with hashed password
    const systemUser = await SystemUser.create({
        username: userData.username.toLowerCase(),
        password: userData.password,
        role: userData.role,
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone
    });

    // Insert into database
    const result = await collection.insertOne(systemUser.toDocument());

    return {
        acknowledged: result.acknowledged,
        insertedId: result.insertedId,
        user: systemUser.toJSON()
    };
}

/**
 * Authenticate user with username and password
 */
async function authenticateSystemUser(collection, username, password) {
    const user = await getSystemUserByUsername(collection, username);

    if (!user) {
        return { success: false, message: 'Invalid username or password' };
    }

    if (!user.isActive) {
        return { success: false, message: 'User account is inactive' };
    }

    const isPasswordValid = await SystemUser.comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
        return { success: false, message: 'Invalid username or password' };
    }

    // Update last login
    await collection.updateOne(
        { uuid: user.uuid },
        {
            $set: {
                lastLogin: new Date(),
                updatedAt: new Date()
            }
        }
    );

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;

    return {
        success: true,
        user: userWithoutPassword
    };
}

/**
 * Update system user
 */
async function updateSystemUser(collection, uuid, updateData) {
    const updates = {
        ...updateData,
        updatedAt: new Date()
    };

    // If password is being updated, hash it first
    if (updateData.password) {
        updates.passwordHash = await SystemUser.hashPassword(updateData.password);
        delete updates.password;
    }

    const result = await collection.updateOne(
        { uuid: parseInt(uuid) },
        { $set: updates }
    );

    return result;
}

/**
 * Deactivate system user
 */
async function deactivateSystemUser(collection, uuid) {
    return await collection.updateOne(
        { uuid: parseInt(uuid) },
        {
            $set: {
                isActive: false,
                updatedAt: new Date()
            }
        }
    );
}

/**
 * Activate system user
 */
async function activateSystemUser(collection, uuid) {
    return await collection.updateOne(
        { uuid: parseInt(uuid) },
        {
            $set: {
                isActive: true,
                updatedAt: new Date()
            }
        }
    );
}

/**
 * Delete system user
 */
async function deleteSystemUser(collection, uuid) {
    return await collection.deleteOne({ uuid: parseInt(uuid) });
}

module.exports = {
    getAllSystemUsers,
    getSystemUserByUsername,
    getSystemUserByUuid,
    getSystemUsersByRole,
    createSystemUser,
    authenticateSystemUser,
    updateSystemUser,
    updateSystemUserStatus,
    deactivateSystemUser,
    activateSystemUser,
    deleteSystemUser
};
