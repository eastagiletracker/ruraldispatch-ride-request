import express from 'express';
import { checkPermission } from '../middleware/permissions.js';

/**
 * Service Provider Routes
 * Handles driver/service provider CRUD operations
 */
function createProviderRoutes(api) {
    const router = express.Router();

    /**
     * GET /api/providers
     * Get all providers
     */
    router.get('/', async (req, res) => {
        res.json(await api.getProviders());
    });

    /**
     * GET /api/providers/:id
     * Get a specific provider by ID
     */
    router.get('/:id', async (req, res) => {
        res.json(await api.getProvider(req.params.id));
    });

    /**
     * GET /api/providers/fuzzy/:searchTerm
     * Fuzzy search providers by name
     */
    router.get('/fuzzy/:searchTerm', async (req, res) => {
        res.json(await api.fuzzyProviderSearch(req.params.searchTerm));
    });

    /**
     * POST /api/providers
     * Create a new provider
     */
    router.post('/', async (req, res) => {
        res.json(await api.addProvider(req.body));
    });

    return router;
}

/**
 * Service Provider Management Routes (with permissions)
 * Separate router for /service-providers endpoints with stricter permissions
 */
function createServiceProviderRoutes(api) {
    const router = express.Router();

    /**
     * GET /api/service-providers
     * Get all service providers (permission required)
     */
    router.get('/', checkPermission('canViewServiceProviders'), async (req, res) => {
        try {
            const providers = await api.getProviders();
            res.json({
                success: true,
                serviceProviders: providers
            });
        } catch (error) {
            console.error('Error fetching service providers:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * DELETE /api/service-providers/:uuid
     * Delete a service provider (permission required)
     */
    router.delete('/:uuid', checkPermission('canDeleteServiceProviders'), async (req, res) => {
        try {
            const result = await api.deleteProvider(req.params.uuid);
            res.json({
                success: true,
                message: 'Service provider deleted successfully',
                result
            });
        } catch (error) {
            console.error('Error deleting service provider:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
}

export { createProviderRoutes,
    createServiceProviderRoutes };
