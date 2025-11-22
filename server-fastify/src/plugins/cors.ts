import fastifyCors from '@fastify/cors';
import type { FastifyPluginAsync } from 'fastify';

/**
 * CORS Plugin
 * Enables Cross-Origin Resource Sharing for the React frontend
 */
const corsPlugin: FastifyPluginAsync = async (fastify) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3001';
  const allowedOrigins = [clientUrl];

  // In development, also allow localhost variants
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173');
  }

  await fastify.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        cb(null, true);
        return;
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        fastify.log.warn(`CORS rejected origin: ${origin}`);
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  fastify.log.info(`✅ CORS plugin registered - Allowed origins: ${allowedOrigins.join(', ')}`);
};

export default corsPlugin;
