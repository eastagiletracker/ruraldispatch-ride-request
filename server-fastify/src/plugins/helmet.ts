import fastifyHelmet from '@fastify/helmet';
import type { FastifyPluginAsync } from 'fastify';

/**
 * Helmet Plugin
 * Security headers middleware
 */
const helmetPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Disable CSP to avoid blocking assets
    crossOriginEmbedderPolicy: false, // Disable for compatibility
  });

  fastify.log.info('✅ Helmet plugin registered');
};

export default helmetPlugin;
