import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { prisma, disconnectPrisma } from '../database/prisma.client.js';
import { createDatabaseApi, type DatabaseAPI } from '../database/api.js';

/**
 * Prisma Plugin
 * Decorates Fastify instance with Prisma client and database API
 */
const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  // Decorate Fastify instance with Prisma client
  fastify.decorate('prisma', prisma);

  // Decorate Fastify instance with database API
  const api = createDatabaseApi(prisma);
  fastify.decorate('database', api);

  // Add hook to close Prisma connection on app close
  fastify.addHook('onClose', async () => {
    await disconnectPrisma();
  });

  fastify.log.info('✅ Prisma plugin registered');
};

// Module augmentation to add types to Fastify
declare module 'fastify' {
  interface FastifyInstance {
    prisma: typeof prisma;
    database: DatabaseAPI;
  }
}

// Use fastify-plugin to ensure this plugin is available in all routes
export default fp(prismaPlugin, {
  name: 'prisma-plugin',
});
