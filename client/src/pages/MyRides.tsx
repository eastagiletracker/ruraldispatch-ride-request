import { useEffect, useState } from 'react';
import { fetchCollection } from "../utils/database";
import { RIDE_STATUSES, RIDE_REQUEST_STATUSES } from "@shared/schemas";
import AssignedRideStatus from "../components/AssignedRideStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Calendar, MapPin, User, Clock } from "lucide-react";
import { getCurrentUser } from '@/utils/permissions';

interface RideRequest {
    uuid: string;
    rideRequestStatus: number;
    rideStatus?: number;
    rider: Array<{ fullName: string; phone: string }>;
    driver?: Array<{ fullName: string; mobilePhone: string; uuid: number }>;
    pickupAddress: string;
    dropOffAddress: string;
    pickupRequestedTime?: string;
    createdAt?: string;
    roundTrip?: boolean;
    purpose?: string;
    notes?: string;
}

export default function MyRides() {
    const [allAssignedRides, setAllAssignedRides] = useState<RideRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUser = getCurrentUser();

    const getRideRequests = async () => {
        try {
            const fetchedRideRequests = await fetchCollection("riderequests") as RideRequest[];
            if (fetchedRideRequests) {
                // Filter to only show assigned rides (rideRequestStatus >= RIDE_CONFIRMATION_NEEDED)
                const assignedRides = fetchedRideRequests.filter(rr =>
                    parseInt(rr.rideRequestStatus.toString()) >= RIDE_REQUEST_STATUSES.RIDE_CONFIRMATION_NEEDED
                );

                // Sort by pickup requested time - most recent first
                assignedRides.sort((a, b) => {
                    const timeA = a.pickupRequestedTime ? new Date(a.pickupRequestedTime).getTime() : 0;
                    const timeB = b.pickupRequestedTime ? new Date(b.pickupRequestedTime).getTime() : 0;
                    return timeB - timeA;
                });

                setAllAssignedRides(assignedRides);
            }
        } catch (error) {
            console.error('Error fetching ride requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getRideRequests();

        // Refresh every 20 seconds
        const interval = setInterval(() => {
            getRideRequests();
        }, 20000);

        return () => clearInterval(interval);
    }, []);

    // Categorize rides by status
    const now = new Date();

    const activeRides = allAssignedRides.filter(ride => {
        // Ride status 200-299 are active/in-progress rides
        const status = ride.rideStatus || RIDE_STATUSES.REQUEST_IN_PROGRESS;
        return status >= RIDE_STATUSES.RIDE_STARTED && status < RIDE_STATUSES.RIDER_PICKED_UP;
    });

    const upcomingRides = allAssignedRides.filter(ride => {
        // Rides that are scheduled but not started yet (status < 200)
        const status = ride.rideStatus || RIDE_STATUSES.REQUEST_IN_PROGRESS;
        const pickupTime = ride.pickupRequestedTime ? new Date(ride.pickupRequestedTime) : null;
        return status < RIDE_STATUSES.RIDE_STARTED && (!pickupTime || pickupTime > now);
    });

    const completedRides = allAssignedRides.filter(ride => {
        // Completed rides (status >= 300)
        const status = ride.rideStatus || RIDE_STATUSES.REQUEST_IN_PROGRESS;
        return status >= RIDE_STATUSES.RIDER_PICKED_UP;
    });

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return 'Not specified';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    const RideCard = ({ ride }: { ride: RideRequest }) => (
        <Card key={ride.uuid} className="mb-4 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Car className="h-5 w-5 text-primary" />
                            Ride #{ride.uuid}
                        </CardTitle>
                        <CardDescription className="mt-1">
                            {ride.rider && ride.rider.length > 0 && (
                                <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {ride.rider[0].fullName}
                                </span>
                            )}
                        </CardDescription>
                    </div>
                    <AssignedRideStatus
                        assignedRide={ride}
                        handleStartRide={() => getRideRequests()}
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex gap-2">
                        <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Pickup</p>
                            <p className="text-sm font-medium truncate">{ride.pickupAddress}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Drop-off</p>
                            <p className="text-sm font-medium truncate">{ride.dropOffAddress}</p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2 items-center text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDateTime(ride.pickupRequestedTime)}
                    </div>
                    {ride.roundTrip && (
                        <Badge variant="secondary" className="text-xs">
                            Round Trip
                        </Badge>
                    )}
                </div>

                {(ride.purpose || ride.notes) && (
                    <>
                        <Separator />
                        <div className="text-sm space-y-1">
                            {ride.purpose && (
                                <p><span className="font-medium">Purpose:</span> {ride.purpose}</p>
                            )}
                            {ride.notes && (
                                <p className="text-muted-foreground"><span className="font-medium">Notes:</span> {ride.notes}</p>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );

    const SkeletonCard = () => (
        <Card className="mb-4">
            <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-20 w-full" />
            </CardContent>
        </Card>
    );

    const EmptyState = ({ message }: { message: string }) => (
        <Card className="text-center py-12">
            <CardContent>
                <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{message}</p>
            </CardContent>
        </Card>
    );

    return (
        <div className='min-h-screen bg-gray-50'>
            <div className="container mx-auto px-4 py-6 md:py-8">
                {/* Page Header */}
                <div className="mb-6 md:mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                        <Car className="h-8 w-8 text-primary" />
                        My Rides
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base">
                        View and manage your assigned rides
                    </p>
                    {currentUser.fullName && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Welcome back, <span className="font-medium">{currentUser.fullName}</span>
                        </p>
                    )}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="active" className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {activeRides.length}
                            </Badge>
                            Active
                        </TabsTrigger>
                        <TabsTrigger value="upcoming" className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {upcomingRides.length}
                            </Badge>
                            Upcoming
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                                {completedRides.length}
                            </Badge>
                            Completed
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active">
                        {loading ? (
                            <>
                                <SkeletonCard />
                                <SkeletonCard />
                            </>
                        ) : activeRides.length > 0 ? (
                            activeRides.map(ride => <RideCard key={ride.uuid} ride={ride} />)
                        ) : (
                            <EmptyState message="No active rides at the moment" />
                        )}
                    </TabsContent>

                    <TabsContent value="upcoming">
                        {loading ? (
                            <>
                                <SkeletonCard />
                                <SkeletonCard />
                            </>
                        ) : upcomingRides.length > 0 ? (
                            upcomingRides.map(ride => <RideCard key={ride.uuid} ride={ride} />)
                        ) : (
                            <EmptyState message="No upcoming rides scheduled" />
                        )}
                    </TabsContent>

                    <TabsContent value="completed">
                        {loading ? (
                            <>
                                <SkeletonCard />
                                <SkeletonCard />
                            </>
                        ) : completedRides.length > 0 ? (
                            completedRides.map(ride => <RideCard key={ride.uuid} ride={ride} />)
                        ) : (
                            <EmptyState message="No completed rides yet" />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
