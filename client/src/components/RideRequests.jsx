import { useEffect, useState } from 'react';
import { fetchCollection, updateDocument } from "../utils/database";
import AssignedRideStatus from "./AssignedRideStatus";
import SMSConversation from "./SMSConversation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Car, MapPin, Clock, MessageSquare, Eye, EyeOff } from "lucide-react";

export default function RideRequests({ callbackFn }) {

    const [rideRequests, setRideRequests] = useState([]);
    const [assignedRides, setAssignedRides] = useState([]);
    const [expandedRideUuid, setExpandedRideUuid] = useState(null);
    const [loading, setLoading] = useState(true);

    let fetchInterval;

    function startRide(assignedRide) {
        updateDocument("riderequests", assignedRide.uuid, { rideStatus: 200 })
            .then(() => { getRideRequests() });
    }

    const getRideRequests = async () => {
        try {
            console.log('Fetching ride requests...');
            const rideRequests = await fetchCollection("riderequests");
            console.log('Ride requests:', rideRequests);
            if (rideRequests) {

                const rideReqsSortedByRrStatus = rideRequests.sort((a, b) => a.rideRequestStatus - b.rideRequestStatus);
                const length = rideReqsSortedByRrStatus.length;

                let pivotIndex = rideReqsSortedByRrStatus.findIndex(rr => parseInt(rr.rideRequestStatus) >= 400);

                let nonActiveRideReqs, assignedRides;

                if (pivotIndex < 0) {
                    nonActiveRideReqs = rideReqsSortedByRrStatus;
                    assignedRides = [];
                }
                else {
                    nonActiveRideReqs = rideReqsSortedByRrStatus.slice(0, pivotIndex);
                    assignedRides = rideReqsSortedByRrStatus.slice(pivotIndex, length);
                }

                setRideRequests(nonActiveRideReqs);
                setAssignedRides(assignedRides);
            }
        } catch (error) {
            console.error('Error fetching ride requests:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {

        clearInterval(fetchInterval);
        getRideRequests();
        fetchInterval = setInterval(async () => {
            getRideRequests();
        }, 5000);
    }, []);

    // Skeleton loading component
    const SkeletonTableRow = () => (
        <TableRow>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-8 w-32" /></TableCell>
            <TableCell><Skeleton className="h-8 w-32" /></TableCell>
        </TableRow>
    );

    const SkeletonTableRowAssigned = () => (
        <TableRow>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
    );

    const SkeletonCard = () => (
        <Card className="border-2">
            <CardContent className="pt-6">
                <div className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                        <Skeleton className="h-9 flex-1" />
                        <Skeleton className="h-9 flex-1" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className='space-y-6'>
            {/* Pending Ride Requests Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Pending Ride Requests
                    </CardTitle>
                    <CardDescription>
                        {loading
                            ? 'Loading...'
                            : rideRequests.length === 0
                            ? 'No pending ride requests'
                            : `${rideRequests.length} ride${rideRequests.length > 1 ? 's' : ''} awaiting assignment`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Mobile View - Cards */}
                    <div className="md:hidden space-y-4">
                        {loading ? (
                            // Skeleton loading for mobile
                            <>
                                <SkeletonCard />
                                <SkeletonCard />
                                <SkeletonCard />
                            </>
                        ) : (
                            rideRequests.map((rideRequest) => (
                            <Card key={rideRequest.uuid} className="border-2">
                                <CardContent className="pt-6">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Rider</p>
                                                <p className="text-base font-semibold">{rideRequest.rider[0].fullName}</p>
                                            </div>
                                            <Badge variant="secondary">Pending</Badge>
                                        </div>

                                        <Separator />

                                        <div className="space-y-2">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 mt-1 text-green-600 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Pickup</p>
                                                    <a
                                                        href={`https://www.google.com/maps/search/${rideRequest.pickupAddress}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-primary hover:underline"
                                                    >
                                                        {rideRequest.pickupAddress}
                                                    </a>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 mt-1 text-red-600 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Dropoff</p>
                                                    <a
                                                        href={`https://www.google.com/maps/search/${rideRequest.dropOffAddress}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-primary hover:underline"
                                                    >
                                                        {rideRequest.dropOffAddress}
                                                    </a>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {rideRequest.pickupRequestedTime ?
                                                        new Date(rideRequest.pickupRequestedTime).toLocaleString() :
                                                        'No pickup time set'
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => callbackFn(rideRequest.uuid)}
                                                className="flex-1"
                                                size="sm"
                                            >
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Assign Driver
                                            </Button>
                                            <Button
                                                onClick={() => callbackFn(rideRequest.uuid)}
                                                variant="outline"
                                                className="flex-1"
                                                size="sm"
                                            >
                                                <Car className="h-4 w-4 mr-2" />
                                                Assign Vehicle
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            ))
                        )}
                    </div>

                    {/* Desktop View - Table */}
                    <div className="hidden md:block rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rider</TableHead>
                                    <TableHead>Pickup Location</TableHead>
                                    <TableHead>Dropoff Location</TableHead>
                                    <TableHead>Requested Pickup Time</TableHead>
                                    <TableHead>Driver</TableHead>
                                    <TableHead>Vehicle</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <>
                                        <SkeletonTableRow />
                                        <SkeletonTableRow />
                                        <SkeletonTableRow />
                                    </>
                                ) : rideRequests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                            No pending ride requests
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rideRequests.map((rideRequest) => (
                                        <TableRow key={rideRequest.uuid}>
                                            <TableCell className="font-medium">{rideRequest.rider[0].fullName}</TableCell>
                                            <TableCell>
                                                <a
                                                    href={`https://www.google.com/maps/search/${rideRequest.pickupAddress}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline flex items-center gap-1"
                                                >
                                                    <MapPin className="h-3 w-3" />
                                                    {rideRequest.pickupAddress}
                                                </a>
                                            </TableCell>
                                            <TableCell>
                                                <a
                                                    href={`https://www.google.com/maps/search/${rideRequest.dropOffAddress}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline flex items-center gap-1"
                                                >
                                                    <MapPin className="h-3 w-3" />
                                                    {rideRequest.dropOffAddress}
                                                </a>
                                            </TableCell>
                                            <TableCell>
                                                {rideRequest.pickupRequestedTime ?
                                                    new Date(rideRequest.pickupRequestedTime).toLocaleString() :
                                                    'No pickup time set'
                                                }
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    onClick={() => callbackFn(rideRequest.uuid)}
                                                    size="sm"
                                                    variant="default"
                                                >
                                                    <UserPlus className="h-4 w-4 mr-2" />
                                                    Assign Driver
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    onClick={() => callbackFn(rideRequest.uuid)}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Car className="h-4 w-4 mr-2" />
                                                    Assign Vehicle
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Assigned Rides Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Car className="h-5 w-5 text-primary" />
                        Assigned Rides
                    </CardTitle>
                    <CardDescription>
                        {loading
                            ? 'Loading...'
                            : assignedRides.length === 0
                            ? 'No assigned rides'
                            : `${assignedRides.length} active ride${assignedRides.length > 1 ? 's' : ''}`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Mobile View - Cards */}
                    <div className="md:hidden space-y-4">
                        {loading ? (
                            <>
                                <SkeletonCard />
                                <SkeletonCard />
                            </>
                        ) : (
                            assignedRides.map((ride) => (
                            <div key={ride.uuid} className="space-y-2">
                                <Card className="border-2 border-primary/20">
                                    <CardContent className="pt-6">
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Rider</p>
                                                    <p className="text-base font-semibold">{ride.rider[0].fullName}</p>
                                                    <p className="text-xs text-muted-foreground">{ride.rider[0].phone}</p>
                                                </div>
                                                <AssignedRideStatus
                                                    onClickFn={() => startRide(ride)}
                                                    rideRequestStatus={ride.rideRequestStatus}
                                                    rideStatus={ride.rideStatus}
                                                />
                                            </div>

                                            <Separator />

                                            <div className="space-y-2">
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="h-4 w-4 mt-1 text-green-600 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Pickup</p>
                                                        <p className="text-sm">{ride.pickupAddress}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2">
                                                    <MapPin className="h-4 w-4 mt-1 text-red-600 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Dropoff</p>
                                                        <p className="text-sm">{ride.dropOffAddress}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">
                                                        {ride.pickupRequestedTime ?
                                                            new Date(ride.pickupRequestedTime).toLocaleString() :
                                                            'No pickup time set'
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            <Separator />

                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground mb-1">Driver</p>
                                                <p className="text-sm font-semibold">{ride.driver[0].mobilePhone}</p>
                                            </div>

                                            <Button
                                                onClick={() => setExpandedRideUuid(expandedRideUuid === ride.uuid ? null : ride.uuid)}
                                                variant="outline"
                                                className="w-full"
                                                size="sm"
                                            >
                                                {expandedRideUuid === ride.uuid ? (
                                                    <>
                                                        <EyeOff className="h-4 w-4 mr-2" />
                                                        Hide Messages
                                                    </>
                                                ) : (
                                                    <>
                                                        <MessageSquare className="h-4 w-4 mr-2" />
                                                        View Messages
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {expandedRideUuid === ride.uuid && (
                                    <SMSConversation
                                        rideUuid={ride.uuid}
                                        riderPhone={ride.rider[0].phone}
                                        driverPhone={ride.driver[0].mobilePhone}
                                    />
                                )}
                            </div>
                            ))
                        )}
                    </div>

                    {/* Desktop View - Table */}
                    <div className="hidden md:block">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rider</TableHead>
                                        <TableHead>Pickup Location</TableHead>
                                        <TableHead>Dropoff Location</TableHead>
                                        <TableHead>Requested Pickup Time</TableHead>
                                        <TableHead>Driver's Number</TableHead>
                                        <TableHead>Ride Status</TableHead>
                                        <TableHead>Rider's Number</TableHead>
                                        <TableHead>SMS</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <>
                                            <SkeletonTableRowAssigned />
                                            <SkeletonTableRowAssigned />
                                        </>
                                    ) : assignedRides.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                                No assigned rides
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        assignedRides.map((ride) => (
                                            <>
                                                <TableRow key={ride.uuid}>
                                                    <TableCell className="font-medium">{ride.rider[0].fullName}</TableCell>
                                                    <TableCell>{ride.pickupAddress}</TableCell>
                                                    <TableCell>{ride.dropOffAddress}</TableCell>
                                                    <TableCell>
                                                        {ride.pickupRequestedTime ?
                                                            new Date(ride.pickupRequestedTime).toLocaleString() :
                                                            'No pickup time set'
                                                        }
                                                    </TableCell>
                                                    <TableCell>{ride.driver[0].mobilePhone}</TableCell>
                                                    <TableCell>
                                                        <AssignedRideStatus
                                                            onClickFn={() => startRide(ride)}
                                                            rideRequestStatus={ride.rideRequestStatus}
                                                            rideStatus={ride.rideStatus}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{ride.rider[0].phone}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            onClick={() => setExpandedRideUuid(expandedRideUuid === ride.uuid ? null : ride.uuid)}
                                                            size="sm"
                                                            variant="outline"
                                                        >
                                                            {expandedRideUuid === ride.uuid ? (
                                                                <>
                                                                    <EyeOff className="h-4 w-4 mr-2" />
                                                                    Hide
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    View
                                                                </>
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                                {expandedRideUuid === ride.uuid && (
                                                    <TableRow>
                                                        <TableCell colSpan="8" className="p-0 bg-muted/50">
                                                            <div className="p-4">
                                                                <SMSConversation
                                                                    rideUuid={ride.uuid}
                                                                    riderPhone={ride.rider[0].phone}
                                                                    driverPhone={ride.driver[0].mobilePhone}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
