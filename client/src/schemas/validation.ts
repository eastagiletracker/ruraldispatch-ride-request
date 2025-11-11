/**
 * Validation Schemas
 * Re-exports shared schemas for frontend use
 * Shared schemas are defined in /shared/schemas for reuse in backend
 */

import { z } from 'zod/v4';

// Re-export all shared schemas and types
export {
  // Auth
  signInSchema,
  type SignInFormData,

  // User
  userSchema,
  userFormSchema,
  type User,
  type UserFormData,
  RaceOptions,
  MaritalStatusOptions,
  VeteranStatusOptions,
  DisabilityStatusOptions,
  ServiceUserRoles,
  type RaceOption,
  type MaritalStatusOption,
  type VeteranStatusOption,
  type DisabilityStatusOption,
  type ServiceUserRole,

  // Service Provider
  serviceProviderSchema,
  serviceProviderFormSchema,
  type ServiceProvider,
  type ServiceProviderFormData,
  Organizations,
  ServiceProviderRoles,
  Specializations,
  type Organization,
  type ServiceProviderRole,
  type Specialization,

  // Vehicle
  vehicleSchema,
  vehicleFormSchema,
  type Vehicle,
  type VehicleFormData,
  AccessibilityNeeds,
  type AccessibilityNeed,

  // Ride Request
  rideRequestSchema,
  rideRequestFormSchema,
  type RideRequest,
  type RideRequestFormData,
  RideRequestTypes,
  type RideRequestType
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
