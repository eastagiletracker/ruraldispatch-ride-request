/**
 * Provider Repository
 * Handles all service provider (driver) database operations
 */

import type { PrismaClient, ServiceProvider } from '@prisma/client';

// ==================== TYPE DEFINITIONS ====================

/**
 * Provider input for creating new providers
 */
interface ProviderInput {
  uuid: string;
  fullName: string;
  phone?: string | null;
  mobilePhone?: string | null;
}

// ==================== REPOSITORY ====================

export function createProviderRepository(prisma: PrismaClient) {
  return {
    /**
     * Get a single provider by UUID
     */
    getProvider: async (uuid: string): Promise<ServiceProvider | null> => {
      return await prisma.serviceProvider.findUnique({
        where: { uuid },
        include: {
          organization: true,
        },
      });
    },

    /**
     * Get all providers
     */
    getProviders: async (): Promise<ServiceProvider[]> => {
      return await prisma.serviceProvider.findMany({
        include: {
          organization: true,
        },
        orderBy: {
          fullName: 'asc',
        },
      });
    },

    /**
     * Add a new provider
     */
    addProvider: async (provider: ProviderInput): Promise<ServiceProvider> => {
      return await prisma.serviceProvider.create({
        data: {
          uuid: provider.uuid,
          fullName: provider.fullName,
          phone: provider.phone || null,
          mobilePhone: provider.mobilePhone || null,
        },
      });
    },

    /**
     * Delete a provider
     */
    deleteProvider: async (uuid: string): Promise<ServiceProvider> => {
      return await prisma.serviceProvider.delete({
        where: { uuid },
      });
    },

    /**
     * Fuzzy search for providers by name or phone
     */
    fuzzyProviderSearch: async (searchTerm: string): Promise<ServiceProvider[]> => {
      return await prisma.serviceProvider.findMany({
        where: {
          OR: [
            { fullName: { contains: searchTerm, mode: 'insensitive' } },
            { mobilePhone: { contains: searchTerm } },
            { phone: { contains: searchTerm } },
          ],
        },
        orderBy: {
          fullName: 'asc',
        },
      });
    },
  };
}

export type ProviderRepository = ReturnType<typeof createProviderRepository>;
