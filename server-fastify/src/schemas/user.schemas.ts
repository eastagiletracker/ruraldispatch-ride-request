import { z } from 'zod';

/**
 * User (Service User) Validation Schemas
 * Defines Zod schemas for user routes (riders, caregivers)
 */

// ==================== COMMON SCHEMAS ====================

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const phoneNumberSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164 format expected)')
  .trim();

export const optionalPhoneNumberSchema = phoneNumberSchema.optional().nullable();

export const addressSchema = z
  .string()
  .min(5, 'Address must be at least 5 characters')
  .max(500, 'Address must not exceed 500 characters')
  .trim()
  .optional()
  .nullable();

export const dateTimeSchema = z
  .string()
  .datetime('Invalid ISO 8601 datetime format')
  .or(z.date())
  .transform((val) => (typeof val === 'string' ? new Date(val) : val));

// ==================== CREATE USER SCHEMA ====================

export const createUserSchema = z.object({
  // Required fields
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must not exceed 100 characters')
    .trim(),
  phone: phoneNumberSchema,

  // Optional contact information
  email: z.string().email('Invalid email format').optional().nullable(),
  address: addressSchema,

  // Optional relationships
  organizationUuid: uuidSchema.optional().nullable(),
  caregiverUuid: uuidSchema.optional().nullable(),

  // SMS consent tracking
  smsConsent: z
    .object({
      given: z.boolean(),
      timestamp: z.string().datetime().optional(),
      ipAddress: z.string().ip().optional().nullable(),
    })
    .optional()
    .nullable(),

  // Additional metadata
  notes: z.string().max(1000).trim().optional().nullable(),
  isActive: z.boolean().default(true),
});

// ==================== UPDATE USER SCHEMA ====================

export const updateUserSchema = z.object({
  fullName: z.string().min(1).max(100).trim().optional(),
  phone: phoneNumberSchema.optional(),
  email: z.string().email().optional().nullable(),
  address: addressSchema,
  organizationUuid: uuidSchema.optional().nullable(),
  caregiverUuid: uuidSchema.optional().nullable(),
  smsConsent: z
    .object({
      given: z.boolean(),
      timestamp: z.string().datetime().optional(),
      ipAddress: z.string().ip().optional().nullable(),
    })
    .optional()
    .nullable(),
  notes: z.string().max(1000).trim().optional().nullable(),
  isActive: z.boolean().optional(),
});

// ==================== SMS CONSENT SCHEMA ====================

export const smsConsentSchema = z.object({
  phoneNumber: phoneNumberSchema,
  consentGiven: z.boolean(),
  timestamp: z.string().datetime().optional(),
  ipAddress: z.string().ip().optional().nullable(),
});

// ==================== PARAMS SCHEMAS ====================

export const userIdParamSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
});

export const userUuidParamSchema = z.object({
  uuid: uuidSchema,
});

export const searchTermParamSchema = z.object({
  searchTerm: z.string().min(1, 'Search term is required').max(100).trim(),
});

export const fieldsParamSchema = z.object({
  fields: z
    .string()
    .min(1, 'Fields parameter is required')
    .regex(/^[a-zA-Z0-9_]+(,[a-zA-Z0-9_]+)*$/, 'Fields must be comma-separated field names'),
});

export const userFieldsParamSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  fields: z
    .string()
    .min(1, 'Fields parameter is required')
    .regex(/^[a-zA-Z0-9_]+(,[a-zA-Z0-9_]+)*$/, 'Fields must be comma-separated field names'),
});

// ==================== RESPONSE SCHEMAS ====================

export const userResponseSchema = z.object({
  uuid: uuidSchema,
  fullName: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  organizationUuid: uuidSchema.nullable(),
  caregiverUuid: uuidSchema.nullable(),
  smsConsent: z
    .object({
      given: z.boolean(),
      timestamp: z.string(),
      ipAddress: z.string().nullable(),
    })
    .nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const usersListResponseSchema = z.object({
  success: z.boolean(),
  users: z.array(userResponseSchema),
});

export const userCreatedResponseSchema = z.object({
  success: z.boolean(),
  user: userResponseSchema,
  message: z.string().optional(),
});

export const smsConsentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  result: z.unknown(),
});

// ==================== TYPE EXPORTS ====================

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SMSConsentInput = z.infer<typeof smsConsentSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type UserUuidParam = z.infer<typeof userUuidParamSchema>;
export type SearchTermParam = z.infer<typeof searchTermParamSchema>;
export type FieldsParam = z.infer<typeof fieldsParamSchema>;
export type UserFieldsParam = z.infer<typeof userFieldsParamSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type UsersListResponse = z.infer<typeof usersListResponseSchema>;
export type UserCreatedResponse = z.infer<typeof userCreatedResponseSchema>;
export type SMSConsentResponse = z.infer<typeof smsConsentResponseSchema>;
