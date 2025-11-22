/**
 * SystemUser Schema - Shared between Frontend and Backend
 * Using Zod v4 for runtime validation and type inference
 */

import { z } from 'zod/v4';

/**
 * Complete SystemUser Schema (database model)
 * Matches Prisma model SystemUser
 */
export const systemUserSchema = z.object({
  uuid: z.string(),
  username: z.string(),
  passwordHash: z.string().optional(), // Not sent to frontend
  fullName: z.string(),
  role: z.string(), // 'admin', 'dispatcher', 'driver', 'case_manager'
  isActive: z.boolean().optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

/**
 * Inferred TypeScript Type
 */
export type SystemUser = z.infer<typeof systemUserSchema>;
