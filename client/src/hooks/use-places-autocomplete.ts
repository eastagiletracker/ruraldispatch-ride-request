/**
 * Custom hook for Google Places Autocomplete with debouncing and sessionToken
 * Optimized to reduce API costs by using sessionTokens and debounced requests
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getAutocompletePredictions,
  PlacesSessionToken,
} from '@/lib/places-api';
import type {
  PlacePrediction,
  UsePlacesAutocompleteOptions,
  UsePlacesAutocompleteReturn,
} from '@shared/schemas';

export function usePlacesAutocomplete(
  options: UsePlacesAutocompleteOptions = {}
): UsePlacesAutocompleteReturn {
  const {
    debounce = 500,
    minLength = 3,
    locationBias,
    includedRegionCodes,
    onPredictionsUpdate,
    onError,
  } = options;

  const [value, setValue] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Session token for grouping requests
  const sessionTokenRef = useRef(new PlacesSessionToken());

  // Debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch predictions
  const fetchPredictions = useCallback(
    async (input: string) => {
      if (input.length < minLength) {
        setPredictions([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if session token should be refreshed (after 3 minutes)
        if (sessionTokenRef.current.shouldRefresh()) {
          sessionTokenRef.current.refresh();
        }

        const results = await getAutocompletePredictions(
          input,
          sessionTokenRef.current.getToken(),
          {
            locationBias,
            includedRegionCodes,
          }
        );

        setPredictions(results);
        onPredictionsUpdate?.(results);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch predictions');
        setError(error);
        onError?.(error);
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [minLength, locationBias, includedRegionCodes, onPredictionsUpdate, onError]
  );

  // Handle input changes with debouncing
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't fetch if value is too short
    if (value.length < minLength) {
      setPredictions([]);
      setIsLoading(false);
      return;
    }

    // Set loading immediately for better UX
    setIsLoading(true);

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      fetchPredictions(value);
    }, debounce);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, debounce, minLength, fetchPredictions]);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
  }, []);

  const refreshSessionToken = useCallback(() => {
    sessionTokenRef.current.refresh();
  }, []);

  const getSessionToken = useCallback(() => {
    return sessionTokenRef.current.getToken();
  }, []);

  return {
    value,
    setValue,
    predictions,
    isLoading,
    error,
    clearPredictions,
    refreshSessionToken,
    getSessionToken,
  };
}
