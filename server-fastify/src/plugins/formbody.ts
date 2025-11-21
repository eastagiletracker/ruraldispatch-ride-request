import { FastifyPluginAsync } from 'fastify';
import fastifyFormbody from '@fastify/formbody';

/**
 * Form Body Parser Plugin
 * Parses application/x-www-form-urlencoded request bodies
 * Required for Twilio/Vonage webhooks
 */
const formbodyPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyFormbody);

  fastify.log.info('✅ Form body parser plugin registered');
};

export default formbodyPlugin;
