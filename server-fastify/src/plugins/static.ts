import fastifyStatic from '@fastify/static';
import type { FastifyPluginAsync } from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Static Files Plugin
 * Serves the React SPA build and handles client-side routing
 */
const staticPlugin: FastifyPluginAsync = async (fastify) => {
  // Only serve static files in production
  if (env.NODE_ENV === 'production') {
    const staticPath = path.join(__dirname, '../../../client/dist');

    await fastify.register(fastifyStatic, {
      root: staticPath,
      prefix: '/',
      decorateReply: false, // Don't add reply.sendFile (use fastify-static's methods)
    });

    // SPA fallback - serve index.html for all non-API routes
    fastify.setNotFoundHandler((request, reply) => {
      // Don't intercept API routes
      if (request.url.startsWith('/api')) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Route ${request.method}:${request.url} not found`,
        });
        return;
      }

      // Serve index.html for client-side routing
      reply.sendFile('index.html');
    });

    fastify.log.info(`✅ Static files plugin registered (serving from ${staticPath})`);
  } else {
    fastify.log.info('⏭️  Static files plugin skipped (development mode)');
  }
};

export default staticPlugin;
