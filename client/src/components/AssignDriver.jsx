import { useEffect, useState } from 'react';
import DriverSearch from "./DriverSearch";
import { fetchDocument, updateDocument } from "../utils/database";
import VehicleSearch from "./VehicleSearch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User } from "lucide-react";
import { toast } from "sonner";

export default function AssignDriver({ selectedRideRequestId, cancelFn }) {

    const [selectedRideRequest, setSelectedRideRequest] = useState({ rider: [{ fullName: '' }], pickupAddress: '' });
    const [selectedDriver, setSelectedDriver] = useState();
    const [selectedVehicle, setSelectedVehicle] = useState();
    const [submitting, setSubmitting] = useState(false);

    const getRideRequest = async () => {
        try {
            const rideRequest = await fetchDocument("riderequests", selectedRideRequestId);
            setSelectedRideRequest(rideRequest);
        } catch (error) {
            console.error('Error fetching ride request:', error);
            toast.error('Failed to load ride request details');
        }
    }

    async function submitSelectedDriver() {
        if (!selectedDriver || !selectedVehicle) {
            toast.error('Please select both driver and vehicle');
            return;
        }

        setSubmitting(true);
        try {
            await updateDocument("riderequests", selectedRideRequestId, {
                driverUuid: selectedDriver.uuid.toString(),
                vehicleUuid: selectedVehicle.uuid.toString(),
                rideRequestStatus: 400
            });

            toast.success('Driver and vehicle assigned successfully!', {
                description: `${selectedDriver.fullName} has been assigned to this ride.`
            });

            cancelFn();
        } catch (error) {
            console.error('Error assigning driver:', error);
            toast.error('Failed to assign driver', {
                description: 'Please try again or contact support.'
            });
        } finally {
            setSubmitting(false);
        }
    }

    useEffect(() => {
        getRideRequest();
        const interval = setInterval(async () => {
            getRideRequest();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Dialog open={true} onOpenChange={(open) => !open && cancelFn()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Assign Driver & Vehicle</DialogTitle>
                    <DialogDescription>
                        Select an available driver and vehicle for this ride request
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Ride Details Section */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">Ride Details</Badge>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-start gap-2">
                                <User className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Passenger</p>
                                    <p className="text-sm font-medium">{selectedRideRequest.rider[0].fullName}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Pickup Location</p>
                                    <p className="text-sm font-medium">{selectedRideRequest.pickupAddress}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Requested Time</p>
                                    <p className="text-sm font-medium">
                                        {selectedRideRequest.pickupRequestedTime
                                            ? new Date(selectedRideRequest.pickupRequestedTime).toLocaleString()
                                            : 'Not specified'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Driver Selection */}
                    <div className="space-y-3">
                        <div>
                            <h3 className="text-sm font-semibold mb-1">Select Driver</h3>
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
                            <h3 className="text-sm font-semibold mb-1">Select Vehicle</h3>
                            <p className="text-xs text-muted-foreground mb-3">
                                Choose an available vehicle for this ride
                            </p>
                        </div>
                        <VehicleSearch onVehicleSelect={setSelectedVehicle} />
                        {selectedVehicle && (
                            <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-green-600">
                                    ✓ Vehicle Selected: {selectedVehicle.model || 'Vehicle'}
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
                        disabled={!selectedDriver || !selectedVehicle || submitting}
                        className="w-full sm:w-auto"
                    >
                        {submitting ? 'Assigning...' : 'Assign to Ride'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
