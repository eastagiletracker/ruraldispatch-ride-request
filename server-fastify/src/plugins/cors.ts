import { FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';

/**
 * CORS Plugin
 * Enables Cross-Origin Resource Sharing for the React frontend
 */
const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyCors, {
    origin: true, // Allow all origins in development
    credentials: true, // Allow cookies/auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role'],
  });

  fastify.log.info('✅ CORS plugin registered');
};

export default corsPlugin;
