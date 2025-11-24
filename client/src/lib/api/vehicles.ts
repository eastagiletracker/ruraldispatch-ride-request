import { useApiMutation, useFetch } from './base';

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return sessionStorage.getItem('user_authenticated') === 'true';
}

/**
 * Fetch vehicles
 */
export function useVehicles() {
  return useFetch<any[]>('/api/vehicles', {
    staleTime: 1000 * 60 * 2,
    enabled: isAuthenticated(),
  });
}

/**
 * Create vehicle
 */
export function useCreateVehicle() {
  return useApiMutation('/api/vehicles', 'POST');
}

/**
 * Update vehicle
 */
export function useUpdateVehicle(vehicleId: string) {
  return useApiMutation(`/api/vehicles/${vehicleId}`, 'PUT');
}

/**
 * Delete vehicle
 */
export function useDeleteVehicle() {
  return useApiMutation('/api/vehicles', 'DELETE');
}
