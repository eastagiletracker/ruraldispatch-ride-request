import express from 'express';
import notificationService from '../services/notificationService.js';
import { checkPermission } from '../middleware/permissions.js';

/**
 * User Routes
 * Handles service user (riders, caregivers) CRUD operations
 */
function createUserRoutes(api) {
    const router = express.Router();

    /**
     * GET /api/users
     * Get all users (permission required)
     */
    router.get('/', checkPermission('canViewUsers'), async (req, res) => {
        try {
            const users = await api.getUsers();
            res.json({ success: true, users: users });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * GET /api/users/:id
     * Get a specific user by ID
     */
    router.get('/:id', async (req, res) => {
        res.json(await api.getUser(req.params.id));
    });

    /**
     * GET /api/users/:id/fields/:fields
     * Get specific fields of a user
     */
    router.get('/:id/fields/:fields', async (req, res) => {
        res.json(await api.getSpecifiedFieldsOfUser(req.params.id, req.params.fields.split(',')));
    });

    /**
     * POST /api/users
     * Create a new user
     */
    router.post('/', async (req, res) => {
        res.json(await api.addUser(req.body));
    });

    /**
     * POST /api/users/sms-consent
     * Update user SMS consent (TCPA compliance)
     */
    router.post('/sms-consent', async (req, res) => {
        try {
            const { phoneNumber, consentGiven, timestamp, ipAddress } = req.body;

            // Find user by phone and update consent
            const result = await api.updateUserSMSConsent(phoneNumber, {
                given: consentGiven,
                timestamp: timestamp || new Date().toISOString(),
                ipAddress: ipAddress || req.ip
            });

            // If newly given consent, send confirmation SMS (verbal/web).
            if (consentGiven) {
                try {
                    await notificationService.sendSMS(phoneNumber, 'SWARM LLC: Welcome! You\'re signed up for ride notifications (1-5 msgs/ride). Msg&data rates may apply. Reply STOP to opt-out, HELP for support. Terms: https://ruraldispatch.swarmnyc.com/sms-terms');
                } catch (e) {
                    console.error('Failed to send confirmation SMS:', e.message);
                }
            }

            res.json({
                success: true,
                message: 'SMS consent updated successfully',
                result
            });
        } catch (error) {
            console.error('Error updating SMS consent:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update SMS consent'
            });
        }
    });

    /**
     * GET /api/users/fields/:fields
     * Get specific fields from all users
     */
    router.get('/fields/:fields', async (req, res) => {
        res.json(await api.getSpecifiedFieldsOfUsers(req.params.fields.split(',')));
    });

    /**
     * GET /api/users/fuzzy/:searchTerm
     * Fuzzy search users by name or phone
     */
    router.get('/fuzzy/:searchTerm', async (req, res) => {
        res.json(await api.fuzzyUserSearch(req.params.searchTerm));
    });

    /**
     * DELETE /api/users/:uuid
     * Delete a user (permission required)
     */
    router.delete('/:uuid', checkPermission('canDeleteUsers'), async (req, res) => {
        try {
            const result = await api.deleteUser(req.params.uuid);
            res.json({
                success: true,
                message: 'User deleted successfully',
                result
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
}

export default createUserRoutes;
