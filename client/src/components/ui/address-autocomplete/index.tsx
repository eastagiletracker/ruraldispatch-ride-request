/**
 * Address Autocomplete Component
 * Google Places API (New) with sessionToken support for cost optimization
 * Adapted from: https://github.com/NiazMorshed2007/shadcn-address-autocomplete
 */

import { useState, useRef, useEffect, useMemo, memo } from "react";
import { MapPin, Pencil, X, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { usePlacesAutocomplete } from "@/hooks/use-places-autocomplete";
import { getPlaceDetails, parseAddressComponents } from "@/lib/places-api";
import { AddressType, PartialAddressType, isValidAddress } from "@/schemas/address-schema";
import { AddressDialog } from "./address-dialog";
import { cn } from "@/lib/utils";

export interface AddressAutocompleteProps {
  /**
   * Current address value
   */
  value?: AddressType | null;

  /**
   * Callback when address changes
   */
  onChange: (address: AddressType | null) => void;

  /**
   * Placeholder text for the input
   */
  placeholder?: string;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Whether the field has an error
   */
  error?: boolean;

  /**
   * Error message to display
   */
  errorMessage?: string;

  /**
   * Whether the field is disabled
   */
  disabled?: boolean;

  /**
   * Restrict results to specific countries (e.g., ['US'])
   */
  includedRegionCodes?: string[];

  /**
   * Location bias for results
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
   * Label for the input field
   */
  label?: string;

  /**
   * Additional className for the container
   */
  className?: string;
}

const AddressAutocompleteComponent: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Search for an address...",
  required = false,
  error = false,
  errorMessage,
  disabled = false,
  includedRegionCodes = ["US"],
  locationBias,
  label,
  className,
}) => {
  const [selectedAddress, setSelectedAddress] = useState<AddressType | null>(value || null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [hasUserTyped, setHasUserTyped] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  const {
    value: inputValue,
    setValue: setInputValue,
    predictions,
    isLoading,
    error: autocompleteError,
    clearPredictions,
    refreshSessionToken,
    getSessionToken,
  } = usePlacesAutocomplete({
    includedRegionCodes,
    locationBias,
    minLength: 3,
    debounce: 500,
  });

  // Sync external value changes (only when it's not an internal update)
  useEffect(() => {
    // Skip if this is an internal update (we just called onChange)
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    // Only update if value actually changed
    const valuesAreDifferent = JSON.stringify(value) !== JSON.stringify(selectedAddress);
    if (valuesAreDifferent) {
      setSelectedAddress(value || null);
    }
  }, [value]); // Don't include selectedAddress in deps to avoid loops

  // Handle clicks outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setHasUserTyped(true);
    setShowSuggestions(true);
    setDetailsError(null);

    // If user clears the input, clear the selected address
    if (!newValue) {
      setSelectedAddress(null);
      onChange(null);
      setHasUserTyped(false);
    }
  };

  const handleSelectPrediction = async (placeId: string) => {
    setIsLoadingDetails(true);
    setDetailsError(null);
    setShowSuggestions(false);

    try {
      // Fetch place details using the same session token
      const details = await getPlaceDetails(placeId, getSessionToken());

      // Parse address components
      const components = parseAddressComponents(details.addressComponents);

      const address: AddressType = {
        address1: components.address1 || undefined,
        address2: components.address2,
        city: components.city || "",
        region: components.state || "",
        postalCode: components.postalCode || undefined,
        country: components.country || "",
        formattedAddress: details.formattedAddress,
        lat: details.location.latitude,
        lng: details.location.longitude,
      };

      // Check if address is incomplete (missing street address or postal code)
      const isIncomplete = !address.address1 || !address.postalCode;

      setSelectedAddress(address);
      
      // Mark as internal update before calling onChange
      isInternalUpdate.current = true;
      onChange(address);
      setInputValue("");
      setHasUserTyped(false);
      clearPredictions();

      // Refresh session token after successful selection
      refreshSessionToken();
      console.log('✅ [AddressAutocomplete] Address selection complete!');

      // Auto-open dialog if address is incomplete (city/state only)
      if (isIncomplete) {
        console.log('🔵 [AddressAutocomplete] Auto-opening dialog for incomplete address');
        setTimeout(() => {
          setDialogOpen(true);
        }, 100); // Small delay to ensure state updates
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to get address details";
      setDetailsError(errorMsg);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleClear = () => {
    setSelectedAddress(null);
    
    // Mark as internal update before calling onChange
    isInternalUpdate.current = true;
    onChange(null);
    
    setInputValue("");
    setHasUserTyped(false);
    clearPredictions();
    setDetailsError(null);
    inputRef.current?.focus();

    // Refresh session token on dismissal
    refreshSessionToken();
  };

  const handleSaveFromDialog = (address: AddressType) => {
    setSelectedAddress(address);
    
    // Mark as internal update before calling onChange
    isInternalUpdate.current = true;
    onChange(address);
    
    setDialogOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const showValidationError = hasUserTyped && inputValue && predictions.length === 0 && !isLoading;
  
  // Memoize validation check to prevent unnecessary re-renders
  const addressIsValid = useMemo(() => {
    return selectedAddress ? isValidAddress(selectedAddress) : false;
  }, [selectedAddress]);

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      {/* Selected Address Display */}
      {selectedAddress && addressIsValid ? (
        <div>
          <div
            className={cn(
              "flex items-center gap-2 p-1.5 border rounded-md",
              // Highlight incomplete addresses
              !selectedAddress.address1 || !selectedAddress.postalCode
                ? "bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700"
                : "bg-muted/50",
              error && "border-destructive"
            )}
          >
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{selectedAddress.formattedAddress}</p>
              {(!selectedAddress.address1 || !selectedAddress.postalCode) && (
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  ⚠️ Incomplete address - please add street address
                </p>
              )}
            </div>
            <div className="flex gap-1">
            <AddressDialog
              address={selectedAddress}
              onSave={handleSaveFromDialog}
              open={dialogOpen}
              onOpenChange={setDialogOpen}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={disabled}
                title="Edit address details"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </AddressDialog>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              disabled={disabled}
              onClick={handleClear}
              title="Clear address"
            >
              <X className="h-4 w-4" />
            </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Search Input */}
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoadingDetails}
              className={cn(
                error && "border-destructive",
                (isLoading || isLoadingDetails) && "pr-10"
              )}
            />
            {(isLoading || isLoadingDetails) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && inputValue && predictions.length > 0 && (
            <div className="absolute z-50 w-full mt-1">
              <Command className="border shadow-md rounded-md bg-popover">
                <CommandList>
                  <CommandGroup>
                    {predictions.map((prediction, index) => {
                      const placePrediction = prediction.placePrediction;
                      if (!placePrediction) return null;

                      return (
                        <CommandItem
                          key={`${placePrediction.placeId}-${index}`}
                          onSelect={() => handleSelectPrediction(placePrediction.placeId)}
                          className="cursor-pointer"
                        >
                          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm">
                              {placePrediction.structuredFormat?.mainText?.text ||
                                placePrediction.text.text}
                            </p>
                            {placePrediction.structuredFormat?.secondaryText?.text && (
                              <p className="text-xs text-muted-foreground">
                                {placePrediction.structuredFormat.secondaryText.text}
                              </p>
                            )}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          )}

          {/* No Results Message */}
          {showSuggestions && inputValue && predictions.length === 0 && !isLoading && (
            <div className="absolute z-50 w-full mt-1">
              <Command className="border shadow-md rounded-md bg-popover">
                <CommandEmpty>No addresses found. Try a different search.</CommandEmpty>
              </Command>
            </div>
          )}

          {/* Validation Error */}
          {showValidationError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>Please select an address from the suggestions.</span>
            </div>
          )}
        </div>
      )}

      {/* Error Messages */}
      {(errorMessage || detailsError || autocompleteError) && (
        <p className="text-sm text-destructive">
          {errorMessage || detailsError || autocompleteError?.message}
        </p>
      )}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export const AddressAutocomplete = memo(AddressAutocompleteComponent, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these props actually changed
  return (
    JSON.stringify(prevProps.value) === JSON.stringify(nextProps.value) &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.error === nextProps.error &&
    prevProps.errorMessage === nextProps.errorMessage &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.placeholder === nextProps.placeholder
  );
});

AddressAutocomplete.displayName = 'AddressAutocomplete';

export type { AddressType, PartialAddressType };
