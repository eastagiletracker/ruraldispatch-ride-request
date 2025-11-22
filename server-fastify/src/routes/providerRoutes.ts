import type { FastifyPluginAsync } from 'fastify';
import { requirePermission } from '../plugins/auth.js';

/**
 * Service Provider Routes Plugin
 * Handles driver/service provider CRUD operations
 *
 * Two route groups:
 * 1. /api/providers - Basic provider endpoints (no permission required)
 * 2. /api/service-providers - Management endpoints (with permissions)
 *
 * Endpoints:
 * - GET /api/providers - Get all providers
 * - GET /api/providers/:id - Get specific provider
 * - GET /api/providers/fuzzy/:searchTerm - Fuzzy search providers
 * - POST /api/providers - Create new provider
 * - GET /api/service-providers - Get all service providers (permission required)
 * - DELETE /api/service-providers/:uuid - Delete provider (permission required)
 */

/**
 * Basic Provider Routes (no permissions)
 * Mounted at /api/providers
 */
export const providerRoutes: FastifyPluginAsync = async (fastify) => {
  const api = fastify.database;

  /**
   * GET /api/providers
   * Get all providers
   */
  fastify.get('/', async () => {
    return await api.getProviders();
  });

  /**
   * GET /api/providers/:id
   * Get a specific provider by ID
   */
  fastify.get<{ Params: { id: string } }>('/:id', async (request) => {
    return await api.getProvider(request.params.id);
  });

  /**
   * GET /api/providers/fuzzy/:searchTerm
   * Fuzzy search providers by name
   */
  fastify.get<{ Params: { searchTerm: string } }>('/fuzzy/:searchTerm', async (request) => {
    return await api.fuzzyProviderSearch(request.params.searchTerm);
  });

  /**
   * POST /api/providers
   * Create a new provider
   */
  fastify.post('/', async (request) => {
    return await api.addProvider(request.body as any);
  });
};

/**
 * Service Provider Management Routes (with permissions)
 * Mounted at /api/service-providers
 */
export const serviceProviderRoutes: FastifyPluginAsync = async (fastify) => {
  const api = fastify.database;

  /**
   * GET /api/service-providers
   * Get all service providers (permission required)
   */
  fastify.get(
    '/',
    {
      preHandler: requirePermission('canViewServiceProviders'),
    },
    async (_request, reply) => {
      try {
        const providers = await api.getProviders();
        return {
          success: true,
          serviceProviders: providers,
        };
      } catch (error) {
        fastify.log.error(error, 'Error fetching service providers');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * DELETE /api/service-providers/:uuid
   * Delete a service provider (permission required)
   */
  fastify.delete<{ Params: { uuid: string } }>(
    '/:uuid',
    {
      preHandler: requirePermission('canDeleteServiceProviders'),
    },
    async (request, reply) => {
      try {
        const result = await api.deleteProvider(request.params.uuid);
        return {
          success: true,
          message: 'Service provider deleted successfully',
          result,
        };
      } catch (error) {
        fastify.log.error(error, 'Error deleting service provider');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
};

// Export both routers
export default { providerRoutes, serviceProviderRoutes };
