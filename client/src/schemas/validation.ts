/**
 * Validation Schemas
 * Re-exports shared schemas for frontend use
 * Shared schemas are defined in /shared/schemas for reuse in backend
 */

import type { z } from 'zod/v4';

// Re-export all shared schemas and types
export {
  type AccessibilityNeed,
  AccessibilityNeeds,
  type DisabilityStatusOption,
  DisabilityStatusOptions,
  type MaritalStatusOption,
  MaritalStatusOptions,
  type Organization,
  Organizations,
  type RaceOption,
  RaceOptions,
  type RideRequest,
  type RideRequestFormData,
  type RideRequestType,
  RideRequestTypes,
  rideRequestFormSchema,
  // Ride Request
  rideRequestSchema,
  type ServiceProvider,
  type ServiceProviderFormData,
  type ServiceProviderRole,
  ServiceProviderRoles,
  type ServiceUserRole,
  ServiceUserRoles,
  type SignInFormData,
  type Specialization,
  Specializations,
  serviceProviderFormSchema,
  // Service Provider
  serviceProviderSchema,
  // Auth
  signInSchema,
  type User,
  type UserFormData,
  userFormSchema,
  // User
  userSchema,
  type Vehicle,
  type VehicleFormData,
  type VeteranStatusOption,
  VeteranStatusOptions,
  vehicleFormSchema,
  // Vehicle
  vehicleSchema,
} from '@shared/schemas';

/**
 * Helper function to format Zod errors for form display
 */
export function formatZodErrors<T>(error: z.ZodError<T>): Record<string, string> {
  const formatted: Record<string, string> = {};
  error.issues.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });
  return formatted;
}
