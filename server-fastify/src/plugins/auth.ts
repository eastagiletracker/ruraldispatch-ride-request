import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import type { SystemRole, Permission } from '../middleware/permissions.js';
import { hasPermission } from '../middleware/permissions.js';

/**
 * Auth Plugin
 * Decorates Fastify request with authentication helpers
 * Uses header-based session authentication (x-user-role header)
 */
const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Add hook to extract user role from headers
  fastify.addHook('onRequest', async (request) => {
    const userRole = request.headers['x-user-role'] as SystemRole | undefined;

    // Set user role on request
    request.userRole = userRole || null;

    // Add checkPermission method to request
    request.checkPermission = (permission: Permission): boolean => {
      if (!request.userRole) return false;
      return hasPermission(request.userRole, permission);
    };
  });

  fastify.log.info('✅ Auth plugin registered');
};

// Module augmentation to add types to Fastify
declare module 'fastify' {
  interface FastifyRequest {
    userRole: SystemRole | null;
    checkPermission(permission: Permission): boolean;
  }
}

// Helper function to create a preHandler that requires authentication
export function requireAuth() {
  return async (request: any, reply: any) => {
    if (!request.userRole) {
      return reply.code(401).send({
        success: false,
        message: 'Authentication required',
      });
    }
  };
}

// Helper function to create a preHandler that requires a specific permission
export function requirePermission(permission: Permission) {
  return async (request: any, reply: any) => {
    if (!request.userRole) {
      return reply.code(401).send({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!request.checkPermission(permission)) {
      return reply.code(403).send({
        success: false,
        message: 'Insufficient permissions',
        required: permission,
        role: request.userRole,
      });
    }
  };
}

// Helper function to require one of multiple permissions
export function requireAnyPermission(permissions: Permission[]) {
  return async (request: any, reply: any) => {
    if (!request.userRole) {
      return reply.code(401).send({
        success: false,
        message: 'Authentication required',
      });
    }

    const hasAnyPermission = permissions.some((perm) => request.checkPermission(perm));

    if (!hasAnyPermission) {
      return reply.code(403).send({
        success: false,
        message: 'Insufficient permissions',
        required: permissions,
        role: request.userRole,
      });
    }
  };
}

// Use fastify-plugin to ensure this plugin is available in all routes
export default fp(authPlugin, {
  name: 'auth-plugin',
});
