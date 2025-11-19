const express = require('express');
const { checkPermission } = require('../middleware/permissions');

/**
 * Vehicle Routes
 * Handles fleet vehicle CRUD operations
 */
function createVehicleRoutes(api) {
    const router = express.Router();

    /**
     * GET /api/vehicles
     * Get all vehicles (permission required)
     */
    router.get('/', checkPermission('canViewVehicles'), async (req, res) => {
        try {
            const vehicles = await api.getVehicles();
            res.json({
                success: true,
                vehicles: vehicles
            });
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * GET /api/vehicles/fuzzy/:searchTerm
     * Fuzzy search vehicles by model or display name
     */
    router.get('/fuzzy/:searchTerm', async (req, res) => {
        res.json(await api.fuzzyVehicleSearch(req.params.searchTerm));
    });

    /**
     * POST /api/vehicles
     * Create a new vehicle
     */
    router.post('/', async (req, res) => {
        res.json(await api.addVehicle(req.body));
    });

    /**
     * DELETE /api/vehicles/:uuid
     * Delete a vehicle (permission required)
     */
    router.delete('/:uuid', checkPermission('canDeleteVehicles'), async (req, res) => {
        try {
            const result = await api.deleteVehicle(req.params.uuid);
            res.json({
                success: true,
                message: 'Vehicle deleted successfully',
                result
            });
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
}

module.exports = createVehicleRoutes;
