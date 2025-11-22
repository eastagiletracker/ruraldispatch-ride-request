import { AlertCircle } from 'lucide-react';
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
import { type VehicleFormData } from '@/schemas/validation';
import { createDocument } from '../utils/database';

interface ExtendedVehicleFormData extends Omit<VehicleFormData, 'accessibilityFeatures'> {
  walkerAccessible: boolean;
  wheelchairAccessible: boolean;
  serviceAnimalFriendly: boolean;
  oxygenTankAccessible: boolean;
}

export default function CreateVehicle() {
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<ExtendedVehicleFormData>({
    defaultValues: {
      displayName: '',
      fleetId: '',
      capacity: 0,
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

  const onSubmit = async (data: ExtendedVehicleFormData) => {
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // Prepare data for backend with boolean accessibility fields
      const vehicleData = {
        uuid: crypto.randomUUID(),
        displayName: data.displayName,
        fleetId: data.fleetId || null,
        model: null,
        year: null,
        color: null,
        licensePlate: null,
        capacity: data.capacity || null,
        serviceArea: data.serviceArea || null,
        walkerAccessible: data.walkerAccessible || false,
        wheelchairAccessible: data.wheelchairAccessible || false,
        serviceAnimalFriendly: data.serviceAnimalFriendly || false,
        oxygenTankAccessible: data.oxygenTankAccessible || false,
      };

      const response = await createDocument('vehicles', vehicleData);

      if (response.ok) {
        setSubmitSuccess(true);
        toast.success('Vehicle created successfully!', {
          description: `${data.displayName} has been added to the fleet.`,
        });

        // Reset form
        reset();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Please try again.';
        setSubmitError(errorMessage);
        toast.error('Failed to create vehicle', {
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = 'Please try again or contact support.';
      setSubmitError(errorMessage);
      toast.error('Error submitting form', {
        description: errorMessage,
      });
    }
  };

  const handleReset = () => {
    reset();
    setSubmitSuccess(false);
    setSubmitError('');
  };

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle>Create Vehicle</CardTitle>
        <CardDescription>Fill in the information to add a new vehicle to the fleet</CardDescription>
      </CardHeader>

      <CardContent>
        {submitSuccess && (
          <Alert className="mb-6 border-green-500 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-100">
            <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription>Vehicle created successfully!</AlertDescription>
          </Alert>
        )}

        {submitError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="vehicle-form">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              {...register('displayName')}
              placeholder="e.g., Van #1, Blue Sedan"
              className={errors.displayName ? 'border-destructive' : ''}
            />
            {errors.displayName && (
              <p className="text-sm text-destructive">{errors.displayName.message}</p>
            )}
          </div>

          {/* Fleet ID */}
          <div className="space-y-2">
            <Label htmlFor="fleetId">
              Fleet ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fleetId"
              {...register('fleetId')}
              placeholder="Enter fleet identification number"
              className={errors.fleetId ? 'border-destructive' : ''}
            />
            {errors.fleetId && <p className="text-sm text-destructive">{errors.fleetId.message}</p>}
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">
              Capacity <span className="text-destructive">*</span>
            </Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              {...register('capacity', { valueAsNumber: true })}
              placeholder="Number of passengers"
              className={errors.capacity ? 'border-destructive' : ''}
            />
            {errors.capacity && (
              <p className="text-sm text-destructive">{String(errors.capacity.message)}</p>
            )}
            <p className="text-xs text-muted-foreground">Maximum number of passengers</p>
          </div>

          {/* Service Area */}
          <div className="space-y-2">
            <Label htmlFor="serviceArea">
              Service Area <span className="text-destructive">*</span>
            </Label>
            <Input
              id="serviceArea"
              {...register('serviceArea')}
              placeholder="e.g., Downtown, North County"
              className={errors.serviceArea ? 'border-destructive' : ''}
            />
            {errors.serviceArea && (
              <p className="text-sm text-destructive">{errors.serviceArea.message}</p>
            )}
          </div>

          {/* Accessibility Features */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Accessibility Feature Type</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Select any accessibility features needed for this vehicle.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="walkerAccessible"
                  checked={watchAccessibility[0]}
                  onCheckedChange={(checked) => setValue('walkerAccessible', checked as boolean)}
                />
                <Label htmlFor="walkerAccessible" className="cursor-pointer font-normal">
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
                <Label htmlFor="wheelchairAccessible" className="cursor-pointer font-normal">
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
                <Label htmlFor="serviceAnimalFriendly" className="cursor-pointer font-normal">
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
                <Label htmlFor="oxygenTankAccessible" className="cursor-pointer font-normal">
                  Oxygen Tank/Medical Device Accessible
                </Label>
              </div>
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
          Reset Form
        </Button>
        <Button type="submit" form="vehicle-form" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Vehicle'}
        </Button>
      </CardFooter>
    </Card>
  );
}
