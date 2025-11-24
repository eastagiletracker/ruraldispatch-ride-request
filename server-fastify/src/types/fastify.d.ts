/**
 * Fastify Type Augmentations
 * Extends Fastify types with custom decorators
 */

import 'fastify';
import type { DatabaseAPI } from '../database/api.js';

declare module 'fastify' {
  interface FastifyInstance {
    database: DatabaseAPI;
  }
}
