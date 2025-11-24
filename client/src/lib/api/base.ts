import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { getApiUrl } from './config';

/**
 * Get authentication headers from sessionStorage
 */
function getAuthHeaders() {
  const userRole = sessionStorage.getItem('user_role');
  console.log('[API] Getting auth headers - userRole:', userRole); // Debug log
  return {
    'Content-Type': 'application/json',
    'x-user-role': userRole || '',
  };
}

/**
 * Generic fetch hook for GET requests
 */
export function useFetch<T = any>(
  endpoint: string,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T>({
    queryKey: [endpoint],
    queryFn: async () => {
      const response = await fetch(getApiUrl(endpoint), {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    retry: (failureCount, error) => {
      // Don't retry on 401/403 errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      // Default retry logic: retry up to 1 time for other errors
      return failureCount < 1;
    },
    ...options,
  });
}

/**
 * Generic mutation hook for POST/PUT/DELETE requests
 */
export function useApiMutation<TData = any, TVariables = any>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (data: TVariables) => {
      const response = await fetch(getApiUrl(endpoint), {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
    ...options,
  });
}
