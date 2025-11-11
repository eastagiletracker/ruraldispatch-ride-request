// Barrel file - re-exports all types
// Now uses shared Zod schemas for type inference

// Re-export types from shared schemas (Zod-inferred types)
export type {
  // User
  User,
  UserFormData,
  RaceOption,
  MaritalStatusOption,
  VeteranStatusOption,
  DisabilityStatusOption,
  ServiceUserRole,
  
  // Service Provider
  ServiceProvider,
  ServiceProviderFormData,
  ServiceProviderRole,
  Specialization,
  Organization,
  
  // Vehicle
  Vehicle,
  VehicleFormData,
  AccessibilityNeed,
  
  // Ride Request
  RideRequest,
  RideRequestFormData,
  RideRequestType,
  
  // Auth
  SignInFormData
} from '@shared/schemas';

// Keep non-schema types from original files
export type {
  Notification,
  NotificationType,
  MessageDirection,
  RecipientRole,
  TwilioStatus,
  NotificationStats,
  CloseSessionResponse
} from './notification';

export type {
  ApiResponse,
  Document
} from './api';

// Form types
export type {
  FormErrors,
  FormComponentProps,
  RideRequestFormProps,
  UserSearchProps,
  DriverSearchProps,
  VehicleSearchProps,
  SearchableElement,
  SearchProps
} from './form';

