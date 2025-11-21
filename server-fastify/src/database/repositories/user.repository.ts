/**
 * User Repository
 * Handles all service user (rider) database operations
 */

import type { PrismaClient, User } from '@prisma/client';

// ==================== TYPE DEFINITIONS ====================

/**
 * SMS consent data
 */
interface SMSConsentData {
  given: boolean;
  timestamp?: Date | string;
  ipAddress?: string;
}

/**
 * User input for creating new users
 */
interface UserInput {
  uuid: string;
  fullName: string;
  phone: string;
  serviceUserRole?: string[];
  role?: string;
  smsConsent?: {
    given: boolean;
    timestamp?: Date | string;
    ipAddress?: string;
  };
  smsConsentGiven?: boolean;
  smsConsentTimestamp?: Date | string;
  smsConsentIpAddress?: string;
}

// ==================== REPOSITORY ====================

export function createUserRepository(prisma: PrismaClient) {
  return {
    /**
     * Get a single user by UUID
     */
    getUser: async (uuid: string): Promise<User | null> => {
      return await prisma.user.findUnique({
        where: { uuid },
      });
    },

    /**
     * Get all users
     */
    getUsers: async (): Promise<User[]> => {
      return await prisma.user.findMany({
        orderBy: {
          fullName: 'asc',
        },
      });
    },

    /**
     * Get specific fields of a user
     */
    getSpecifiedFieldsOfUser: async (
      uuid: string,
      fields: string[]
    ): Promise<Partial<User> | null> => {
      const select = fields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as any);

      return await prisma.user.findUnique({
        where: { uuid },
        select,
      });
    },

    /**
     * Get specific fields of all users
     */
    getSpecifiedFieldsOfUsers: async (fields: string[]): Promise<Partial<User>[]> => {
      const select = fields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as any);

      return await prisma.user.findMany({
        select,
      });
    },

    /**
     * Add a new user
     */
    addUser: async (user: UserInput): Promise<User> => {
      return await prisma.user.create({
        data: {
          uuid: user.uuid,
          fullName: user.fullName,
          phone: user.phone,
          role: user.serviceUserRole?.[0] || user.role || 'rider',
          smsConsentGiven: user.smsConsent?.given || user.smsConsentGiven || false,
          smsConsentTimestamp: user.smsConsent?.timestamp
            ? new Date(user.smsConsent.timestamp)
            : user.smsConsentTimestamp
              ? new Date(user.smsConsentTimestamp)
              : null,
          smsConsentIpAddress: user.smsConsent?.ipAddress || user.smsConsentIpAddress || null,
        },
      });
    },

    /**
     * Update user SMS consent
     */
    updateUserSMSConsent: async (phone: string, consentData: SMSConsentData): Promise<User> => {
      return await prisma.user.update({
        where: { phone },
        data: {
          smsConsentGiven: consentData.given,
          smsConsentTimestamp: consentData.timestamp ? new Date(consentData.timestamp) : new Date(),
          smsConsentIpAddress: consentData.ipAddress,
        },
      });
    },

    /**
     * Delete a user
     */
    deleteUser: async (uuid: string): Promise<User> => {
      return await prisma.user.delete({
        where: { uuid },
      });
    },

    /**
     * Fuzzy search for users by name or phone
     */
    fuzzyUserSearch: async (searchTerm: string): Promise<User[]> => {
      return await prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: searchTerm, mode: 'insensitive' } },
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

export type UserRepository = ReturnType<typeof createUserRepository>;
