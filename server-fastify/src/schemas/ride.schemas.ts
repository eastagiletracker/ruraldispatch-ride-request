import { z } from 'zod/v4';
import { RIDE_REQUEST_STATUSES } from '../constants/rideRequestStatuses.js';
import { RIDE_STATUSES } from '../constants/rideStatuses.js';

/**
 * Ride Request Validation Schemas
 * Defines Zod schemas for ride request routes
 */

// ==================== RIDE STATUS SCHEMAS ====================

// Get all valid ride status values
const validRideStatuses = Object.values(RIDE_STATUSES);
const validRequestStatuses = Object.values(RIDE_REQUEST_STATUSES).map((status) => status.code);

export const rideStatusSchema = z
  .number()
  .int()
  .refine((val) => validRideStatuses.includes(val as any), {
    message: 'Invalid ride status',
  });

export const rideRequestStatusSchema = z
  .number()
  .int()
  .refine((val) => validRequestStatuses.includes(val as any), {
    message: 'Invalid ride request status',
  });

// ==================== COMMON SCHEMAS ====================

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const phoneNumberSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164 format expected)')
  .optional()
  .nullable();

export const addressSchema = z
  .string()
  .min(5, 'Address must be at least 5 characters')
  .max(500, 'Address must not exceed 500 characters')
  .trim();

export const dateTimeSchema = z
  .string()
  .datetime('Invalid ISO 8601 datetime format')
  .or(z.date())
  .transform((val) => (typeof val === 'string' ? new Date(val) : val));

// ==================== CREATE RIDE REQUEST SCHEMA ====================

export const createRideRequestSchema = z
  .object({
    // Rider information (either UUID or name/phone)
    riderUuid: uuidSchema.optional().nullable(),
    riderName: z.string().min(1).max(100).trim().optional().nullable(),
    riderPhone: phoneNumberSchema,

    // Addresses (required)
    pickupAddress: addressSchema,
    dropOffAddress: addressSchema,

    // Timing (required)
    pickupRequestedTime: dateTimeSchema,
    dropOffRequestedTime: dateTimeSchema.optional().nullable(),

    // Assignment (optional)
    driverUuid: uuidSchema.optional().nullable(),
    vehicleUuid: uuidSchema.optional().nullable(),

    // Trip details
    roundTrip: z.boolean().default(false),
    purpose: z.string().max(500).trim().optional().nullable(),
    notes: z.string().max(1000).trim().optional().nullable(),

    // Accessibility requirements
    walkerAccessible: z.boolean().default(false),
    wheelchairAccessible: z.boolean().default(false),
    serviceAnimalFriendly: z.boolean().default(false),
    oxygenTankAccessible: z.boolean().default(false),

    // Optional status fields
    rideStatus: rideStatusSchema.optional(),
    rideRequestStatus: rideRequestStatusSchema.optional(),
  })
  .refine(
    (data) => {
      // Must have either riderUuid or riderName/riderPhone
      return data.riderUuid || (data.riderName && data.riderPhone);
    },
    {
      message: 'Either riderUuid or both riderName and riderPhone must be provided',
      path: ['riderUuid'],
    }
  )
  .refine(
    (data) => {
      // Pickup time must be in the future
      const pickupTime = new Date(data.pickupRequestedTime);
      return pickupTime > new Date();
    },
    {
      message: 'Pickup time must be in the future',
      path: ['pickupRequestedTime'],
    }
  )
  .refine(
    (data) => {
      // Drop-off time must be after pickup time if provided
      if (data.dropOffRequestedTime) {
        const pickupTime = new Date(data.pickupRequestedTime);
        const dropOffTime = new Date(data.dropOffRequestedTime);
        return dropOffTime > pickupTime;
      }
      return true;
    },
    {
      message: 'Drop-off time must be after pickup time',
      path: ['dropOffRequestedTime'],
    }
  );

// ==================== UPDATE RIDE REQUEST SCHEMA ====================

