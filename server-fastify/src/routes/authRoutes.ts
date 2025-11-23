import type { FastifyPluginAsync } from 'fastify';
import { requirePermission } from '../plugins/auth.js';
import {
  createSystemUserSchema,
  loginSchema,
  toggleStatusSchema,
  updateSystemUserSchema,
  uuidParamSchema,
} from '../schemas/auth.schemas.js';

/**
 * Authentication and System User Routes Plugin
 * Handles authentication and system user management
 *
 * Endpoints:
 * - POST /api/auth/login - Authenticate system user
 * - GET /api/auth/users - Get all system users
 * - GET /api/auth/users/:uuid - Get system user by UUID
 * - POST /api/auth/users - Create new system user
 * - PUT /api/auth/users/:uuid - Update system user
 * - POST /api/auth/users/:uuid/deactivate - Deactivate system user
 * - POST /api/auth/users/:uuid/activate - Activate system user
 * - DELETE /api/auth/users/:uuid - Delete system user
 * - GET /api/auth/system-users - Get system users with optional role filter
 * - PATCH /api/auth/system-users/:uuid/toggle-status - Toggle user status
 * - DELETE /api/auth/system-users/:uuid - Delete system user (admin)
 */

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const api = fastify.database;

  /**
   * POST /api/auth/login
   * Authenticate a system user
   */
  fastify.post<{
    Body: { username: string; password: string };
  }>(
    '/login',
    {
      schema: {
        body: loginSchema,
      },
    },
    async (request, reply) => {
      try {
        const { username, password } = request.body;

        const result = await api.authenticateSystemUser(username, password);

        if (result.success) {
          return {
            success: true,
            user: result.user,
          };
        } else {
          return reply.status(401).send({
            success: false,
            message: result.message,
          });
        }
      } catch (error) {
        fastify.log.error(error, 'Login error');
        return reply.status(500).send({
          success: false,
          message: 'Server error during login',
        });
      }
    }
  );

  /**
   * GET /api/auth/users
   * Get all system users (admin only)
   */
  fastify.get('/users', async (_request, reply) => {
    try {
      const users = await api.getAllSystemUsers();
      return { success: true, users };
    } catch (error) {
      fastify.log.error(error, 'Error getting system users');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/auth/users/:uuid
   * Get system user by UUID
   */
  fastify.get<{ Params: { uuid: string } }>('/users/:uuid', async (request, reply) => {
    try {
      const user = await api.getSystemUserByUuid(request.params.uuid);
      if (user) {
        // Remove password hash from response
        const { passwordHash, ...userWithoutPassword } = user as any;
        return { success: true, user: userWithoutPassword };
      } else {
        return reply.status(404).send({ success: false, message: 'User not found' });
      }
    } catch (error) {
      fastify.log.error(error, 'Error getting system user');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/auth/users
   * Create new system user (admin only)
   */
  fastify.post(
    '/users',
    {
      schema: {
        body: createSystemUserSchema,
      },
    },
    async (request, reply) => {
      try {
        const user = await api.createSystemUser(request.body as any);
        return {
          success: true,
          message: 'User created successfully',
          user,
        };
      } catch (error) {
        fastify.log.error(error, 'Error creating system user');
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create user',
        });
      }
    }
  );

  /**
   * PUT /api/auth/users/:uuid
   * Update system user (admin only)
   */
  fastify.put<{ Params: { uuid: string } }>(
    '/users/:uuid',
    {
      schema: {
        params: uuidParamSchema,
        body: updateSystemUserSchema,
      },
    },
    async (request, reply) => {
      try {
        const result = await api.updateSystemUser(request.params.uuid, request.body as any);
        return {
          success: true,
          message: 'User updated successfully',
          result,
        };
      } catch (error) {
        fastify.log.error(error, 'Error updating system user');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * POST /api/auth/users/:uuid/deactivate
   * Deactivate system user (admin only)
   */
  fastify.post<{ Params: { uuid: string } }>('/users/:uuid/deactivate', async (request, reply) => {
    try {
      const result = await api.deactivateSystemUser(request.params.uuid);
      return {
        success: true,
        message: 'User deactivated successfully',
        result,
      };
    } catch (error) {
      fastify.log.error(error, 'Error deactivating system user');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/auth/users/:uuid/activate
   * Activate system user (admin only)
   */
  fastify.post<{ Params: { uuid: string } }>('/users/:uuid/activate', async (request, reply) => {
    try {
      const result = await api.activateSystemUser(request.params.uuid);
      return {
        success: true,
        message: 'User activated successfully',
        result,
      };
    } catch (error) {
      fastify.log.error(error, 'Error activating system user');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * DELETE /api/auth/users/:uuid
   * Delete system user (admin only)
   */
  fastify.delete<{ Params: { uuid: string } }>('/users/:uuid', async (request, reply) => {
    try {
      const result = await api.deleteSystemUser(request.params.uuid);
      return {
        success: true,
        message: 'User deleted successfully',
        result,
      };
    } catch (error) {
      fastify.log.error(error, 'Error deleting system user');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/auth/system-users
   * Get all system users with optional role filter (admin only)
   */
  fastify.get<{
    Querystring: { role?: string };
  }>(
    '/system-users',
    {
      preHandler: requirePermission('canViewSystemUsers'),
    },
    async (request, reply) => {
      try {
        const role = request.query.role;
        let users;

        if (role) {
          users = await api.getSystemUsersByRole(role);
        } else {
          users = await api.getAllSystemUsers();
        }

        return {
          success: true,
          users: users,
        };
      } catch (error) {
        fastify.log.error(error, 'Error fetching system users');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * PATCH /api/auth/system-users/:uuid/toggle-status
   * Toggle system user active status (admin only)
   */
  fastify.patch<{
    Params: { uuid: string };
    Body: { isActive: boolean };
  }>(
    '/system-users/:uuid/toggle-status',
    {
      schema: {
        params: uuidParamSchema,
        body: toggleStatusSchema,
      },
      preHandler: requirePermission('canManageSystemUsers'),
    },
    async (request, reply) => {
      try {
        const { isActive } = request.body;
        const result = await api.updateSystemUserStatus(request.params.uuid, isActive);
        return {
          success: true,
          message: 'User status updated successfully',
          result,
        };
      } catch (error) {
        fastify.log.error(error, 'Error updating system user status');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * PUT /api/auth/system-users/:uuid
   * Update system user (admin only)
   */
  fastify.put<{
    Params: { uuid: string };
    Body: { username?: string; password?: string; fullName?: string };
  }>(
    '/system-users/:uuid',
    {
      schema: {
        params: uuidParamSchema,
        body: updateSystemUserSchema,
      },
      preHandler: requirePermission('canManageSystemUsers'),
    },
    async (request, reply) => {
      try {
        const result = await api.updateSystemUser(request.params.uuid, request.body as any);
        return {
          success: true,
          message: 'User updated successfully',
          result,
        };
      } catch (error) {
        fastify.log.error(error, 'Error updating system user');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * DELETE /api/auth/system-users/:uuid
   * Delete system user (admin only)
   */
  fastify.delete<{ Params: { uuid: string } }>(
    '/system-users/:uuid',
    {
      preHandler: requirePermission('canManageSystemUsers'),
    },
    async (request, reply) => {
      try {
        const result = await api.deleteSystemUser(request.params.uuid);
        return {
          success: true,
          message: 'System user deleted successfully',
          result,
        };
      } catch (error) {
        fastify.log.error(error, 'Error deleting system user');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
};

export default authRoutes;
