/**
 * API Library - Centralized exports
 *
 * This is the main entry point for all API-related functionality.
 * Import from '@/lib/api' to access any API function or hook.
 */

// Base hooks
export { useApiMutation, useFetch } from './base';
// Configuration
export { getApiInfo, getApiUrl, isUsingProxy } from './config';
// Rides
export { useRideRequests } from './rides';

// Service Providers
export {
  useCreateServiceProvider,
  useDeleteServiceProvider,
  useServiceProviders,
  useUpdateServiceProvider,
} from './service-providers';
// System Users
export { useSystemUsers } from './system-users';
// Users
export {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from './users';
// Vehicles
export {
  useCreateVehicle,
  useDeleteVehicle,
  useUpdateVehicle,
  useVehicles,
} from './vehicles';
