import { useFetch } from './base';

/**
 * Fetch ride requests
 */
export function useRideRequests(filters?: any) {
  const queryString = filters ? `?${new URLSearchParams(filters).toString()}` : '';
  return useFetch<any[]>(`/api/riderequests${queryString}`, {
    staleTime: 1000 * 30, // 30 seconds - more frequent updates for rides
  });
}
