/**
 * Legacy API file - re-exports from the new modular structure
 * 
 * This file is kept for backward compatibility with existing imports.
 * All API functionality has been moved to the modular structure in ./api/
 */

// Configuration
export { getApiUrl, isUsingProxy, getApiInfo } from './api/config';

// Base hooks
export { useFetch, useApiMutation } from './api/base';

// Users
export { 
  useUsers, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser 
} from './api/users';

// Service Providers
export {
  useServiceProviders,
  useCreateServiceProvider,
  useUpdateServiceProvider,
  useDeleteServiceProvider,
} from './api/service-providers';

// Vehicles
export {
  useVehicles,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
} from './api/vehicles';

// System Users
export { useSystemUsers } from './api/system-users';

// Ride Requests
export { useRideRequests } from './api/rides';
