import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

/**
 * Prisma Client Singleton
 * Uses PostgreSQL adapter for better performance
 */
let prismaClient: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    // Create PostgreSQL connection pool
    const pool = new Pool({
      connectionString: env.DATABASE_URL,
    });

    // Create Prisma adapter
    const adapter = new PrismaPg(pool);
    prismaClient = new PrismaClient({ adapter });

    console.log('🔌 Connected to PostgreSQL via Prisma 7');
  }

  return prismaClient;
}

/**
 * Disconnect Prisma Client
 * Call this on application shutdown
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
    console.log('📴 Disconnected from PostgreSQL');
  }
}

/**
 * Export the Prisma client instance
 */
export const prisma = getPrismaClient();
