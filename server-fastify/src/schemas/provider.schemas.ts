import { z } from 'zod/v4';

/**
 * Service Provider (Driver) Validation Schemas
 * Defines Zod schemas for provider routes
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

// ==================== CREATE PROVIDER SCHEMA ====================

export const createProviderSchema = z.object({
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

  // Organization/Company information
  organizationName: z.string().max(200).trim().optional().nullable(),
  organizationUuid: uuidSchema.optional().nullable(),

  // Driver license and certification
  licenseNumber: z
    .string()
    .min(5, 'License number must be at least 5 characters')
    .max(50)
    .trim()
    .optional()
    .nullable(),
  licenseExpiration: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val))
    .optional()
    .nullable(),

  // Availability
  isAvailable: z.boolean().default(true),
  isActive: z.boolean().default(true),

  // Additional metadata
  notes: z.string().max(1000).trim().optional().nullable(),
});

// ==================== UPDATE PROVIDER SCHEMA ====================

export const updateProviderSchema = z.object({
  fullName: z.string().min(1).max(100).trim().optional(),
  phone: phoneNumberSchema.optional(),
  email: z.email().optional().nullable(),
  address: addressSchema,
  organizationName: z.string().max(200).trim().optional().nullable(),
  organizationUuid: uuidSchema.optional().nullable(),
  licenseNumber: z.string().min(5).max(50).trim().optional().nullable(),
  licenseExpiration: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val))
    .optional()
    .nullable(),
  isAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(1000).trim().optional().nullable(),
});

// ==================== PARAMS SCHEMAS ====================

export const providerIdParamSchema = z.object({
  id: z.string().min(1, 'Provider ID is required'),
});

export const providerUuidParamSchema = z.object({
  uuid: uuidSchema,
});

export const searchTermParamSchema = z.object({
  searchTerm: z.string().min(1, 'Search term is required').max(100).trim(),
});

// ==================== RESPONSE SCHEMAS ====================

export const providerResponseSchema = z.object({
  uuid: uuidSchema,
  fullName: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  organizationName: z.string().nullable(),
  organizationUuid: uuidSchema.nullable(),
  licenseNumber: z.string().nullable(),
  licenseExpiration: z.date().nullable(),
  isAvailable: z.boolean(),
  isActive: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const providersListResponseSchema = z.object({
  success: z.boolean(),
  serviceProviders: z.array(providerResponseSchema),
});

export const providerCreatedResponseSchema = z.object({
  success: z.boolean(),
  provider: providerResponseSchema,
  message: z.string().optional(),
});

export const providerDeletedResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  result: z.unknown(),
});

// ==================== TYPE EXPORTS ====================

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
export type ProviderIdParam = z.infer<typeof providerIdParamSchema>;
export type ProviderUuidParam = z.infer<typeof providerUuidParamSchema>;
export type SearchTermParam = z.infer<typeof searchTermParamSchema>;
export type ProviderResponse = z.infer<typeof providerResponseSchema>;
export type ProvidersListResponse = z.infer<typeof providersListResponseSchema>;
export type ProviderCreatedResponse = z.infer<typeof providerCreatedResponseSchema>;
export type ProviderDeletedResponse = z.infer<typeof providerDeletedResponseSchema>;
