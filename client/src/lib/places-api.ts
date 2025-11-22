/**
 * Google Places API (New) utilities
 * Implements the new Places API with sessionToken support for cost optimization
 *
 * References:
 * - https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
 * - https://github.com/wellyshen/use-places-autocomplete/issues/137
 */

import type {
  AddressComponents,
  AutocompleteOptions,
  AutocompleteResponse,
  PlaceDetails,
  PlacePrediction,
} from '@shared/schemas';

/**
 * SessionToken manager for cost optimization
 * Groups multiple autocomplete requests into a single session
 */
export class PlacesSessionToken {
  private token: string;
  private createdAt: number;

  constructor() {
    this.token = this.generateToken();
    this.createdAt = Date.now();
  }

  private generateToken(): string {
    // Generate a random UUID-like token
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  getToken(): string {
    return this.token;
  }

  /**
   * Refresh the token (call after selection, dismissal, or 3 minutes)
   */
  refresh(): void {
    this.token = this.generateToken();
    this.createdAt = Date.now();
  }

  /**
   * Check if token should be refreshed (older than 3 minutes)
   */
  shouldRefresh(): boolean {
    const threeMinutes = 3 * 60 * 1000;
    return Date.now() - this.createdAt > threeMinutes;
  }
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const PLACE_DETAILS_URL = 'https://places.googleapis.com/v1';

/**
 * Fetch autocomplete predictions using the new Places API
 * @param input - The search text
 * @param sessionToken - Session token for grouping requests
 * @param options - Optional configuration (location bias, etc.)
 */
export async function getAutocompletePredictions(
  input: string,
  sessionToken: string,
  options?: AutocompleteOptions
): Promise<PlacePrediction[]> {
  if (!API_KEY) {
    throw new Error('Google Maps API key is not configured');
  }

  if (!input || input.trim().length === 0) {
    return [];
  }

  try {
    const response = await fetch(AUTOCOMPLETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
      },
      body: JSON.stringify({
        input: input.trim(),
        sessionToken,
        ...options,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Places API error:', errorText);
      throw new Error(`Places API error: ${response.status}`);
    }

    const data: AutocompleteResponse = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('Error fetching autocomplete predictions:', error);
    throw error;
  }
}

/**
 * Get place details by place ID using the new Places API
 * @param placeId - The place ID from autocomplete
 * @param sessionToken - Session token to associate with the autocomplete session
 */
export async function getPlaceDetails(
  placeId: string,
  _sessionToken: string
): Promise<PlaceDetails> {
  console.log('🌐 [places-api] getPlaceDetails called with placeId:', placeId);

  if (!API_KEY) {
    throw new Error('Google Maps API key is not configured');
  }

  try {
    const url = `${PLACE_DETAILS_URL}/places/${placeId}`;
    console.log('🌐 [places-api] Fetching from URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents',
      },
    });

    console.log('🌐 [places-api] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [places-api] Place Details API error:', errorText);
      throw new Error(`Place Details API error: ${response.status}`);
    }

    const data: PlaceDetails = await response.json();
    console.log('✅ [places-api] Place details received:', data);
    return data;
  } catch (error) {
    console.error('❌ [places-api] Error fetching place details:', error);
    throw error;
  }
}

/**
 * Parse address components from Place Details API response
 * @param addressComponents - Array of address components from the API
 */
export function parseAddressComponents(
  addressComponents?: PlaceDetails['addressComponents']
): AddressComponents {
  if (!addressComponents) {
    return {};
  }

  const components: AddressComponents = {};

  for (const component of addressComponents) {
    const types = component.types;

    if (types.includes('street_number')) {
      components.address1 = component.longText;
    } else if (types.includes('route')) {
      components.address1 = components.address1
        ? `${components.address1} ${component.longText}`
        : component.longText;
    } else if (types.includes('subpremise')) {
      components.address2 = component.longText;
    } else if (types.includes('locality')) {
      components.city = component.longText;
    } else if (types.includes('administrative_area_level_1')) {
      components.state = component.shortText;
    } else if (types.includes('postal_code')) {
      components.postalCode = component.longText;
    } else if (types.includes('country')) {
      components.country = component.longText;
    }
  }

  return components;
}
