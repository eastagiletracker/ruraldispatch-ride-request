import { useQueryClient } from '@tanstack/react-query';
import { useFetch, useApiMutation } from './base';

/**
 * Check if user is authenticated (can be used by hooks)
 */
function isAuthenticated() {
  return sessionStorage.getItem('user_authenticated') === 'true';
}

/**
 * Fetch users list
 */
export function useUsers() {
  return useFetch<any[]>('/api/users', {
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: isAuthenticated(), // Only fetch when authenticated
  });
}

/**
 * Create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useApiMutation('/api/users', 'POST', {
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
  });
}

/**
 * Update user
 */
export function useUpdateUser(userId: string) {
  return useApiMutation(`/api/users/${userId}`, 'PUT');
}

/**
 * Delete user
 */
export function useDeleteUser() {
  return useApiMutation('/api/users', 'DELETE');
}
