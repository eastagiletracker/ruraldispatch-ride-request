/**
 * Google Places API (New) Type Definitions
 * Shared types for Places API integration
 *
 * References:
 * - https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
 * - https://github.com/wellyshen/use-places-autocomplete/issues/137
 */

export interface PlacePrediction {
  placePrediction?: {
    place: string; // Resource name (e.g., "places/ChIJ...")
    placeId: string;
    text: {
      text: string;
    };
    structuredFormat: {
      mainText: {
        text: string;
      };
      secondaryText: {
        text: string;
      };
    };
  };
}

export interface AutocompleteResponse {
  suggestions: PlacePrediction[];
}

export interface PlaceDetails {
  id: string;
  formattedAddress: string;
  displayName: {
    text: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
}

export interface AddressComponents {
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/**
 * Options for Places Autocomplete requests
 */
export interface AutocompleteOptions {
  locationBias?: {
    circle?: {
      center: {
        latitude: number;
        longitude: number;
      };
      radius: number;
    };
  };
  includedRegionCodes?: string[]; // e.g., ['US']
}

/**
 * Options for usePlacesAutocomplete hook
 */
export interface UsePlacesAutocompleteOptions {
  /**
   * Debounce delay in milliseconds (default: 500ms)
   */
  debounce?: number;

  /**
   * Minimum input length before making API requests (default: 3)
   */
  minLength?: number;

  /**
   * Optional location bias for results
   */
  locationBias?: {
    circle?: {
      center: {
        latitude: number;
        longitude: number;
      };
      radius: number;
    };
  };

  /**
   * Restrict results to specific countries (e.g., ['US'])
   */
  includedRegionCodes?: string[];

  /**
   * Callback when predictions are fetched
   */
  onPredictionsUpdate?: (predictions: PlacePrediction[]) => void;

  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void;
}

/**
 * Return type for usePlacesAutocomplete hook
 */
export interface UsePlacesAutocompleteReturn {
  /**
   * Current input value
   */
  value: string;

  /**
   * Set the input value
   */
  setValue: (value: string) => void;

  /**
   * Array of prediction suggestions
   */
  predictions: PlacePrediction[];

  /**
   * Whether predictions are being fetched
   */
  isLoading: boolean;

  /**
   * Error if one occurred
   */
  error: Error | null;

  /**
   * Clear all predictions
   */
  clearPredictions: () => void;

  /**
   * Refresh the session token (call after place selection)
   */
  refreshSessionToken: () => void;

  /**
   * Get the current session token
   */
  getSessionToken: () => string;
}
