import { useEffect, useState } from 'react';
import DriverSearch from "./DriverSearch";
import { fetchDocument, updateDocument } from "../utils/database";
import VehicleSearch from "./VehicleSearch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, User } from "lucide-react";
import { toast } from "sonner";

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
    assignedDriverUuid?: number;
    assignedVehicleUuid?: number;
    driver?: Array<{ uuid: string; fullName: string }>;
    vehicle?: Array<{ uuid: string; model?: string; displayName?: string }>;
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
        dropOffAddress: ''
    });
    const [selectedDriver, setSelectedDriver] = useState<DriverData | undefined>();
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | undefined>();
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const getRideRequest = async () => {
        try {
            const rideRequest = await fetchDocument("riderequests", selectedRideRequestId) as RideRequestData;
            setSelectedRideRequest(rideRequest);
            
            // Pre-populate existing driver assignment
            if (rideRequest.driver && rideRequest.driver.length > 0) {
                setSelectedDriver({
                    uuid: rideRequest.driver[0].uuid,
                    fullName: rideRequest.driver[0].fullName
                });
            }
            
            // Pre-populate existing vehicle assignment
            if (rideRequest.vehicle && rideRequest.vehicle.length > 0) {
                setSelectedVehicle({
                    uuid: rideRequest.vehicle[0].uuid,
                    model: rideRequest.vehicle[0].model,
                    displayName: rideRequest.vehicle[0].displayName
                });
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching ride request:', error);
            toast.error('Failed to load ride request details');
            setLoading(false);
        }
    }

    async function submitSelectedDriver() {
        if (!selectedDriver || !selectedVehicle) {
            toast.error('Please select both driver and vehicle');
            return;
        }

        setSubmitting(true);
        try {
            const isEditing = selectedRideRequest.assignedDriverUuid || selectedRideRequest.assignedVehicleUuid;
            
            const driverUuid = parseInt(selectedDriver.uuid.toString());
            const vehicleUuid = parseInt(selectedVehicle.uuid.toString());
            
            console.log('Submitting assignment:', {
                selectedDriver,
                selectedVehicle,
                driverUuid,
                vehicleUuid,
                isValidDriver: !isNaN(driverUuid),
                isValidVehicle: !isNaN(vehicleUuid)
            });
            
            if (isNaN(driverUuid) || isNaN(vehicleUuid)) {
                toast.error('Invalid driver or vehicle UUID');
                return;
            }
            
            await updateDocument("riderequests", selectedRideRequestId, {
                assignedDriverUuid: driverUuid,
                assignedVehicleUuid: vehicleUuid,
                rideRequestStatus: 1000, // Ready to ride
                rideStatus: 100 // Ride confirmed
            });

            toast.success(isEditing ? 'Assignment updated successfully!' : 'Driver and vehicle assigned successfully!', {
                description: `${selectedDriver.fullName} has been assigned to this ride.`
            });

            cancelFn();
        } catch (error) {
            console.error('Error assigning driver:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error('Failed to assign driver', {
                description: errorMessage
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
    }, []);

    return (
        <Dialog open={true} onOpenChange={(open) => !open && cancelFn()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {selectedRideRequest.assignedDriverUuid || selectedRideRequest.assignedVehicleUuid 
                            ? 'Edit Assignment' 
                            : 'Assign Driver & Vehicle'}
                    </DialogTitle>
                    <DialogDescription>
                        {selectedRideRequest.assignedDriverUuid || selectedRideRequest.assignedVehicleUuid
                            ? 'Update the driver and vehicle for this ride request'
                            : 'Select an available driver and vehicle for this ride request'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Ride Details Section */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">Ride Details</Badge>
                        </div>

                        {loading ? (
                            /* Skeleton Loading State */
                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <Skeleton className="h-4 w-4 mt-1" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <Skeleton className="h-4 w-4 mt-1" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <Skeleton className="h-4 w-4 mt-1" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-4 w-40" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Actual Ride Details */
                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <User className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Rider</p>
                                        <p className="text-sm font-medium">{selectedRideRequest.rider[0]?.fullName || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <Clock className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Pickup Time</p>
                                        <p className="text-sm font-medium">
                                            {selectedRideRequest.pickupRequestedTime
                                                ? new Date(selectedRideRequest.pickupRequestedTime).toLocaleString()
                                                : 'Not specified'
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 mt-1 text-green-600 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Pickup Location</p>
                                        <p className="text-sm font-medium">{selectedRideRequest.pickupAddress || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 mt-1 text-red-600 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Drop off Location</p>
                                        <p className="text-sm font-medium">{selectedRideRequest.dropOffAddress || 'N/A'}</p>
                                    </div>
                                </div>

                                {selectedRideRequest.purpose && (
                                    <div className="flex items-start gap-2">
                                        <div className="h-4 w-4 mt-1 flex-shrink-0 flex items-center justify-center">
                                            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">Purpose of Trip</p>
                                            <p className="text-sm font-medium">{selectedRideRequest.purpose}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-2">
                                    <div className="h-4 w-4 mt-1 flex-shrink-0 flex items-center justify-center">
                                        <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Roundtrip</p>
                                        <p className="text-sm font-medium">{selectedRideRequest.roundTrip ? 'Yes' : 'No'}</p>
                                    </div>
                                </div>

                                {selectedRideRequest.notes && selectedRideRequest.roundTrip && selectedRideRequest.notes.includes('Wait time:') && (
                                    <div className="flex items-start gap-2">
                                        <div className="h-4 w-4 mt-1 flex-shrink-0 flex items-center justify-center">
                                            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">Estimated Wait Time</p>
                                            <p className="text-sm font-medium">
                                                {selectedRideRequest.notes.split('Wait time:')[1]?.split('.')[0]?.trim() || 'Not specified'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {selectedRideRequest.notes && selectedRideRequest.notes.includes('Accessibility:') && (
                                    <div className="flex items-start gap-2">
                                        <div className="h-4 w-4 mt-1 flex-shrink-0 flex items-center justify-center">
                                            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">Accessibility Requirements</p>
                                            <p className="text-sm font-medium">
                                                {selectedRideRequest.notes.split('Accessibility:')[1]?.split('.')[0]?.trim() || 'None'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Driver Selection */}
                    <div className="space-y-3">
                        <div>
                            <h3 className="text-sm font-semibold mb-1">
                                Select Driver <span className="text-destructive">*</span>
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3">
                                Choose an available driver for this ride
                            </p>
                        </div>
                        <DriverSearch onDriverSelect={setSelectedDriver} />
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
                            <h3 className="text-sm font-semibold mb-1">
                                Select Vehicle <span className="text-destructive">*</span>
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3">
                                Choose an available vehicle for this ride
                            </p>
                        </div>
                        <VehicleSearch onVehicleSelect={setSelectedVehicle} />
                        {selectedVehicle && (
                            <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-green-600">
                                    ✓ Vehicle Selected: {selectedVehicle.model || selectedVehicle.displayName || 'Vehicle'}
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
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
                            ? (selectedRideRequest.assignedDriverUuid || selectedRideRequest.assignedVehicleUuid ? 'Updating...' : 'Assigning...') 
                            : (selectedRideRequest.assignedDriverUuid || selectedRideRequest.assignedVehicleUuid ? 'Update Assignment' : 'Assign to Ride')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
