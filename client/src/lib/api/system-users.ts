import { useFetch } from './base';

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return sessionStorage.getItem('user_authenticated') === 'true';
}

/**
 * Fetch system users (case managers, dispatchers, admins)
 */
export function useSystemUsers() {
  return useFetch<any[]>('/api/auth/system-users', {
    staleTime: 1000 * 60 * 2,
    enabled: isAuthenticated(),
  });
}
