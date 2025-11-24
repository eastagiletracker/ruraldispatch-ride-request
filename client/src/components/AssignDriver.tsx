import { Clock, MapPin, Phone, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatLocalDateTime } from '@/utils/dateUtils';
import { fetchDocument, updateDocument } from '../utils/database';
import DriverSearch from './DriverSearch';
import VehicleSearch from './VehicleSearch';

interface AssignDriverProps {
  selectedRideRequestId: string;
  cancelFn: () => void;
}

interface RideRequestData {
  rider: Array<{ fullName: string }>;
  pickupAddress: string;
  dropOffAddress: string;
  pickupRequestedTime?: string;
  roundTrip?: boolean;
  notes?: string;
  purpose?: string;
  driverUuid?: string;
  vehicleUuid?: string;
  driver?: Array<{ uuid: string; fullName: string }>;
  vehicle?: { uuid: string; model?: string; displayName?: string }; // Object, not array
  // Legacy fallback fields for backward compatibility
  riderName?: string;
  serviceUserName?: string;
  estimatedTravelTime?: number;
  estimatedDistance?: number;
  riderPhone?: string;
  caseManagerName?: string;
  caseManagerPhone?: string;
  walkerAccessible?: boolean;
  wheelchairAccessible?: boolean;
  serviceAnimalFriendly?: boolean;
  oxygenTankAccessible?: boolean;
}

interface DriverData {
  uuid: string;
  fullName: string;
}

interface VehicleData {
  uuid: string;
  model?: string;
  displayName?: string;
}

