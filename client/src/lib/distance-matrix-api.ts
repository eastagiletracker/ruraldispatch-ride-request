/**
 * Google Maps Distance Matrix API Integration
 * Calculates travel time and distance between two locations
 */

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface DistanceMatrixResult {
  distance: {
    text: string;    // "25.5 km"
    value: number;   // 25500 (in meters)
  };
  duration: {
    text: string;    // "30 mins"
    value: number;   // 1800 (in seconds)
  };
  status: string;
}

export interface TravelTimeResult {
  durationMinutes: number;
  durationText: string;
  distanceText: string;
  distanceMeters: number;
}

/**
 * Calculate travel time between two addresses using Google Distance Matrix API
 * Routes through server to avoid CORS issues
 * @param origin - Starting address or coordinates
 * @param destination - Ending address or coordinates
 * @returns Travel time and distance information
 */
export async function calculateTravelTime(
  origin: string,
  destination: string
): Promise<TravelTimeResult> {
  if (!origin || !destination) {
    throw new Error('Origin and destination are required');
  }

  try {
    const response = await fetch('/api/maps/calculate-travel-time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ origin, destination }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.statusText}`);
    }

    const data = await response.json();

    const result: TravelTimeResult = {
      durationMinutes: data.durationMinutes,
      durationText: data.durationText,
      distanceText: data.distanceText,
      distanceMeters: data.distanceMeters
    };

    return result;
  } catch (error) {
    console.error('Error calculating travel time:', error);
    throw error;
  }
}

/**
 * Calculate travel time with traffic consideration
 * Server endpoint automatically uses traffic data when available
 */
export async function calculateTravelTimeWithTraffic(
  origin: string,
  destination: string
): Promise<TravelTimeResult> {
  // Server endpoint handles traffic automatically
  return calculateTravelTime(origin, destination);
}

/**
 * Format travel time result for display
 */
export function formatTravelTimeResult(result: TravelTimeResult): string {
  return `${result.durationMinutes} min (${result.distanceText})`;
}
