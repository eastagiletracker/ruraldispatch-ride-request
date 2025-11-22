import { useFetch, useApiMutation } from './base';

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return sessionStorage.getItem('user_authenticated') === 'true';
}

/**
 * Fetch service providers
 */
export function useServiceProviders() {
  return useFetch<any[]>('/api/service-providers', {
    staleTime: 1000 * 60 * 2,
    enabled: isAuthenticated(),
  });
}

/**
 * Create service provider
 */
export function useCreateServiceProvider() {
  return useApiMutation('/api/service-providers', 'POST');
}

/**
 * Update service provider
 */
export function useUpdateServiceProvider(providerId: string) {
  return useApiMutation(`/api/service-providers/${providerId}`, 'PUT');
}

/**
 * Delete service provider
 */
export function useDeleteServiceProvider() {
  return useApiMutation('/api/service-providers', 'DELETE');
}
