import { buildApp } from './app.js';
import { env } from './config/env.js';
import * as dateUtils from './utils/dateUtils.js';

/**
 * Start the Fastify server
 */
async function start() {
  try {
    // Build the app
    const app = await buildApp();

    // TODO: Register plugins here (Phase 2)
    // await app.register(corsPlugin);
    // await app.register(helmetPlugin);
    // await app.register(prismaPlugin);
    // await app.register(authPlugin);
    // await app.register(staticPlugin);

    // TODO: Register routes here (Phase 5)
    // await app.register(authRoutes, { prefix: '/api/auth' });
    // await app.register(rideRequestRoutes, { prefix: '/api/riderequests' });
    // etc...

    // Start listening
    await app.listen({
      port: env.PORT,
      host: '0.0.0.0', // Listen on all interfaces (important for Docker)
    });

    app.log.info(`🚀 Server running on port ${env.PORT}`);
    app.log.info(`   Environment: ${env.NODE_ENV}`);

    // Validate server timezone (CRITICAL for scheduler accuracy)
    const tzCheck = dateUtils.validateServerTimezone();
    app.log.info(tzCheck.message);

    if (!tzCheck.isUTC) {
      app.log.warn('⚠️  WARNING: Server is not running in UTC!');
      app.log.warn(`   Timezone: ${tzCheck.timezone}`);
      app.log.warn(`   Offset: ${tzCheck.offset} minutes from UTC`);
      app.log.warn('   This WILL cause scheduling issues!');
      app.log.warn('   Remove TZ environment variable or set TZ=UTC');
    }

    const tz = env.TZ || 'UTC';
    const now = new Date();
    try {
      app.log.info(`Current server time (${tz}): ${now.toLocaleString('en-US', { timeZone: tz })}`);
    } catch (_err) {
      app.log.info(`Current server time (system locale): ${now.toString()}`);
      app.log.warn(`Unable to format server time with timezone "${tz}"`);
    }
    app.log.info(`Current server time (ISO): ${now.toISOString()}`);
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
start();