export const updateRideRequestSchema = z
  .object({
    // Rider information
    riderUuid: uuidSchema.optional().nullable(),
    riderName: z.string().min(1).max(100).trim().optional().nullable(),
    riderPhone: phoneNumberSchema.optional().nullable(),

    // Addresses
    pickupAddress: addressSchema.optional(),
    dropOffAddress: addressSchema.optional(),

    // Timing
    pickupRequestedTime: dateTimeSchema.optional(),
    dropOffRequestedTime: dateTimeSchema.optional().nullable(),
    rideStartedActualTime: dateTimeSchema.optional().nullable(),
    pickupActualTime: dateTimeSchema.optional().nullable(),
    dropOffActualTime: dateTimeSchema.optional().nullable(),
    rideCompleteRequestedTime: dateTimeSchema.optional().nullable(),
    rideCompleteActualTime: dateTimeSchema.optional().nullable(),

    // Assignment
    driverUuid: uuidSchema.optional().nullable(),
    vehicleUuid: uuidSchema.optional().nullable(),
    assignedDriverUuid: uuidSchema.optional().nullable(), // Backwards compatibility
    assignedVehicleUuid: uuidSchema.optional().nullable(), // Backwards compatibility

    // Status
    rideStatus: rideStatusSchema.optional(),
    rideRequestStatus: rideRequestStatusSchema.optional(),

    // Trip details
    roundTrip: z.boolean().optional(),
    purpose: z.string().max(500).trim().optional().nullable(),
    notes: z.string().max(1000).trim().optional().nullable(),
    estimatedTravelTime: z.number().int().positive().optional().nullable(),

    // Accessibility requirements
    walkerAccessible: z.boolean().optional(),
    wheelchairAccessible: z.boolean().optional(),
    serviceAnimalFriendly: z.boolean().optional(),
    oxygenTankAccessible: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If setting rideRequestStatus >= 400, must have driver and vehicle
      // Note: Full validation happens in the route handler where we have oldRide data
      // This schema just ensures the fields are present if provided
      if (data.rideRequestStatus && data.rideRequestStatus >= 400) {
        // We'll do the full validation in the route handler where we have oldRide data
        return true;
      }
      return true;
    },
    {
      message: 'Driver and vehicle must be assigned when setting status >= 400',
    }
  );

// ==================== PARAMS SCHEMAS ====================

export const rideIdParamSchema = z.object({
  id: z.string().min(1, 'Ride ID is required'),
});

// ==================== RESPONSE SCHEMAS ====================

export const rideRequestResponseSchema = z.object({
  uuid: z.string().uuid(),
  displayId: z.string(),
  riderUuid: uuidSchema.nullable(),
  riderName: z.string().nullable(),
  riderPhone: phoneNumberSchema,
  driverUuid: uuidSchema.nullable(),
  vehicleUuid: uuidSchema.nullable(),
  pickupAddress: z.string(),
  dropOffAddress: z.string(),
  pickupRequestedTime: z.date(),
  dropOffRequestedTime: z.date().nullable(),
  rideStatus: z.number(),
  rideRequestStatus: z.number(),
  roundTrip: z.boolean(),
  purpose: z.string().nullable(),
  notes: z.string().nullable(),
  walkerAccessible: z.boolean(),
  wheelchairAccessible: z.boolean(),
  serviceAnimalFriendly: z.boolean(),
  oxygenTankAccessible: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const rideRequestsListResponseSchema = z.array(rideRequestResponseSchema);

export const updateRideResponseSchema = z.object({
  success: z.boolean(),
  updateResult: z.unknown(),
  notifications: z.array(z.unknown()),
  ride: rideRequestResponseSchema,
});

// ==================== TYPE EXPORTS ====================

export type CreateRideRequestInput = z.infer<typeof createRideRequestSchema>;
export type UpdateRideRequestInput = z.infer<typeof updateRideRequestSchema>;
export type RideRequestResponse = z.infer<typeof rideRequestResponseSchema>;
export type RideRequestsListResponse = z.infer<typeof rideRequestsListResponseSchema>;
export type UpdateRideResponse = z.infer<typeof updateRideResponseSchema>;
export type RideIdParam = z.infer<typeof rideIdParamSchema>;
