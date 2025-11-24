/**
 * API Configuration
 *
 * In development: Uses Vite proxy (relative URLs work)
 * In production: Uses VITE_API_URL environment variable
 */

// Get the API base URL from environment or default to empty string for relative URLs
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Get the full API URL for a given endpoint
 * @param endpoint - API endpoint path (e.g., '/api/auth/login')
 * @returns Full URL for the API endpoint
 */
export function getApiUrl(endpoint: string): string {
  // If no base URL is configured (development), return endpoint as-is for proxy
  if (!API_BASE_URL) {
    return endpoint;
  }

  // Remove trailing slash from base URL if present
  const baseUrl = API_BASE_URL.replace(/\/$/, '');

  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  return `${baseUrl}${path}`;
}

/**
 * Check if we're using the proxy (development) or direct API calls (production)
 */
export function isUsingProxy(): boolean {
  return !API_BASE_URL;
}

/**
 * Get the API configuration info (useful for debugging)
 */
export function getApiInfo() {
  return {
    baseUrl: API_BASE_URL || 'Using Vite proxy (development)',
    mode: isUsingProxy() ? 'development' : 'production',
  };
}
