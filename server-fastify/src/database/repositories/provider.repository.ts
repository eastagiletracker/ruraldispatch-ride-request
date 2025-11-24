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
  title?: string | null;
  role?: string | null;
  organization?: string | null;
  faxPhone?: string | null;
  specializations?: string | null;
  serviceProviderRole?: string | null;
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
      // Look up organization by name if provided
      let organizationId: number | undefined = undefined;
      if (provider.organization) {
        const org = await prisma.organization.findFirst({
          where: { name: provider.organization },
        });
        organizationId = org?.id || undefined;
      }

      return await prisma.serviceProvider.create({
        data: {
          uuid: provider.uuid,
          fullName: provider.fullName,
          phone: provider.phone || undefined,
          mobilePhone: provider.mobilePhone || undefined,
          title: provider.title || undefined,
          role: provider.serviceProviderRole || provider.role || undefined,
          organizationId,
        },
        include: {
          organization: true,
        },
      });
    },

    /**
     * Update a provider
     */
    updateProvider: async (
      uuid: string,
      data: Partial<ProviderInput & { title?: string; role?: string; organizationId?: number }>
    ): Promise<ServiceProvider> => {
      let organizationIdUpdate: number | null | undefined = undefined;

      if (Object.prototype.hasOwnProperty.call(data, 'organization')) {
        if (data.organization) {
          const org = await prisma.organization.findFirst({
            where: { name: data.organization },
          });
          organizationIdUpdate = org?.id ?? null;
        } else {
          organizationIdUpdate = null;
        }
      } else if (Object.prototype.hasOwnProperty.call(data, 'organizationId')) {
        organizationIdUpdate = data.organizationId ?? null;
      }

      const roleUpdate = data.serviceProviderRole ?? data.role;

      return await prisma.serviceProvider.update({
        where: { uuid },
        data: {
          ...(data.fullName !== undefined && { fullName: data.fullName }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.mobilePhone !== undefined && { mobilePhone: data.mobilePhone }),
          ...(data.title !== undefined && { title: data.title }),
          ...(roleUpdate !== undefined && { role: roleUpdate }),
          ...(organizationIdUpdate !== undefined && { organizationId: organizationIdUpdate }),
        },
        include: {
          organization: true,
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
