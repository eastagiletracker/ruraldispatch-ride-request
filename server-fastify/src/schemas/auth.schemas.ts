import { z } from 'zod/v4';

/**
 * Authentication & System User Validation Schemas
 * Defines Zod schemas for auth routes
 */

// ==================== LOGIN SCHEMAS ====================

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .trim(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must not exceed 100 characters'),
});

export const loginResponseSchema = z.object({
  success: z.boolean(),
  user: z
    .object({
      uuid: z.uuid(),
      username: z.string(),
      fullName: z.string(),
      role: z.enum(['admin', 'dispatcher', 'driver', 'case_manager']),
      isActive: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })
    .optional(),
  message: z.string().optional(),
});

// ==================== SYSTEM USER SCHEMAS ====================

export const systemUserRoleSchema = z.enum(['admin', 'dispatcher', 'driver', 'case_manager']);

export const createSystemUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must not exceed 100 characters')
    .trim(),
  role: systemUserRoleSchema,
  isActive: z.boolean().default(true),
});

export const updateSystemUserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  password: z
    .string()
    .min(8)
    .max(100)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .optional(),
  fullName: z.string().min(1).max(100).trim().optional(),
  role: systemUserRoleSchema.optional(),
  isActive: z.boolean().optional(),
});

export const systemUserResponseSchema = z.object({
  uuid: z.string().uuid(),
  username: z.string(),
  fullName: z.string(),
  role: systemUserRoleSchema,
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // passwordHash excluded from response
});

export const systemUsersListResponseSchema = z.object({
  success: z.boolean(),
  users: z.array(systemUserResponseSchema),
});

// ==================== PARAMS SCHEMAS ====================

export const uuidParamSchema = z.object({
  uuid: z.string().uuid('Invalid UUID format'),
});

// ==================== QUERY SCHEMAS ====================

export const roleQuerySchema = z.object({
  role: systemUserRoleSchema.optional(),
});

// ==================== STATUS UPDATE SCHEMA ====================

export const toggleStatusSchema = z.object({
  isActive: z.boolean(),
});

// ==================== STANDARD RESPONSE SCHEMAS ====================

export const successResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  result: z.unknown().optional(),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  details: z.unknown().optional(),
});

// ==================== TYPE EXPORTS ====================

export type LoginInput = z.infer<typeof loginSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type CreateSystemUserInput = z.infer<typeof createSystemUserSchema>;
export type UpdateSystemUserInput = z.infer<typeof updateSystemUserSchema>;
export type SystemUserResponse = z.infer<typeof systemUserResponseSchema>;
export type SystemUsersListResponse = z.infer<typeof systemUsersListResponseSchema>;
export type UuidParam = z.infer<typeof uuidParamSchema>;
export type RoleQuery = z.infer<typeof roleQuerySchema>;
export type ToggleStatusInput = z.infer<typeof toggleStatusSchema>;
export type SuccessResponse = z.infer<typeof successResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
