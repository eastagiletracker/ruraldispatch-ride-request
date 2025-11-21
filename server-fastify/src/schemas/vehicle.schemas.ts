import { z } from 'zod/v4';

/**
 * Vehicle Validation Schemas
 * Defines Zod schemas for vehicle routes
 */

// ==================== COMMON SCHEMAS ====================

export const uuidSchema = z.string().uuid('Invalid UUID format');

// ==================== CREATE VEHICLE SCHEMA ====================

export const createVehicleSchema = z.object({
  // Vehicle identification
  make: z
    .string()
    .min(1, 'Vehicle make is required')
    .max(50, 'Make must not exceed 50 characters')
    .trim(),
  model: z
    .string()
    .min(1, 'Vehicle model is required')
    .max(50, 'Model must not exceed 50 characters')
    .trim(),
  year: z
    .number()
    .int()
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 2, 'Year cannot be more than 2 years in the future'),
  color: z.string().min(1).max(30).trim().optional().nullable(),

  // Registration
  licensePlate: z
    .string()
    .min(2, 'License plate must be at least 2 characters')
    .max(15, 'License plate must not exceed 15 characters')
    .trim()
    .toUpperCase(),
  vin: z
    .string()
    .length(17, 'VIN must be exactly 17 characters')
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN format (no I, O, or Q allowed)')
    .toUpperCase()
    .optional()
    .nullable(),

  // Ownership and assignment
  organizationUuid: uuidSchema.optional().nullable(),
  assignedDriverUuid: uuidSchema.optional().nullable(),

  // Capacity
  seatingCapacity: z
    .number()
    .int()
    .min(1, 'Seating capacity must be at least 1')
    .max(50, 'Seating capacity must not exceed 50')
    .default(4),
  wheelchairCapacity: z
    .number()
    .int()
    .min(0, 'Wheelchair capacity cannot be negative')
    .max(10, 'Wheelchair capacity must not exceed 10')
    .default(0),

  // Accessibility features
  walkerAccessible: z.boolean().default(false),
  wheelchairAccessible: z.boolean().default(false),
  serviceAnimalFriendly: z.boolean().default(true),
  oxygenTankAccessible: z.boolean().default(false),
  hasLift: z.boolean().default(false),
  hasRamp: z.boolean().default(false),

  // Status
  isActive: z.boolean().default(true),
  isAvailable: z.boolean().default(true),

  // Display name for UI
  displayName: z.string().max(100).trim().optional().nullable(),

  // Additional metadata
  notes: z.string().max(1000).trim().optional().nullable(),
});

// ==================== UPDATE VEHICLE SCHEMA ====================

export const updateVehicleSchema = z.object({
  make: z.string().min(1).max(50).trim().optional(),
  model: z.string().min(1).max(50).trim().optional(),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 2)
    .optional(),
  color: z.string().min(1).max(30).trim().optional().nullable(),
  licensePlate: z.string().min(2).max(15).trim().toUpperCase().optional(),
  vin: z
    .string()
    .length(17)
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/)
    .toUpperCase()
    .optional()
    .nullable(),
  organizationUuid: uuidSchema.optional().nullable(),
  assignedDriverUuid: uuidSchema.optional().nullable(),
  seatingCapacity: z.number().int().min(1).max(50).optional(),
  wheelchairCapacity: z.number().int().min(0).max(10).optional(),
  walkerAccessible: z.boolean().optional(),
  wheelchairAccessible: z.boolean().optional(),
  serviceAnimalFriendly: z.boolean().optional(),
  oxygenTankAccessible: z.boolean().optional(),
  hasLift: z.boolean().optional(),
  hasRamp: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  displayName: z.string().max(100).trim().optional().nullable(),
  notes: z.string().max(1000).trim().optional().nullable(),
});

// ==================== PARAMS SCHEMAS ====================

export const vehicleUuidParamSchema = z.object({
  uuid: uuidSchema,
});

export const searchTermParamSchema = z.object({
  searchTerm: z.string().min(1, 'Search term is required').max(100).trim(),
});

// ==================== RESPONSE SCHEMAS ====================

export const vehicleResponseSchema = z.object({
  uuid: uuidSchema,
  make: z.string(),
  model: z.string(),
  year: z.number(),
  color: z.string().nullable(),
  licensePlate: z.string(),
  vin: z.string().nullable(),
  organizationUuid: uuidSchema.nullable(),
  assignedDriverUuid: uuidSchema.nullable(),
  seatingCapacity: z.number(),
  wheelchairCapacity: z.number(),
  walkerAccessible: z.boolean(),
  wheelchairAccessible: z.boolean(),
  serviceAnimalFriendly: z.boolean(),
  oxygenTankAccessible: z.boolean(),
  hasLift: z.boolean(),
  hasRamp: z.boolean(),
  isActive: z.boolean(),
  isAvailable: z.boolean(),
  displayName: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const vehiclesListResponseSchema = z.object({
  success: z.boolean(),
  vehicles: z.array(vehicleResponseSchema),
});

export const vehicleCreatedResponseSchema = z.object({
  success: z.boolean(),
  vehicle: vehicleResponseSchema,
  message: z.string().optional(),
});

export const vehicleDeletedResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  result: z.unknown(),
});

// ==================== TYPE EXPORTS ====================

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleUuidParam = z.infer<typeof vehicleUuidParamSchema>;
export type SearchTermParam = z.infer<typeof searchTermParamSchema>;
export type VehicleResponse = z.infer<typeof vehicleResponseSchema>;
export type VehiclesListResponse = z.infer<typeof vehiclesListResponseSchema>;
export type VehicleCreatedResponse = z.infer<typeof vehicleCreatedResponseSchema>;
export type VehicleDeletedResponse = z.infer<typeof vehicleDeletedResponseSchema>;
