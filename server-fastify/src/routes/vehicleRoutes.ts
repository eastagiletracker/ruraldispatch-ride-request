import type { FastifyPluginAsync } from 'fastify';
import { requirePermission } from '../plugins/auth.js';

/**
 * Vehicle Routes Plugin
 * Handles fleet vehicle CRUD operations
 *
 * Endpoints:
 * - GET /api/vehicles - Get all vehicles (permission required)
 * - GET /api/vehicles/fuzzy/:searchTerm - Fuzzy search vehicles
 * - POST /api/vehicles - Create new vehicle
 * - DELETE /api/vehicles/:uuid - Delete vehicle (permission required)
 */

const vehicleRoutes: FastifyPluginAsync = async (fastify) => {
  const api = fastify.database;

  /**
   * GET /api/vehicles
   * Get all vehicles (permission required)
   */
  fastify.get(
    '/',
    {
      preHandler: requirePermission('canViewVehicles'),
    },
    async (_request, reply) => {
      try {
        const vehicles = await api.getVehicles();
        return {
          success: true,
          vehicles: vehicles,
        };
      } catch (error) {
        fastify.log.error(error, 'Error fetching vehicles');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /api/vehicles/fuzzy/:searchTerm
   * Fuzzy search vehicles by model or display name
   */
  fastify.get<{ Params: { searchTerm: string } }>('/fuzzy/:searchTerm', async (request) => {
    return await api.fuzzyVehicleSearch(request.params.searchTerm);
  });

  /**
   * POST /api/vehicles
   * Create a new vehicle
   */
  fastify.post('/', async (request) => {
    return await api.addVehicle(request.body as any);
  });

  /**
   * PUT /api/vehicles/:uuid
   * Update a vehicle
   */
  fastify.put<{ Params: { uuid: string } }>('/:uuid', async (request, reply) => {
    try {
      const result = await api.updateVehicle(request.params.uuid, request.body as any);
      return {
        success: true,
        message: 'Vehicle updated successfully',
        vehicle: result,
      };
    } catch (error) {
      fastify.log.error(error, 'Error updating vehicle');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * DELETE /api/vehicles/:uuid
   * Delete a vehicle (permission required)
   */
  fastify.delete<{ Params: { uuid: string } }>(
    '/:uuid',
    {
      preHandler: requirePermission('canDeleteVehicles'),
    },
    async (request, reply) => {
      try {
        const result = await api.deleteVehicle(request.params.uuid);
        return {
          success: true,
          message: 'Vehicle deleted successfully',
          result,
        };
      } catch (error) {
        fastify.log.error(error, 'Error deleting vehicle');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
};

export default vehicleRoutes;
