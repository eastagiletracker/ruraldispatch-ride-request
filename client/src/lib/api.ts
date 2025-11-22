/**
 * Legacy API file - re-exports from the new modular structure
 *
 * This file is kept for backward compatibility with existing imports.
 * All API functionality has been moved to the modular structure in ./api/
 */

// Base hooks
export { useApiMutation, useFetch } from './api/base';
// Configuration
export { getApiInfo, getApiUrl, isUsingProxy } from './api/config';
// Ride Requests
export { useRideRequests } from './api/rides';

// Service Providers
export {
  useCreateServiceProvider,
  useDeleteServiceProvider,
  useServiceProviders,
  useUpdateServiceProvider,
} from './api/service-providers';
// System Users
export { useSystemUsers } from './api/system-users';
// Users
export {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from './api/users';
// Vehicles
export {
  useCreateVehicle,
  useDeleteVehicle,
  useUpdateVehicle,
  useVehicles,
} from './api/vehicles';
