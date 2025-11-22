import { AlertCircle, CheckCircle2, Truck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiUrl } from '@/lib/api';

interface VehicleFormData {
  displayName: string;
  fleetId?: string;
  model?: string;
  year?: number;
  color?: string;
  licensePlate?: string;
  capacity?: number;
  serviceArea?: string;
  walkerAccessible: boolean;
  wheelchairAccessible: boolean;
  serviceAnimalFriendly: boolean;
  oxygenTankAccessible: boolean;
}

interface VehicleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

function getAuthHeaders() {
  const userRole = sessionStorage.getItem('user_role');
  return {
    'Content-Type': 'application/json',
    'x-user-role': userRole || '',
  };
}

export default function VehicleForm({ onSuccess, onCancel }: VehicleFormProps) {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VehicleFormData>({
    defaultValues: {
      displayName: '',
      fleetId: '',
      model: '',
      year: undefined,
      color: '',
      licensePlate: '',
      capacity: undefined,
      serviceArea: '',
      walkerAccessible: false,
      wheelchairAccessible: false,
      serviceAnimalFriendly: false,
      oxygenTankAccessible: false,
    },
  });

  const watchAccessibility = watch([
    'walkerAccessible',
    'wheelchairAccessible',
    'serviceAnimalFriendly',
    'oxygenTankAccessible',
  ]);

  const onSubmit = async (data: VehicleFormData) => {
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const response = await fetch(getApiUrl('/api/vehicles'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...data,
          uuid: crypto.randomUUID(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create vehicle');
      }

      setSubmitSuccess(true);
      toast.success('Vehicle added successfully');
      reset();

      // Call onSuccess callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    } catch (error) {
      console.error('Error creating vehicle:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create vehicle';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Add New Vehicle
        </CardTitle>
        <CardDescription>
          Add a vehicle to the fleet with accessibility features and service details
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {submitSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Vehicle added successfully!
              </AlertDescription>
            </Alert>
          )}

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  Display Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="displayName"
                  placeholder="e.g., Blue Sedan, Van 1"
                  {...register('displayName', { required: 'Display name is required' })}
                />
                {errors.displayName && (
                  <p className="text-sm text-red-500">{errors.displayName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fleetId">Fleet ID</Label>
                <Input id="fleetId" placeholder="e.g., VEH-001" {...register('fleetId')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" placeholder="e.g., Toyota Camry" {...register('model')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="e.g., 2020"
                  {...register('year', {
                    valueAsNumber: true,
                    min: { value: 1900, message: 'Year must be 1900 or later' },
                    max: {
                      value: new Date().getFullYear() + 1,
                      message: 'Year cannot be in the future',
                    },
                  })}
                />
                {errors.year && <p className="text-sm text-red-500">{errors.year.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" placeholder="e.g., Blue" {...register('color')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licensePlate">License Plate</Label>
                <Input
                  id="licensePlate"
                  placeholder="e.g., ABC-1234"
                  {...register('licensePlate')}
                />
              </div>
            </div>
          </div>

          {/* Capacity & Service */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Capacity & Service Area</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Passenger Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="e.g., 4"
                  {...register('capacity', {
                    valueAsNumber: true,
                    min: { value: 1, message: 'Capacity must be at least 1' },
                    max: { value: 50, message: 'Capacity cannot exceed 50' },
                  })}
                />
                {errors.capacity && (
                  <p className="text-sm text-red-500">{errors.capacity.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceArea">Service Area</Label>
                <Input
                  id="serviceArea"
                  placeholder="e.g., Rural County Area"
                  {...register('serviceArea')}
                />
              </div>
            </div>
          </div>

          {/* Accessibility Features */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Accessibility Features</h3>

            <div className="space-y-3">
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
                  Oxygen Tank Accessible
                </Label>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Vehicle'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
