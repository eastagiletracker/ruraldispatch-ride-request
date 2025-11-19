const express = require('express');
const { checkPermission } = require('../middleware/permissions');

/**
 * Authentication and System User Routes
 * Handles authentication, system user management (admin, dispatcher, driver, case_manager)
 */
function createAuthRoutes(api) {
    const router = express.Router();

    /**
     * POST /api/auth/login
     * Authenticate a system user
     */
    router.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username and password are required'
                });
            }

            const result = await api.authenticateSystemUser(username, password);

            if (result.success) {
                res.json({
                    success: true,
                    user: result.user
                });
            } else {
                res.status(401).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during login'
            });
        }
    });

    /**
     * GET /api/auth/users
     * Get all system users (admin only)
     */
    router.get('/users', async (req, res) => {
        try {
            const users = await api.getAllSystemUsers();
            res.json({ success: true, users });
        } catch (error) {
            console.error('Error getting system users:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * GET /api/auth/users/:uuid
     * Get system user by UUID
     */
    router.get('/users/:uuid', async (req, res) => {
        try {
            const user = await api.getSystemUserByUuid(req.params.uuid);
            if (user) {
                const { passwordHash, ...userWithoutPassword } = user;
                res.json({ success: true, user: userWithoutPassword });
            } else {
                res.status(404).json({ success: false, message: 'User not found' });
            }
        } catch (error) {
            console.error('Error getting system user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * POST /api/auth/users
     * Create new system user (admin only)
     */
    router.post('/users', async (req, res) => {
        try {
            const result = await api.createSystemUser(req.body);
            res.json({
                success: true,
                message: 'User created successfully',
                user: result.user
            });
        } catch (error) {
            console.error('Error creating system user:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create user'
            });
        }
    });

    /**
     * PUT /api/auth/users/:uuid
     * Update system user (admin only)
     */
    router.put('/users/:uuid', async (req, res) => {
        try {
            const result = await api.updateSystemUser(req.params.uuid, req.body);
            res.json({
                success: true,
                message: 'User updated successfully',
                result
            });
        } catch (error) {
            console.error('Error updating system user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * POST /api/auth/users/:uuid/deactivate
     * Deactivate system user (admin only)
     */
    router.post('/users/:uuid/deactivate', async (req, res) => {
        try {
            const result = await api.deactivateSystemUser(req.params.uuid);
            res.json({
                success: true,
                message: 'User deactivated successfully',
                result
            });
        } catch (error) {
            console.error('Error deactivating system user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * POST /api/auth/users/:uuid/activate
     * Activate system user (admin only)
     */
    router.post('/users/:uuid/activate', async (req, res) => {
        try {
            const result = await api.activateSystemUser(req.params.uuid);
            res.json({
                success: true,
                message: 'User activated successfully',
                result
            });
        } catch (error) {
            console.error('Error activating system user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * DELETE /api/auth/users/:uuid
     * Delete system user (admin only)
     */
    router.delete('/users/:uuid', async (req, res) => {
        try {
            const result = await api.deleteSystemUser(req.params.uuid);
            res.json({
                success: true,
                message: 'User deleted successfully',
                result
            });
        } catch (error) {
            console.error('Error deleting system user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * GET /api/auth/system-users
     * Get all system users with optional role filter (admin only)
     */
    router.get('/system-users', checkPermission('canViewSystemUsers'), async (req, res) => {
        try {
            const role = req.query.role;
            let users;

            if (role) {
                users = await api.getSystemUsersByRole(role);
            } else {
                users = await api.getAllSystemUsers();
            }

            res.json({
                success: true,
                users: users
            });
        } catch (error) {
            console.error('Error fetching system users:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * PATCH /api/auth/system-users/:uuid/toggle-status
     * Toggle system user active status (admin only)
     */
    router.patch('/system-users/:uuid/toggle-status', checkPermission('canManageSystemUsers'), async (req, res) => {
        try {
            const { isActive } = req.body;
            const result = await api.updateSystemUserStatus(req.params.uuid, isActive);
            res.json({
                success: true,
                message: 'User status updated successfully',
                result
            });
        } catch (error) {
            console.error('Error updating system user status:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * DELETE /api/auth/system-users/:uuid
     * Delete system user (admin only)
     */
    router.delete('/system-users/:uuid', checkPermission('canManageSystemUsers'), async (req, res) => {
        try {
            const result = await api.deleteSystemUser(req.params.uuid);
            res.json({
                success: true,
                message: 'System user deleted successfully',
                result
            });
        } catch (error) {
            console.error('Error deleting system user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
}

module.exports = createAuthRoutes;