export default function AssignDriver({ selectedRideRequestId, cancelFn }: AssignDriverProps) {
  const [selectedRideRequest, setSelectedRideRequest] = useState<RideRequestData>({
    rider: [{ fullName: '' }],
    pickupAddress: '',
    dropOffAddress: '',
  });
  const [selectedDriver, setSelectedDriver] = useState<DriverData | undefined>();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const getRideRequest = useCallback(async () => {
    try {
      const rideRequest = (await fetchDocument(
        'riderequests',
        selectedRideRequestId
      )) as RideRequestData;
      setSelectedRideRequest(rideRequest);

      // Pre-populate existing driver assignment
      if (rideRequest.driver && rideRequest.driver.length > 0) {
        setSelectedDriver({
          uuid: rideRequest.driver[0].uuid,
          fullName: rideRequest.driver[0].fullName,
        });
      }

      // Pre-populate existing vehicle assignment
      // Note: vehicle is an object, not an array (unlike driver which is an array)
      if (rideRequest.vehicle && typeof rideRequest.vehicle === 'object') {
        setSelectedVehicle({
          uuid: rideRequest.vehicle.uuid,
          model: rideRequest.vehicle.model,
          displayName: rideRequest.vehicle.displayName,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching ride request:', error);
      toast.error('Failed to load ride request details');
      setLoading(false);
    }
  }, [selectedRideRequestId]);

  async function submitSelectedDriver() {
    if (!selectedDriver || !selectedVehicle) {
      toast.error('Please select both driver and vehicle');
      return;
    }

    setSubmitting(true);
    try {
      const isEditing = selectedRideRequest.driverUuid || selectedRideRequest.vehicleUuid;

      console.log('Submitting assignment:', {
        selectedDriver,
        selectedVehicle,
        driverUuid: selectedDriver.uuid,
        vehicleUuid: selectedVehicle.uuid,
      });

      await updateDocument('riderequests', selectedRideRequestId, {
        driverUuid: selectedDriver.uuid,
        vehicleUuid: selectedVehicle.uuid,
        rideRequestStatus: 400, // RIDE_CONFIRMATION_NEEDED - triggers driver assignment SMS
        rideStatus: 100, // RIDE_CONFIRMED - triggers scheduler to send pickup time SMS
      });

      toast.success(
        isEditing
          ? 'Assignment updated successfully!'
          : 'Driver and vehicle assigned successfully!',
        {
          description: `${selectedDriver.fullName} has been assigned to this ride.`,
        }
      );

      cancelFn();
    } catch (error) {
      console.error('Error assigning driver:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Failed to assign driver', {
        description: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    getRideRequest();
    const interval = setInterval(async () => {
      getRideRequest();
    }, 20000);

    return () => clearInterval(interval);
  }, [getRideRequest]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && cancelFn()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {selectedRideRequest.driverUuid || selectedRideRequest.vehicleUuid
              ? 'Edit Assignment'
              : 'Assign Driver & Vehicle'}
          </DialogTitle>
          <DialogDescription>
            {selectedRideRequest.driverUuid || selectedRideRequest.vehicleUuid
              ? 'Update the driver and vehicle for this ride request'
              : 'Select an available driver and vehicle for this ride request'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ride Details Section */}
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary">Ride Details</Badge>
            </div>

            {loading ? (
              /* Skeleton Loading State */
              <div className="space-y-3">
                {/* Rider */}
                <div className="flex items-start gap-2">
                  <Skeleton className="mt-1 h-4 w-4 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>

                {/* Pickup Time */}
                <div className="flex items-start gap-2">
                  <Skeleton className="mt-1 h-4 w-4 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>

                {/* Travel Time & Distance */}
                <div className="flex items-start gap-2">
                  <Skeleton className="mt-1 h-4 w-4 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>

                {/* Pickup Location */}
                <div className="flex items-start gap-2">
                  <Skeleton className="mt-1 h-4 w-4 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                </div>

                {/* Drop off Location */}
                <div className="flex items-start gap-2">
                  <Skeleton className="mt-1 h-4 w-4 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-4 w-52" />
                  </div>
                </div>

                {/* Purpose */}
                <div className="flex items-start gap-2">
                  <Skeleton className="mt-1 h-4 w-4 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </div>

                {/* Roundtrip */}
                <div className="flex items-start gap-2">
                  <Skeleton className="mt-1 h-4 w-4 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                </div>
              </div>
            ) : (
              /* Actual Ride Details */
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <User className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Rider</p>
                    <p className="text-sm font-medium">
                      {selectedRideRequest.rider?.[0]?.fullName ||
                        selectedRideRequest.riderName ||
                        selectedRideRequest.serviceUserName ||
                        'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Pickup Time</p>
                    <p className="text-sm font-medium">
                      {formatLocalDateTime(selectedRideRequest.pickupRequestedTime) ||
                        'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-green-600" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Pickup Location</p>
                    <p className="text-sm font-medium">
                      {selectedRideRequest.pickupAddress || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-red-600" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Drop off Location</p>
                    <p className="text-sm font-medium">
                      {selectedRideRequest.dropOffAddress || 'N/A'}
                    </p>
                  </div>
                </div>

                {(selectedRideRequest.estimatedTravelTime ||
                  selectedRideRequest.estimatedDistance) && (
                  <div className="flex items-start gap-2">
                    <Clock className="mt-1 h-4 w-4 flex-shrink-0 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Travel Time & Distance</p>
                      <p className="text-sm font-medium">
                        {selectedRideRequest.estimatedTravelTime
                          ? `${selectedRideRequest.estimatedTravelTime} min`
                          : 'N/A'}
                        {' • '}
                        {selectedRideRequest.estimatedDistance
                          ? `${Number(selectedRideRequest.estimatedDistance).toFixed(2)} mi`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {selectedRideRequest.caseManagerName && (
                  <div className="flex items-start gap-2">
                    <User className="mt-1 h-4 w-4 flex-shrink-0 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Case Manager</p>
                      <p className="text-sm font-medium">
                        {selectedRideRequest.caseManagerName}
                        {selectedRideRequest.caseManagerPhone &&
                          ` (${selectedRideRequest.caseManagerPhone})`}
                      </p>
                    </div>
                  </div>
                )}

                {selectedRideRequest.riderPhone && (
                  <div className="flex items-start gap-2">
                    <Phone className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Rider Phone</p>
                      <p className="text-sm font-medium">{selectedRideRequest.riderPhone}</p>
                    </div>
                  </div>
                )}

                {(selectedRideRequest.walkerAccessible ||
                  selectedRideRequest.wheelchairAccessible ||
                  selectedRideRequest.serviceAnimalFriendly ||
                  selectedRideRequest.oxygenTankAccessible) && (
                  <div className="flex items-start gap-2">
                    <div className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Accessibility Requirements</p>
                      <p className="text-sm font-medium">
                        {[
                          selectedRideRequest.walkerAccessible && 'Walker Accessible',
                          selectedRideRequest.wheelchairAccessible && 'Wheelchair Accessible',
                          selectedRideRequest.serviceAnimalFriendly && 'Service Animal Friendly',
                          selectedRideRequest.oxygenTankAccessible &&
                            'Oxygen Tank/Medical Device Accessible',
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {selectedRideRequest.purpose && (
                  <div className="flex items-start gap-2">
                    <div className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Purpose of Trip</p>
                      <p className="text-sm font-medium">{selectedRideRequest.purpose}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <div className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Roundtrip</p>
                    <p className="text-sm font-medium">
                      {selectedRideRequest.roundTrip ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                {selectedRideRequest.notes &&
                  (() => {
                    let customNotes = selectedRideRequest.notes;

                    // Extract only the custom notes by removing all structured fields
                    // Pattern: "Rider: ... Case Manager: ... Accessibility: ... Wait time: ... Travel time: ... [CUSTOM NOTES]"
                    const travelTimeMatch = customNotes.match(/Travel time:\s*[^.]*\.\s*(.*)/s);
                    if (travelTimeMatch && travelTimeMatch[1]) {
                      customNotes = travelTimeMatch[1].trim();
                    } else {
                      // If no Travel time field, try other patterns
                      const waitTimeMatch = customNotes.match(/Wait time:\s*[^.]*\.\s*(.*)/s);
                      if (waitTimeMatch && waitTimeMatch[1]) {
                        customNotes = waitTimeMatch[1].trim();
                      }
                    }

                    if (!customNotes || customNotes === '') return null;

                    return (
                      <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
                        <div className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="mb-1 text-xs font-semibold text-yellow-900 dark:text-yellow-100">
                            Notes
                          </p>
                          <p className="whitespace-pre-wrap text-sm text-yellow-900 dark:text-yellow-100">
                            {customNotes}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            )}
          </div>

          <Separator />

          {/* Driver Selection */}
          <div className="space-y-3">
            <div>
              <h3 className="mb-1 text-sm font-semibold">
                Select Driver <span className="text-destructive">*</span>
              </h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Choose an available driver for this ride
              </p>
            </div>
            <DriverSearch onDriverSelect={setSelectedDriver} selectedDriver={selectedDriver} />
            {selectedDriver && (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600">
                  ✓ Driver Selected: {selectedDriver.fullName}
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Vehicle Selection */}
          <div className="space-y-3">
            <div>
              <h3 className="mb-1 text-sm font-semibold">
                Select Vehicle <span className="text-destructive">*</span>
              </h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Choose an available vehicle for this ride
              </p>
            </div>
            <VehicleSearch
              onVehicleSelect={setSelectedVehicle}
              selectedVehicle={selectedVehicle}
            />
            {selectedVehicle && (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600">
                  ✓ Vehicle Selected:{' '}
                  {selectedVehicle.model || selectedVehicle.displayName || 'Vehicle'}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={cancelFn}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submitSelectedDriver}
            disabled={!selectedDriver || !selectedVehicle || submitting || loading}
            className="w-full sm:w-auto"
          >
            {submitting
              ? selectedRideRequest.driverUuid || selectedRideRequest.vehicleUuid
                ? 'Updating...'
                : 'Assigning...'
              : selectedRideRequest.driverUuid || selectedRideRequest.vehicleUuid
                ? 'Update Assignment'
                : 'Assign to Ride'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
