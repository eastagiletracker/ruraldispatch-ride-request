import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiUrl } from '@/lib/api';

interface VehicleFormData {
  displayName: string;
  fleetId?: string;
  capacity?: number;
  serviceArea?: string;
  walkerAccessible: boolean;
  wheelchairAccessible: boolean;
  serviceAnimalFriendly: boolean;
  oxygenTankAccessible: boolean;
}

interface Vehicle {
  uuid: string;
  displayName: string;
  fleetId?: string;
  model?: string;
  year?: number;
  color?: string;
  licensePlate?: string;
  capacity?: number;
  serviceArea?: string;
  wheelchairAccessible: boolean;
  walkerAccessible: boolean;
  serviceAnimalFriendly: boolean;
  oxygenTankAccessible: boolean;
}

interface VehicleEditModalProps {
  vehicle: Vehicle;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function getAuthHeaders() {
  const userRole = sessionStorage.getItem('user_role');
  return {
    'Content-Type': 'application/json',
    'x-user-role': userRole || '',
  };
}

export function VehicleEditModal({ vehicle, open, onClose, onSuccess }: VehicleEditModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VehicleFormData>({
    defaultValues: {
      displayName: vehicle.displayName,
      fleetId: vehicle.fleetId || '',
      capacity: vehicle.capacity || undefined,
      serviceArea: vehicle.serviceArea || '',
      walkerAccessible: vehicle.walkerAccessible,
      wheelchairAccessible: vehicle.wheelchairAccessible,
      serviceAnimalFriendly: vehicle.serviceAnimalFriendly,
      oxygenTankAccessible: vehicle.oxygenTankAccessible,
    },
  });

  const watchAccessibility = watch([
    'walkerAccessible',
    'wheelchairAccessible',
    'serviceAnimalFriendly',
    'oxygenTankAccessible',
  ]);

  // Reset form when vehicle changes
  useEffect(() => {
    reset({
      displayName: vehicle.displayName,
      fleetId: vehicle.fleetId || '',
      capacity: vehicle.capacity || undefined,
      serviceArea: vehicle.serviceArea || '',
      walkerAccessible: vehicle.walkerAccessible,
      wheelchairAccessible: vehicle.wheelchairAccessible,
      serviceAnimalFriendly: vehicle.serviceAnimalFriendly,
      oxygenTankAccessible: vehicle.oxygenTankAccessible,
    });
  }, [vehicle, reset]);

  const onSubmit = async (data: VehicleFormData) => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(getApiUrl(`/api/vehicles/${vehicle.uuid}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update vehicle');
      }

      toast.success('Vehicle updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update vehicle';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
          <DialogDescription>
            Update vehicle information and accessibility features
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 py-4">
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="displayName"
                placeholder="e.g., Van #1, Blue Sedan"
                {...register('displayName', { required: 'Display name is required' })}
              />
              {errors.displayName && (
                <p className="text-sm text-red-500">{errors.displayName.message}</p>
              )}
            </div>

            {/* Fleet ID */}
            <div className="space-y-2">
              <Label htmlFor="fleetId">
                Fleet ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fleetId"
                placeholder="Enter fleet identification number"
                {...register('fleetId', { required: 'Fleet ID is required' })}
              />
              {errors.fleetId && <p className="text-sm text-red-500">{errors.fleetId.message}</p>}
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="capacity">
                Capacity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                placeholder="Number of passengers"
                {...register('capacity', {
                  required: 'Capacity is required',
                  valueAsNumber: true,
                  min: { value: 1, message: 'Capacity must be at least 1' },
                })}
              />
              {errors.capacity && <p className="text-sm text-red-500">{errors.capacity.message}</p>}
              <p className="text-xs text-muted-foreground">Maximum number of passengers</p>
            </div>

            {/* Service Area */}
            <div className="space-y-2">
              <Label htmlFor="serviceArea">
                Service Area <span className="text-red-500">*</span>
              </Label>
              <Input
                id="serviceArea"
                placeholder="e.g., Downtown, North County"
                {...register('serviceArea', { required: 'Service area is required' })}
              />
              {errors.serviceArea && (
                <p className="text-sm text-red-500">{errors.serviceArea.message}</p>
              )}
            </div>

            {/* Accessibility Features */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Accessibility Feature Type</h3>
              <p className="text-sm text-muted-foreground">
                Select any accessibility features needed for this vehicle.
              </p>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="walkerAccessible"
                    checked={watchAccessibility[0]}
                    onCheckedChange={(checked) => setValue('walkerAccessible', checked as boolean)}
                  />
                  <Label htmlFor="walkerAccessible" className="cursor-pointer">
                    Walker Accessible
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="wheelchairAccessible"
                    checked={watchAccessibility[1]}
                    onCheckedChange={(checked) =>
                      setValue('wheelchairAccessible', checked as boolean)
                    }
                  />
                  <Label htmlFor="wheelchairAccessible" className="cursor-pointer">
                    Wheelchair Accessible
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="serviceAnimalFriendly"
                    checked={watchAccessibility[2]}
                    onCheckedChange={(checked) =>
                      setValue('serviceAnimalFriendly', checked as boolean)
                    }
                  />
                  <Label htmlFor="serviceAnimalFriendly" className="cursor-pointer">
                    Service Animal Friendly
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="oxygenTankAccessible"
                    checked={watchAccessibility[3]}
                    onCheckedChange={(checked) =>
                      setValue('oxygenTankAccessible', checked as boolean)
                    }
                  />
                  <Label htmlFor="oxygenTankAccessible" className="cursor-pointer">
                    Oxygen Tank/Medical Device Accessible
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Vehicle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
