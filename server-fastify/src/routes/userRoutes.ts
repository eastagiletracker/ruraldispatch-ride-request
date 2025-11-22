import type { FastifyPluginAsync } from 'fastify';
import { requirePermission } from '../plugins/auth.js';
import notificationService from '../services/notificationService.js';

/**
 * User Routes Plugin
 * Handles service user (riders, caregivers) CRUD operations
 *
 * Endpoints:
 * - GET /api/users - Get all users (permission required)
 * - GET /api/users/:id - Get specific user
 * - GET /api/users/:id/fields/:fields - Get specific fields of a user
 * - POST /api/users - Create new user
 * - POST /api/users/sms-consent - Update SMS consent (TCPA compliance)
 * - GET /api/users/fields/:fields - Get specific fields from all users
 * - GET /api/users/fuzzy/:searchTerm - Fuzzy search users
 * - DELETE /api/users/:uuid - Delete user (permission required)
 */

const userRoutes: FastifyPluginAsync = async (fastify) => {
  const api = fastify.database;

  /**
   * GET /api/users
   * Get all users (permission required)
   */
  fastify.get(
    '/',
    {
      preHandler: requirePermission('canViewUsers'),
    },
    async (_request, reply) => {
      try {
        const users = await api.getUsers();
        return { success: true, users: users };
      } catch (error) {
        fastify.log.error(error, 'Error fetching users');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /api/users/:id
   * Get a specific user by ID
   */
  fastify.get<{ Params: { id: string } }>('/:id', async (request) => {
    return await api.getUser(request.params.id);
  });

  /**
   * GET /api/users/:id/fields/:fields
   * Get specific fields of a user
   */
  fastify.get<{ Params: { id: string; fields: string } }>(
    '/:id/fields/:fields',
    async (request) => {
      const fields = request.params.fields.split(',');
      return await api.getSpecifiedFieldsOfUser(request.params.id, fields);
    }
  );

  /**
   * POST /api/users
   * Create a new user
   */
  fastify.post('/', async (request) => {
    return await api.addUser(request.body as any);
  });

  /**
   * PUT /api/users/:uuid
   * Update a user
   */
  fastify.put<{ Params: { uuid: string } }>('/:uuid', async (request, reply) => {
    try {
      const result = await api.updateUser(request.params.uuid, request.body as any);
      return {
        success: true,
        message: 'User updated successfully',
        user: result,
      };
    } catch (error) {
      fastify.log.error(error, 'Error updating user');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/users/sms-consent
   * Update user SMS consent (TCPA compliance)
   */
  fastify.post<{
    Body: {
      phoneNumber: string;
      consentGiven: boolean;
      timestamp?: string;
      ipAddress?: string;
    };
  }>('/sms-consent', async (request, reply) => {
    try {
      const { phoneNumber, consentGiven, timestamp, ipAddress } = request.body;

      // Find user by phone and update consent
      const result = await api.updateUserSMSConsent(phoneNumber, {
        given: consentGiven,
        timestamp: timestamp || new Date().toISOString(),
        ipAddress: ipAddress || request.ip,
      });

      // If newly given consent, send confirmation SMS
      if (consentGiven) {
        try {
          await notificationService.sendSMS(
            phoneNumber,
            "SWARM LLC: Welcome! You're signed up for ride notifications (1-5 msgs/ride). Msg&data rates may apply. Reply STOP to opt-out, HELP for support. Terms: https://ruraldispatch.swarmnyc.com/sms-terms"
          );
        } catch (e) {
          fastify.log.error(e, 'Failed to send confirmation SMS');
        }
      }

      return {
        success: true,
        message: 'SMS consent updated successfully',
        result,
      };
    } catch (error) {
      fastify.log.error(error, 'Error updating SMS consent');
      return reply.status(500).send({
        success: false,
        message: 'Failed to update SMS consent',
      });
    }
  });

  /**
   * GET /api/users/fields/:fields
   * Get specific fields from all users
   */
  fastify.get<{ Params: { fields: string } }>('/fields/:fields', async (request) => {
    const fields = request.params.fields.split(',');
    return await api.getSpecifiedFieldsOfUsers(fields);
  });

  /**
   * GET /api/users/fuzzy/:searchTerm
   * Fuzzy search users by name or phone
   */
  fastify.get<{ Params: { searchTerm: string } }>('/fuzzy/:searchTerm', async (request) => {
    return await api.fuzzyUserSearch(request.params.searchTerm);
  });

  /**
   * DELETE /api/users/:uuid
   * Delete a user (permission required)
   */
  fastify.delete<{ Params: { uuid: string } }>(
    '/:uuid',
    {
      preHandler: requirePermission('canDeleteUsers'),
    },
    async (request, reply) => {
      try {
        const result = await api.deleteUser(request.params.uuid);
        return {
          success: true,
          message: 'User deleted successfully',
          result,
        };
      } catch (error) {
        fastify.log.error(error, 'Error deleting user');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
};

export default userRoutes;
