import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import authPlugin from './plugins/auth.js';
import prismaPlugin from './plugins/prisma.js';
import authRoutes from './routes/authRoutes.js';
import mapsRoutes from './routes/mapsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { providerRoutes, serviceProviderRoutes } from './routes/providerRoutes.js';
import rideRequestRoutes from './routes/rideRequestRoutes.js';
import userRoutes from './routes/userRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';

/**
 * Build Fastify application instance
 * Registers all plugins and configurations
 */
export async function buildApp(): Promise<FastifyInstance> {
  // Initialize Fastify with Zod type provider
  const app = Fastify({
    logger:
      env.NODE_ENV === 'development'
        ? {
            level: 'debug',
            transport: {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
                colorize: true,
              },
            },
          }
        : {
            level: 'info',
          },
    // Increase body size limits if needed
    bodyLimit: 1048576, // 1MB default
    trustProxy: true, // Trust X-Forwarded-* headers
  }).withTypeProvider<ZodTypeProvider>();

  // Set Zod validation and serialization
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Allow empty JSON bodies for DELETE requests
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (_req, body: string, done) => {
      try {
        const json = body === '' ? {} : JSON.parse(body);
        done(null, json);
      } catch (err: any) {
        err.statusCode = 400;
        done(err, undefined);
      }
    }
  );

  // Global error handler
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    app.log.error(error);

    // Zod validation errors
    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation error',
        validation: error.validation,
      });
    }

    // HTTP errors
    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name || 'Error',
        message: error.message,
      });
    }

    // Generic server error
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: env.NODE_ENV === 'production' ? 'Something went wrong!' : error.message,
    });
  });

  // Health check endpoint (before plugins to avoid auth)
  app.get('/health', async () => {
    return {
      status: 'OK',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    };
  });

  // Register CORS
  const clientUrl = env.CLIENT_URL || 'http://localhost:3001';
  const allowedOrigins = [clientUrl];

  // In development, also allow localhost variants
  if (env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173');
  }

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        cb(null, true);
        return;
      }

      // Allow Twilio and Vonage webhooks
      if (origin && (origin.includes('twilio.com') || origin.includes('vonage.com'))) {
        cb(null, true);
        return;
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        app.log.warn(`CORS rejected origin: ${origin}`);
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

  app.log.info(`✅ CORS configured - Allowed origins: ${allowedOrigins.join(', ')}`);

  // Register Helmet for security headers
  await app.register(helmet, {
    contentSecurityPolicy: false, // Disable if using external CDNs
  });

  // Register Prisma database plugin
  await app.register(prismaPlugin);

  // Register auth plugin (must be before routes that use auth)
  await app.register(authPlugin);

  // Register routes
  await app.register(notificationRoutes, { prefix: '/api/notifications' });
  await app.register(rideRequestRoutes, { prefix: '/api/riderequests' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(providerRoutes, { prefix: '/api/providers' });
  await app.register(serviceProviderRoutes, { prefix: '/api/service-providers' });
  await app.register(vehicleRoutes, { prefix: '/api/vehicles' });
  await app.register(mapsRoutes, { prefix: '/api/maps' });

  return app;
}
