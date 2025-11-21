/**
 * Database API Aggregator
 * Combines all repository modules into a single unified API
 *
 * This file provides a comprehensive, fully-typed database API layer
 * with backward compatibility for MongoDB field names.
 */

import type { PrismaClient } from '@prisma/client';
import { createRideRepository } from './repositories/ride.repository.js';
import { createUserRepository } from './repositories/user.repository.js';
import { createProviderRepository } from './repositories/provider.repository.js';
import { createVehicleRepository } from './repositories/vehicle.repository.js';
import { createNotificationRepository } from './repositories/notification.repository.js';
import { createSystemUserRepository } from './repositories/systemUser.repository.js';

/**
 * Create a fully-typed database API from a PrismaClient instance
 * Aggregates all repository modules into a single API
 */
export function createDatabaseApi(prisma: PrismaClient) {
  return {
    ...createRideRepository(prisma),
    ...createUserRepository(prisma),
    ...createProviderRepository(prisma),
    ...createVehicleRepository(prisma),
    ...createNotificationRepository(prisma),
    ...createSystemUserRepository(prisma),
  };
}

/**
 * Database API type - inferred from the createDatabaseApi function
 */
export type DatabaseAPI = ReturnType<typeof createDatabaseApi>;
