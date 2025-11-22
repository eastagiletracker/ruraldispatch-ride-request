// Barrel file - re-exports all types
// Now uses shared Zod schemas for type inference

// Re-export types from shared schemas (Zod-inferred types)
export type {
  AccessibilityNeed,
  DisabilityStatusOption,
  MaritalStatusOption,
  Organization,
  RaceOption,
  // Ride Request
  RideRequest,
  RideRequestFormData,
  RideRequestType,
  // Service Provider
  ServiceProvider,
  ServiceProviderFormData,
  ServiceProviderRole,
  ServiceUserRole,
  // Auth
  SignInFormData,
  Specialization,
  // User
  User,
  UserFormData,
  // Vehicle
  Vehicle,
  VehicleFormData,
  VeteranStatusOption,
} from '@shared/schemas';
export type {
  ApiResponse,
  Document,
} from './api';
// Form types
export type {
  DriverSearchProps,
  FormComponentProps,
  FormErrors,
  RideRequestFormProps,
  SearchableElement,
  SearchProps,
  UserSearchProps,
  VehicleSearchProps,
} from './form';
// Keep non-schema types from original files
export type {
  CloseSessionResponse,
  MessageDirection,
  Notification,
  NotificationStats,
  NotificationType,
  RecipientRole,
  TwilioStatus,
} from './notification';
