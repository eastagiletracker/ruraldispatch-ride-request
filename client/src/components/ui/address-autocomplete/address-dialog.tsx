/**
 * Address Dialog Component
 * Allows users to manually edit address fields after autocomplete selection
 * Adapted from: https://github.com/NiazMorshed2007/shadcn-address-autocomplete
 */

import { Loader2 } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AddressType, PartialAddressType } from '@/schemas/address-schema';

interface AddressDialogProps {
  children: React.ReactNode;
  address: PartialAddressType;
  onSave: (address: AddressType) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AddressDialogComponent: React.FC<AddressDialogProps> = ({
  children,
  address: initialAddress,
  onSave,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [open, setOpen] = useState(controlledOpen ?? false);
  const [address, setAddress] = useState<PartialAddressType>(initialAddress);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const prevAddressRef = useRef<string | undefined>(undefined);

  // Sync controlled open state
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpen(controlledOpen);
    }
  }, [controlledOpen]);

  // Update address when initialAddress changes (only if actually different)
  useEffect(() => {
    const addressStr = JSON.stringify(initialAddress);
    if (prevAddressRef.current !== addressStr) {
      prevAddressRef.current = addressStr;
      setAddress(initialAddress);
    }
  }, [initialAddress]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      setErrors({});
    }
  };

  const handleFieldChange = (field: keyof PartialAddressType, value: string | number) => {
    setAddress((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateFormattedAddress = (addr: PartialAddressType): string => {
    const parts: string[] = [];

    if (addr.address1) parts.push(addr.address1);
    if (addr.address2) parts.push(addr.address2);
    if (addr.city) parts.push(addr.city);
    if (addr.region) parts.push(addr.region);
    if (addr.postalCode) parts.push(addr.postalCode);
    if (addr.country) parts.push(addr.country);

    return parts.join(', ');
  };

  const handleSave = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      // Validate required fields manually for better UX
      const newErrors: Record<string, string> = {};

      if (!address.address1 || address.address1.trim().length === 0) {
        newErrors.address1 = 'Address line 1 is required';
      } else {
        const addr1 = address.address1.trim();
        const addr1Lower = addr1.toLowerCase();

        // Check if user entered full formatted address in address1 field
        const hasCity = address.city && addr1Lower.includes(address.city.toLowerCase());
        const hasRegion = address.region && addr1Lower.includes(address.region.toLowerCase());
        const hasPostal =
          address.postalCode && addr1Lower.includes(address.postalCode.toLowerCase());
        const hasCountry = address.country && addr1Lower.includes(address.country.toLowerCase());

        if (hasCity || hasRegion || hasPostal || hasCountry) {
          newErrors.address1 =
            "Enter only the street address (e.g., '123 Main St'), not the full address";
        }
      }

      if (!address.city || address.city.trim().length === 0) {
        newErrors.city = 'City is required';
      }

      if (!address.region || address.region.trim().length === 0) {
        newErrors.region = 'State/Region is required';
      }

      if (!address.postalCode || address.postalCode.trim().length === 0) {
        newErrors.postalCode = 'Postal code is required';
      } else {
        // Validate postal code format based on country
        const postalCode = address.postalCode.trim();
        const country = address.country?.toLowerCase() || '';

        if (country.includes('united states') || country.includes('usa') || country === 'us') {
          // US ZIP code: 5 digits or 5+4 format (12345 or 12345-6789)
          const usZipRegex = /^\d{5}(-\d{4})?$/;
          if (!usZipRegex.test(postalCode)) {
            newErrors.postalCode =
              'US ZIP code must be 5 digits (e.g., 10001) or ZIP+4 format (e.g., 10001-1234)';
          }
        }
      }

      if (!address.country || address.country.trim().length === 0) {
        newErrors.country = 'Country is required';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsLoading(false);
        return;
      }

      // Ensure all required fields are present for AddressType
      const completeAddress: AddressType = {
        address1: address.address1 || undefined,
        address2: address.address2,
        city: address.city || '',
        region: address.region || '',
        postalCode: address.postalCode || undefined,
        country: address.country || '',
        formattedAddress: updateFormattedAddress(address),
        lat: address.lat || 0,
        lng: address.lng || 0,
      };

      onSave(completeAddress);
      handleOpenChange(false);
    } catch (error) {
      console.error('Error saving address:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {!address.address1 || !address.postalCode ? 'Complete Address' : 'Edit Address'}
          </DialogTitle>
          <DialogDescription>
            {!address.address1 || !address.postalCode
              ? 'Please enter the complete street address with postal code.'
              : "Make changes to the address details. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Address Line 1 */}
          <div className="grid gap-2">
            <Label htmlFor="address1">
              Address Line 1 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address1"
              value={address.address1 || ''}
              onChange={(e) => handleFieldChange('address1', e.target.value)}
              placeholder="e.g., 123 Main St"
              className={errors.address1 ? 'border-destructive' : ''}
            />
            {errors.address1 && <p className="text-sm text-destructive">{errors.address1}</p>}
          </div>

          {/* Address Line 2 */}
          <div className="grid gap-2">
            <Label htmlFor="address2">Address Line 2</Label>
            <Input
              id="address2"
              value={address.address2 || ''}
              onChange={(e) => handleFieldChange('address2', e.target.value)}
              placeholder="Apartment, suite, etc. (optional)"
            />
          </div>

          {/* City and Region */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                value={address.city || ''}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                placeholder="e.g., New York"
                className={errors.city ? 'border-destructive' : ''}
              />
              {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="region">
                State/Region <span className="text-destructive">*</span>
              </Label>
              <Input
                id="region"
                value={address.region || ''}
                onChange={(e) => handleFieldChange('region', e.target.value)}
                placeholder="e.g., NY"
                className={errors.region ? 'border-destructive' : ''}
              />
              {errors.region && <p className="text-sm text-destructive">{errors.region}</p>}
            </div>
          </div>

          {/* Postal Code and Country */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="postalCode">
                Postal Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="postalCode"
                value={address.postalCode || ''}
                onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                placeholder="e.g., 10001"
                className={errors.postalCode ? 'border-destructive' : ''}
              />
              {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country">
                Country <span className="text-destructive">*</span>
              </Label>
              <Input
                id="country"
                value={address.country || ''}
                onChange={(e) => handleFieldChange('country', e.target.value)}
                placeholder="e.g., United States"
                className={errors.country ? 'border-destructive' : ''}
              />
              {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Address
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Memoize component to prevent unnecessary re-renders
export const AddressDialog = memo(AddressDialogComponent, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these props actually changed
  return (
    JSON.stringify(prevProps.address) === JSON.stringify(nextProps.address) &&
    prevProps.onSave === nextProps.onSave &&
    prevProps.open === nextProps.open &&
    prevProps.onOpenChange === nextProps.onOpenChange
  );
});

AddressDialog.displayName = 'AddressDialog';
