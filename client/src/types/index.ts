// Barrel file - re-exports all types from individual files
// This maintains backward compatibility with existing imports from '@/types'

// User types
export type {
  User,
  RaceOption,
  MaritalStatusOption,
  VeteranStatusOption,
  DisabilityStatusOption,
  ServiceUserRole
} from './user';

// Service Provider types
export type {
  ServiceProvider,
  ServiceProviderRole,
  Specialization,
  Organization
} from './serviceProvider';

// Vehicle types
export type {
  Vehicle,
  AccessibilityNeed
} from './vehicle';

// Ride Request types
export type {
  RideRequest,
  RideRequestType
} from './rideRequest';

// Notification types
export type {
  Notification,
  NotificationType,
  MessageDirection,
  RecipientRole,
  TwilioStatus,
  NotificationStats,
  CloseSessionResponse
} from './notification';

// API types
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

