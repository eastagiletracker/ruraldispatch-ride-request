/**
 * System User Repository
 * Handles all system user authentication and management operations
 */

import type { PrismaClient } from '../../../../prisma/generated/client/client.js';
import type { SystemUser } from '../../../../prisma/generated/client/client.js';
import bcrypt from 'bcryptjs';

// ==================== TYPE DEFINITIONS ====================

/**
 * System user authentication result
 */
interface AuthResult {
  success: boolean;
  message?: string;
  user?: Omit<SystemUser, 'passwordHash'>;
}

/**
 * System user input for creating new system users
 */
interface SystemUserInput {
  uuid: string;
  username: string;
  password: string;
  fullName: string;
  role: string;
  isActive?: boolean;
}

/**
 * System user update data
 */
interface SystemUserUpdateInput {
  username?: string;
  password?: string;
  fullName?: string;
  role?: string;
  isActive?: boolean;
  passwordHash?: string;
}

// ==================== REPOSITORY ====================

export function createSystemUserRepository(prisma: PrismaClient) {
  return {
    /**
     * Get all system users
     */
    getAllSystemUsers: async (): Promise<SystemUser[]> => {
      return await prisma.systemUser.findMany({
        orderBy: {
          username: 'asc',
        },
      });
    },

    /**
     * Get system user by username
     */
    getSystemUserByUsername: async (username: string): Promise<SystemUser | null> => {
      return await prisma.systemUser.findUnique({
        where: { username },
      });
    },

    /**
     * Get system user by UUID
     */
    getSystemUserByUuid: async (uuid: string): Promise<SystemUser | null> => {
      return await prisma.systemUser.findUnique({
        where: { uuid },
      });
    },

    /**
     * Get system users by role
     */
    getSystemUsersByRole: async (role: string): Promise<SystemUser[]> => {
      return await prisma.systemUser.findMany({
        where: { role },
        orderBy: {
          username: 'asc',
        },
      });
    },

    /**
     * Create a new system user with hashed password
     */
    createSystemUser: async (userData: SystemUserInput): Promise<SystemUser> => {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      return await prisma.systemUser.create({
        data: {
          uuid: userData.uuid,
          username: userData.username,
          passwordHash: hashedPassword,
          fullName: userData.fullName,
          role: userData.role,
          isActive: userData.isActive !== undefined ? userData.isActive : true,
        },
      });
    },

    /**
     * Authenticate system user with username and password
     */
    authenticateSystemUser: async (username: string, password: string): Promise<AuthResult> => {
      const user = await prisma.systemUser.findUnique({
        where: { username },
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid username or password',
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is deactivated',
        };
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return {
          success: false,
          message: 'Invalid username or password',
        };
      }

      // Return user without password hash
      const { passwordHash, ...userWithoutPassword } = user;
      return {
        success: true,
        user: userWithoutPassword,
      };
    },

    /**
     * Update system user
     */
    updateSystemUser: async (
      uuid: string,
      updateData: SystemUserUpdateInput
    ): Promise<SystemUser> => {
      const data: any = { ...updateData };

      // Hash password if being updated
      if (data.password) {
        data.passwordHash = await bcrypt.hash(data.password, 10);
        delete data.password;
      }

      return await prisma.systemUser.update({
        where: { uuid },
        data,
      });
    },

    /**
     * Update system user active status
     */
    updateSystemUserStatus: async (uuid: string, isActive: boolean): Promise<SystemUser> => {
      return await prisma.systemUser.update({
        where: { uuid },
        data: { isActive },
      });
    },

    /**
     * Deactivate system user
     */
    deactivateSystemUser: async (uuid: string): Promise<SystemUser> => {
      return await prisma.systemUser.update({
        where: { uuid },
        data: { isActive: false },
      });
    },

    /**
     * Activate system user
     */
    activateSystemUser: async (uuid: string): Promise<SystemUser> => {
      return await prisma.systemUser.update({
        where: { uuid },
        data: { isActive: true },
      });
    },

    /**
     * Delete system user
     */
    deleteSystemUser: async (uuid: string): Promise<SystemUser> => {
      return await prisma.systemUser.delete({
        where: { uuid },
      });
    },
  };
}

export type SystemUserRepository = ReturnType<typeof createSystemUserRepository>;
