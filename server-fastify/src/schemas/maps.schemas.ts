import { z } from 'zod/v4';

/**
 * Maps API Validation Schemas
 * Defines Zod schemas for Google Maps Distance Matrix API routes
 */

// ==================== ADDRESS VALIDATION ====================

export const addressSchema = z
  .string()
  .min(5, 'Address must be at least 5 characters')
  .max(500, 'Address must not exceed 500 characters')
  .trim();

// ==================== TRAVEL TIME REQUEST SCHEMA ====================

export const calculateTravelTimeSchema = z.object({
  origin: addressSchema,
  destination: addressSchema,
});

// ==================== TRAVEL TIME RESPONSE SCHEMA ====================

export const travelTimeResultSchema = z.object({
  durationMinutes: z.number().int().positive('Duration must be positive'),
  durationText: z.string(),
  durationSeconds: z.number().int().positive('Duration must be positive'),
  distanceText: z.string(),
  distanceMeters: z.number().int().nonnegative('Distance cannot be negative'),
  origin: z.string(),
  destination: z.string(),
});

// ==================== ERROR RESPONSE SCHEMAS ====================

export const mapsErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  hint: z.string().optional(),
});

// ==================== DISTANCE MATRIX API RESPONSE (for internal use) ====================

export const distanceMatrixElementSchema = z.object({
  status: z.string(),
  duration: z
    .object({
      text: z.string(),
      value: z.number(),
    })
    .optional(),
  duration_in_traffic: z
    .object({
      text: z.string(),
      value: z.number(),
    })
    .optional(),
  distance: z.object({
    text: z.string(),
    value: z.number(),
  }),
});

export const distanceMatrixResponseSchema = z.object({
  status: z.string(),
  error_message: z.string().optional(),
  rows: z.array(
    z.object({
      elements: z.array(distanceMatrixElementSchema),
    }),
  ),
  origin_addresses: z.array(z.string()),
  destination_addresses: z.array(z.string()),
});

// ==================== TYPE EXPORTS ====================

export type CalculateTravelTimeInput = z.infer<typeof calculateTravelTimeSchema>;
export type TravelTimeResult = z.infer<typeof travelTimeResultSchema>;
export type MapsErrorResponse = z.infer<typeof mapsErrorResponseSchema>;
export type DistanceMatrixElement = z.infer<typeof distanceMatrixElementSchema>;
export type DistanceMatrixResponse = z.infer<typeof distanceMatrixResponseSchema>;
