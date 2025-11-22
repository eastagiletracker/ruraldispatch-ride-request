/**
 * API Library - Centralized exports
 * 
 * This is the main entry point for all API-related functionality.
 * Import from '@/lib/api' to access any API function or hook.
 */

// Configuration
export { getApiUrl, isUsingProxy, getApiInfo } from './config';

// Base hooks
export { useFetch, useApiMutation } from './base';

// Users
export { 
  useUsers, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser 
} from './users';

// Service Providers
export {
  useServiceProviders,
  useCreateServiceProvider,
  useUpdateServiceProvider,
  useDeleteServiceProvider,
} from './service-providers';

// Vehicles
export {
  useVehicles,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
} from './vehicles';

// System Users
export { useSystemUsers } from './system-users';

// Rides
export { useRideRequests } from './rides';
