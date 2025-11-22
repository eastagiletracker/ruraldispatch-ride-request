/**
 * Vehicle Schema - Shared between Frontend and Backend
 * Using Zod v4 for runtime validation and type inference
 */

import { z } from 'zod/v4';

/**
 * Accessibility Needs Options
 */
export const AccessibilityNeeds = [
  'None',
  'Walker Accessible',
  'Wheelchair Accessible',
  'Oxygen Tank Accessible',
] as const;

/**
 * Complete Vehicle Schema (database model)
 */
export const vehicleSchema = z.object({
  uuid: z.string(),
  displayName: z.string().min(1, 'Display name is required').trim(),
  fleetId: z.string().min(1, 'Fleet ID is required').trim(),
  capacity: z.coerce
    .number()
    .int('Capacity must be a whole number')
    .positive('Capacity must be greater than zero'),
  serviceArea: z.string().min(1, 'Service area is required').trim(),
  accessibilityFeatures: z.string().min(1, 'Accessibility features are required').trim(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

/**
 * Vehicle Form Schema (for creating/editing vehicles)
 */
export const vehicleFormSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').trim(),
  fleetId: z.string().min(1, 'Fleet ID is required').trim(),
  capacity: z
    .number()
    .int('Capacity must be a whole number')
    .positive('Capacity must be greater than zero'),
  serviceArea: z.string().min(1, 'Service area is required').trim(),
  accessibilityFeatures: z.string().min(1, 'Accessibility features are required').trim(),
});

/**
 * Inferred TypeScript Types
 */
export type Vehicle = z.infer<typeof vehicleSchema>;
export type VehicleFormData = z.infer<typeof vehicleFormSchema>;
export type AccessibilityNeed = (typeof AccessibilityNeeds)[number];
