import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Building2, Loader2, MapPin, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
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
import { PhoneInput } from '@/components/ui/phone-input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { calculateTravelTimeWithTraffic } from '@/lib/distance-matrix-api';
import { type RideRequestFormData, rideRequestFormSchema } from '@/schemas/validation';
import type { RideRequestFormProps } from '@/types/form';
import { dateTimeLocalToUTC } from '@/utils/dateUtils';
import { getCurrentUser } from '@/utils/permissions';
import { createDocument } from '../utils/database';

export default function RideRequestForm({
  selectedUser,
  setShowRideRequestForm,
  setShowBaseForm,
  setShowUserForm,
  caseManagerName,
}: RideRequestFormProps) {
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [calculatingTravelTime, setCalculatingTravelTime] = useState<boolean>(false);
  const [travelTimeCalculated, setTravelTimeCalculated] = useState<boolean>(false);
  const [estimatedDistance, setEstimatedDistance] = useState<string>('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RideRequestFormData>({
    resolver: zodResolver(rideRequestFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      caseManagerFullName: caseManagerName || '',
      caseManagerAgency: '',
      caseManagerPhone: '',
      riderFullName: selectedUser?.fullName || '',
      riderMobilePhone: selectedUser?.phone || '',
      pickupLocation: null,
      dropoffLocation: null,
      roundtrip: false,
      pickupRequestedDate: '',
      pickupRequestedTime: '',
      estimatedWaitTime: '',
      estimatedTravelTime: '',
      walkerAccessible: false,
      wheelchairAccessible: false,
      serviceAnimalFriendly: false,
      oxygenTankAccessible: false,
      purposeOfTrip: '',
      notesComments: '',
    },
  });

  // Update rider info when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      reset(
        {
          caseManagerFullName: caseManagerName || '',
          caseManagerAgency: '',
          caseManagerPhone: '',
          riderFullName: selectedUser.fullName,
          riderMobilePhone: selectedUser.phone || '',
          pickupLocation: null,
          dropoffLocation: null,
          roundtrip: false,
          pickupRequestedDate: '',
          pickupRequestedTime: '',
          estimatedWaitTime: '',
          estimatedTravelTime: '',
          walkerAccessible: false,
          wheelchairAccessible: false,
          serviceAnimalFriendly: false,
          oxygenTankAccessible: false,
          purposeOfTrip: '',
          notesComments: '',
        },
        { keepDefaultValues: false }
      );
    }
  }, [selectedUser, caseManagerName, reset]);

  // Watch roundtrip checkbox to enable/disable wait time field
  const isRoundTrip = watch('roundtrip');

  // Helper function to extract address string
  const getAddressString = (location: string | { formattedAddress: string } | null): string => {
    if (!location) return '';
    return typeof location === 'string' ? location : location.formattedAddress;
  };

  // Auto-calculate travel time when both addresses are selected (single effect)
  const pickupLocation = watch('pickupLocation');
  const dropoffLocation = watch('dropoffLocation');
  
  useEffect(() => {
    const pickup = getAddressString(pickupLocation);
    const dropoff = getAddressString(dropoffLocation);

    // If either is empty, clear travel time, distance and reset flag
    if (!pickup || !dropoff) {
      setValue('estimatedTravelTime', '');
      setEstimatedDistance('');
      setTravelTimeCalculated(false);
      return;
    }

    // Both addresses present - reset flag to allow calculation
    setTravelTimeCalculated(false);

    // Skip if already calculating
    if (calculatingTravelTime) {
      return;
    }

    // Debounce the calculation
    const timeoutId = setTimeout(async () => {
      setCalculatingTravelTime(true);

      try {
        const result = await calculateTravelTimeWithTraffic(pickup, dropoff);

        setValue('estimatedTravelTime', result.durationMinutes.toString(), {
          shouldValidate: true,
        });

        // Convert meters to miles: 1 mile = 1609.34 meters
        const distanceInMiles = (result.distanceMeters / 1609.34).toFixed(2);
        setEstimatedDistance(distanceInMiles);

        setTravelTimeCalculated(true);

        toast.success('Travel time & distance calculated', {
          description: `${result.durationMinutes} min • ${distanceInMiles} miles`,
        });
      } catch (error) {
        console.error('Error calculating travel time:', error);
        const errorMessage = error instanceof Error ? error.message : '';
        if (!errorMessage.includes('REQUEST_DENIED')) {
          toast.error('Could not calculate travel time', {
            description: 'Please enter the time manually',
          });
        }
      } finally {
        setCalculatingTravelTime(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupLocation, dropoffLocation]);

  const onSubmit = async (data: RideRequestFormData) => {
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // Helper to extract address string from AddressType or string
      const getAddressString = (location: string | { formattedAddress: string } | null): string => {
        if (!location) return '';
        return typeof location === 'string' ? location : location.formattedAddress;
      };

      // Build accessibility features string from checkboxes
      const accessibilityFeatures = [];
      if (data.walkerAccessible) accessibilityFeatures.push('Walker Accessible');
      if (data.wheelchairAccessible) accessibilityFeatures.push('Wheelchair Accessible');
      if (data.serviceAnimalFriendly) accessibilityFeatures.push('Service Animal Friendly');
      if (data.oxygenTankAccessible)
        accessibilityFeatures.push('Oxygen Tank/Medical Device Accessible');
      const accessibilityString =
        accessibilityFeatures.length > 0 ? accessibilityFeatures.join(', ') : 'None';

      // Get the logged-in case manager's UUID (only if authenticated)
      const currentUser = getCurrentUser();
      const createdByUuid =
        currentUser?.uuid && currentUser.isAuthenticated ? currentUser.uuid : undefined;

      // Parse estimatedTravelTime as a number (convert from string minutes)
      let estimatedTravelTimeNum: number | undefined;
      if (data.estimatedTravelTime) {
        const travelTimeNum = parseInt(data.estimatedTravelTime, 10);
        if (!Number.isNaN(travelTimeNum)) {
          estimatedTravelTimeNum = travelTimeNum;
        }
      }

      // Parse estimatedDistance as a number (miles)
      let estimatedDistanceNum: number | undefined;
      if (estimatedDistance) {
        const distanceNum = parseFloat(estimatedDistance);
        if (!Number.isNaN(distanceNum)) {
          estimatedDistanceNum = distanceNum;
        }
      }

      const rideRequestData = {
        // Only include serviceUserUuid if we have a valid UUID from an existing user
        ...(selectedUser?.uuid && { serviceUserUuid: selectedUser.uuid }),
        serviceUserRole: 'rider',
        serviceUserName: data.riderFullName, // Store rider name directly
        serviceUserPhone: data.riderMobilePhone, // Store rider phone directly
        ...(createdByUuid && { createdByUuid }), // Only include if authenticated case manager
        // Case manager info (for public requests or manual entry)
        caseManagerName: data.caseManagerFullName || null,
        caseManagerPhone: data.caseManagerPhone || null,
        pickupAddress: getAddressString(data.pickupLocation),
        dropOffAddress: getAddressString(data.dropoffLocation),
        roundTrip: data.roundtrip || false,
        // Convert local date+time to UTC ISO string for backend
        pickupRequestedTime: dateTimeLocalToUTC(
          `${data.pickupRequestedDate}T${data.pickupRequestedTime}`
        ),
        dropOffRequestedTime: dateTimeLocalToUTC(
          `${data.pickupRequestedDate}T${data.pickupRequestedTime}`
        ),
        rideStartedActualTime: new Date(),
        pickupActualTime: new Date(),
        dropOffActualTime: new Date(),
        rideCompleteRequestedTime: new Date(),
        rideCompleteActualTime: new Date(),
        rideStatus: 0,
        purpose: data.purposeOfTrip,
        rideRequestStatus: 100,
        ...(estimatedTravelTimeNum !== undefined && {
          estimatedTravelTime: estimatedTravelTimeNum,
        }),
        ...(estimatedDistanceNum !== undefined && {
          estimatedDistance: estimatedDistanceNum,
        }),
        // Only store custom notes from the user - all other data is in dedicated fields
        notes: data.notesComments || null,
        walkerAccessible: data.walkerAccessible,
        wheelchairAccessible: data.wheelchairAccessible,
        serviceAnimalFriendly: data.serviceAnimalFriendly,
        oxygenTankAccessible: data.oxygenTankAccessible,
      };

      const response = await createDocument('riderequests', rideRequestData);

      if (response.ok) {
        setSubmitSuccess(true);
        toast.success('Ride request created successfully!', {
          description: `Request for ${data.riderFullName} has been submitted.`,
        });

        // Reset and return to base form after a short delay
        setTimeout(() => {
          reset();
          handleCancel();
        }, 1500);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Failed to create ride request';
        setSubmitError(errorMessage);
        toast.error('Failed to create ride request', {
          description: errorMessage,
        });
      }
    } catch (_error) {
      const errorMessage = 'Please try again or contact support.';
      setSubmitError(errorMessage);
      toast.error('Error submitting form', {
        description: errorMessage,
      });
    }
  };

  const handleCancel = () => {
    reset();
    setSubmitSuccess(false);
    setSubmitError('');
    if (setShowRideRequestForm) setShowRideRequestForm(false);
    if (setShowBaseForm) setShowBaseForm(true);
    if (setShowUserForm) setShowUserForm(false);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create Ride Request</CardTitle>
        <CardDescription>
          Fill in the information to submit a ride request for {selectedUser?.fullName}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {submitSuccess && (
          <Alert className="mb-6 border-green-500 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-100">
            <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription>Ride request created successfully! Redirecting...</AlertDescription>
          </Alert>
        )}

        {submitError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <form key={selectedUser?.uuid} onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Case Manager Section */}
          {/* TODO: Clarify business logic - Should case manager info be optional when rider calls directly?
                        Currently creates ride with case manager info in notes, but doesn't validate if case manager
                        exists in system or create a system user account. Need chargeback process clarification. */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Case Manager Information</h3>
            </div>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caseManagerFullName">
                  Case Manager's Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="caseManagerFullName"
                  {...register('caseManagerFullName')}
                  placeholder="Enter case manager name"
                  className={errors.caseManagerFullName ? 'border-destructive' : ''}
                />
                {errors.caseManagerFullName && (
                  <p className="text-sm text-destructive">{errors.caseManagerFullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="caseManagerAgency">
                  Case Manager's Agency <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="caseManagerAgency"
                  {...register('caseManagerAgency')}
                  placeholder="Enter agency name"
                  className={errors.caseManagerAgency ? 'border-destructive' : ''}
                />
                {errors.caseManagerAgency && (
                  <p className="text-sm text-destructive">{errors.caseManagerAgency.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="caseManagerPhone">
                  Case Manager's Phone Number <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="caseManagerPhone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="+1 (555) 000-0000"
                      className={errors.caseManagerPhone ? 'border-destructive' : ''}
                    />
                  )}
                />
                {errors.caseManagerPhone && (
                  <p className="text-sm text-destructive">{errors.caseManagerPhone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Rider Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Rider Information</h3>
            </div>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="riderFullName">
                  Rider's Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="riderFullName"
                  {...register('riderFullName')}
                  placeholder="Enter rider name"
                  className={errors.riderFullName ? 'border-destructive' : ''}
                />
                {errors.riderFullName && (
                  <p className="text-sm text-destructive">{errors.riderFullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="riderMobilePhone">
                  Rider's Mobile Phone Number <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="riderMobilePhone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      {...field}
                      placeholder="+1 (555) 000-0000"
                      className={errors.riderMobilePhone ? 'border-destructive' : ''}
                    />
                  )}
                />
                {errors.riderMobilePhone && (
                  <p className="text-sm text-destructive">{errors.riderMobilePhone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Ride Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Ride Request</h3>
            </div>
            <Separator />

            <div className="space-y-4">
              <Controller
                name="pickupLocation"
                control={control}
                render={({ field }) => (
                  <AddressAutocomplete
                    value={typeof field.value === 'string' ? null : field.value}
                    onChange={field.onChange}
                    label="Pickup Location"
                    placeholder="Search for pickup address..."
                    required
                    error={!!errors.pickupLocation}
                    errorMessage={errors.pickupLocation?.message}
                    includedRegionCodes={['US']}
                  />
                )}
              />

              <Controller
                name="dropoffLocation"
                control={control}
                render={({ field }) => (
                  <AddressAutocomplete
                    value={typeof field.value === 'string' ? null : field.value}
                    onChange={field.onChange}
                    label="Drop-off Location"
                    placeholder="Search for drop-off address..."
                    required
                    error={!!errors.dropoffLocation}
                    errorMessage={errors.dropoffLocation?.message}
                    includedRegionCodes={['US']}
                  />
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedTravelTime">
                    Travel Time (minutes)
                    {travelTimeCalculated && (
                      <span className="ml-2 text-xs text-green-600 font-normal">
                        ✓ Auto-calculated
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="estimatedTravelTime"
                      type="number"
                      min="1"
                      {...register('estimatedTravelTime')}
                      placeholder={calculatingTravelTime ? 'Calculating...' : 'e.g., 30'}
                      disabled={calculatingTravelTime}
                      className={travelTimeCalculated ? 'border-green-500' : ''}
                    />
                    {calculatingTravelTime && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Estimated one-way travel time
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDistance">
                    Distance (miles)
                    {travelTimeCalculated && (
                      <span className="ml-2 text-xs text-green-600 font-normal">
                        ✓ Auto-calculated
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="estimatedDistance"
                      type="number"
                      step="0.01"
                      min="0"
                      value={estimatedDistance}
                      onChange={(e) => setEstimatedDistance(e.target.value)}
                      placeholder={calculatingTravelTime ? 'Calculating...' : 'e.g., 15.5'}
                      disabled={calculatingTravelTime}
                      className={travelTimeCalculated ? 'border-green-500' : ''}
                    />
                    {calculatingTravelTime && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Estimated one-way distance
                  </p>
                </div>
              </div>

              {travelTimeCalculated && (
                <p className="text-xs text-muted-foreground italic">
                  ℹ️ Auto-calculated using Google Maps with current traffic. You can adjust manually if needed.
                </p>
              )}

              <div className="flex items-center space-x-2">
                <Controller
                  name="roundtrip"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="roundtrip"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="roundtrip" className="cursor-pointer">
                  Round trip
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickupRequestedDate">
                    Pickup Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pickupRequestedDate"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    {...register('pickupRequestedDate')}
                    className={errors.pickupRequestedDate ? 'border-destructive' : ''}
                  />
                  {errors.pickupRequestedDate && (
                    <p className="text-sm text-destructive">{errors.pickupRequestedDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickupRequestedTime">
                    Pickup Time <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pickupRequestedTime"
                    type="time"
                    {...register('pickupRequestedTime')}
                    className={errors.pickupRequestedTime ? 'border-destructive' : ''}
                  />
                  {errors.pickupRequestedTime && (
                    <p className="text-sm text-destructive">{errors.pickupRequestedTime.message}</p>
                  )}
                </div>

                {isRoundTrip && (
                  <div className="space-y-2">
                    <Label htmlFor="estimatedWaitTime">Estimated Wait Time</Label>
                    <Input
                      id="estimatedWaitTime"
                      {...register('estimatedWaitTime')}
                      placeholder="e.g., 15 minutes"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Accessibility Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Accessibility Feature Type</Label>
              <p className="text-sm text-muted-foreground">
                Select any accessibility features needed for this ride.
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Controller
                  name="walkerAccessible"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="walkerAccessible"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="walkerAccessible" className="cursor-pointer font-normal">
                  Walker Accessible
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="wheelchairAccessible"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="wheelchairAccessible"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="wheelchairAccessible" className="cursor-pointer font-normal">
                  Wheelchair Accessible
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="serviceAnimalFriendly"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="serviceAnimalFriendly"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="serviceAnimalFriendly" className="cursor-pointer font-normal">
                  Service Animal Friendly
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="oxygenTankAccessible"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="oxygenTankAccessible"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="oxygenTankAccessible" className="cursor-pointer font-normal">
                  Oxygen Tank/Medical Device Accessible
                </Label>
              </div>
            </div>
          </div>

          {/* Purpose and Notes Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purposeOfTrip">
                Purpose of Trip <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">Let us know why you need a ride.</p>
              <Textarea
                id="purposeOfTrip"
                {...register('purposeOfTrip')}
                placeholder="Ex. I need to go to a doctor's appointment"
                rows={4}
                className={errors.purposeOfTrip ? 'border-destructive' : ''}
              />
              {errors.purposeOfTrip && (
                <p className="text-sm text-destructive">{errors.purposeOfTrip.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notesComments">Notes/Comments</Label>
              <p className="text-sm text-muted-foreground">
                Let your driver know if you have additional needs or concerns for this ride.
              </p>
              <Textarea
                id="notesComments"
                {...register('notesComments')}
                placeholder="Ex. I will have my child with me for this ride. Or I need help getting to the vehicle."
                rows={4}
              />
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Ride Request'}
        </Button>
      </CardFooter>
    </Card>
  );
}
