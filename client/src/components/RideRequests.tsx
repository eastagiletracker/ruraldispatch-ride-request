import { useEffect, useState } from 'react';
import { fetchCollection, updateDocument } from "../utils/database";
import AssignedRideStatus from "./AssignedRideStatus";
import SMSConversationModal from "./SMSConversationModal";
import { UserDetailModal } from "./UserDetailModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, Car, MapPin, Clock, MessageSquare, User, Phone } from "lucide-react";
import { toast } from "sonner";

interface RideRequest {
    uuid: string;
    rideRequestStatus: number;
    rideStatus?: number;
    rider: Array<{ fullName: string; phone: string }>;
    driver?: Array<{ fullName: string; mobilePhone: string }>;
    pickupAddress: string;
    dropOffAddress: string;
    pickupRequestedTime?: string;
    createdAt?: string;
}

interface RideRequestsProps {
    callbackFn: (uuid: string) => void;
}

export default function RideRequests({ callbackFn }: RideRequestsProps) {

    const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
    const [assignedRides, setAssignedRides] = useState<RideRequest[]>([]);
    const [expandedRideUuid, setExpandedRideUuid] = useState<string | null>(null);
    const [smsModalOpen, setSmsModalOpen] = useState(false);
    const [selectedRideForSms, setSelectedRideForSms] = useState<RideRequest | null>(null);
    const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
    const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    let fetchInterval: NodeJS.Timeout;

    // Helpers to guard optional rider/driver
    const getRider = (ride: RideRequest) => ride?.rider && ride.rider.length > 0 ? ride.rider[0] : undefined;
    const getDriver = (ride: RideRequest) => ride?.driver && ride.driver.length > 0 ? ride.driver[0] : undefined;

    async function startRide(assignedRide: RideRequest) {
        try {
            await updateDocument("riderequests", assignedRide.uuid, { rideStatus: 200 });
            toast.success('Ride started successfully!', {
                description: 'The ride is now in progress.'
            });
            getRideRequests();
        } catch (error) {
            console.error('Error starting ride:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error('Failed to start ride', {
                description: errorMessage
            });
        }
    }

    const openSmsModal = (ride: RideRequest) => {
        setSelectedRideForSms(ride);
        setSmsModalOpen(true);
    };

    const closeSmsModal = () => {
        setSmsModalOpen(false);
        setSelectedRideForSms(null);
    };

    const openUserDetailModal = (user: any, type: 'rider' | 'driver') => {
        setSelectedUserDetail({ ...user, type });
        setUserDetailModalOpen(true);
    };

    const closeUserDetailModal = () => {
        setUserDetailModalOpen(false);
        setSelectedUserDetail(null);
    };

    const getRideRequests = async () => {
        try {
            const fetchedRideRequests = await fetchCollection("riderequests") as RideRequest[];
            if (fetchedRideRequests) {

                const rideReqsSortedByRrStatus = fetchedRideRequests.sort((a, b) => a.rideRequestStatus - b.rideRequestStatus);
                const length = rideReqsSortedByRrStatus.length;

                let pivotIndex = rideReqsSortedByRrStatus.findIndex(rr => parseInt(rr.rideRequestStatus.toString()) >= 400);

                let nonActiveRideReqs: RideRequest[], assignedRides: RideRequest[];

                if (pivotIndex < 0) {
                    nonActiveRideReqs = rideReqsSortedByRrStatus;
                    assignedRides = [];
                }
                else {
                    nonActiveRideReqs = rideReqsSortedByRrStatus.slice(0, pivotIndex);
                    assignedRides = rideReqsSortedByRrStatus.slice(pivotIndex, length);
                }

                // Sort by uuid (timestamp) - most recent first
                nonActiveRideReqs.sort((a, b) => {
                    // Use createdAt if available, fallback to uuid
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.uuid);
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.uuid);
                    return timeB - timeA;
                });
                assignedRides.sort((a, b) => {
                    // Use createdAt if available, fallback to uuid
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.uuid);
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.uuid);
                    return timeB - timeA;
                });

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
        }, 20000);
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
                                                <p className="text-base font-semibold">{getRider(rideRequest)?.fullName || 'Unknown'}</p>
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
                                                className="w-full"
                                                size="sm"
                                            >
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Assign Driver & Vehicle
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            ))
                        )}
                    </div>

                    {/* Desktop View - Table */}
                    <div className="hidden md:block overflow-x-auto rounded-md border">
                        <div className="max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                    <TableHead className="whitespace-nowrap">Request Time</TableHead>
                                    <TableHead className="whitespace-nowrap">Rider</TableHead>
                                    <TableHead className="whitespace-nowrap">Pickup Location</TableHead>
                                    <TableHead className="whitespace-nowrap">Dropoff Location</TableHead>
                                    <TableHead className="whitespace-nowrap">Requested Pickup Time</TableHead>
                                    <TableHead className="whitespace-nowrap">Driver & Vehicle</TableHead>
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
                                            <TableCell className="font-medium text-sm whitespace-nowrap">
                                                {rideRequest.createdAt 
                                                    ? new Date(rideRequest.createdAt).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : rideRequest.uuid 
                                                    ? new Date(Number(rideRequest.uuid)).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : 'N/A'}
                                            </TableCell>
                                            <TableCell className="font-medium whitespace-nowrap">{getRider(rideRequest)?.fullName || 'Unknown'}</TableCell>
                                            <TableCell className="whitespace-nowrap">
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
                                            <TableCell className="whitespace-nowrap">
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
                                            <TableCell className="whitespace-nowrap">
                                                {rideRequest.pickupRequestedTime ?
                                                    new Date(rideRequest.pickupRequestedTime).toLocaleString() :
                                                    'No pickup time set'
                                                }
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <Button
                                                    onClick={() => callbackFn(rideRequest.uuid)}
                                                    size="sm"
                                                    variant="default"
                                                >
                                                    <UserPlus className="h-4 w-4 mr-2" />
                                                    Assign Driver & Vehicle
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        </div>
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
                                                    {getRider(ride) ? (
                                                        <button
                                                            onClick={() => openUserDetailModal(getRider(ride) as any, 'rider')}
                                                            className="text-base font-semibold text-primary hover:underline cursor-pointer text-left"
                                                        >
                                                            {getRider(ride)?.fullName}
                                                        </button>
                                                    ) : (
                                                        <span className="text-base font-semibold">Unknown</span>
                                                    )}
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
                                                    <Clock className="h-4 w-4 mt-1 text-blue-600 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Request Created</p>
                                                        <p className="text-sm">
                                                            {ride.createdAt 
                                                                ? new Date(ride.createdAt).toLocaleString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })
                                                                : ride.uuid 
                                                                ? new Date(Number(ride.uuid)).toLocaleString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })
                                                                : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>

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
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Requested Pickup</p>
                                                        <p className="text-sm">
                                                            {ride.pickupRequestedTime ?
                                                                new Date(ride.pickupRequestedTime).toLocaleString() :
                                                                'No pickup time set'
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator />

                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground mb-1">Driver</p>
                                                {getDriver(ride) ? (
                                                    <button
                                                        onClick={() => openUserDetailModal(getDriver(ride) as any, 'driver')}
                                                        className="text-sm font-semibold text-primary hover:underline cursor-pointer text-left"
                                                    >
                                                        {getDriver(ride)?.fullName}
                                                    </button>
                                                ) : (
                                                    <span className="text-sm font-semibold">Unassigned</span>
                                                )}
                                            </div>

                                            <Button
                                                onClick={() => openSmsModal(ride)}
                                                variant="outline"
                                                className="w-full"
                                                size="sm"
                                            >
                                                <MessageSquare className="h-4 w-4 mr-2" />
                                                View SMS Messages
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            ))
                        )}
                    </div>

                    {/* Desktop View - Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <div className="rounded-md border max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                        <TableHead className="whitespace-nowrap">Request Time</TableHead>
                                        <TableHead className="whitespace-nowrap">Rider</TableHead>
                                        <TableHead className="whitespace-nowrap">Driver</TableHead>
                                        <TableHead className="whitespace-nowrap">Pickup Location</TableHead>
                                        <TableHead className="whitespace-nowrap">Dropoff Location</TableHead>
                                        <TableHead className="whitespace-nowrap">Requested Pickup Time</TableHead>
                                        <TableHead className="whitespace-nowrap">Ride Status</TableHead>
                                        <TableHead className="whitespace-nowrap">SMS</TableHead>
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
                                                <TableRow key={ride.uuid}>
                                                    <TableCell className="font-medium text-sm whitespace-nowrap">
                                                        {ride.createdAt 
                                                            ? new Date(ride.createdAt).toLocaleString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })
                                                            : ride.uuid 
                                                            ? new Date(Number(ride.uuid)).toLocaleString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })
                                                            : 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="font-medium whitespace-nowrap">
                                                        {getRider(ride) ? (
                                                            <button
                                                                onClick={() => openUserDetailModal(getRider(ride) as any, 'rider')}
                                                                className="text-primary hover:underline cursor-pointer text-left"
                                                            >
                                                                {getRider(ride)?.fullName}
                                                            </button>
                                                        ) : (
                                                            <span>Unknown</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium whitespace-nowrap">
                                                        {getDriver(ride) ? (
                                                            <button
                                                                onClick={() => openUserDetailModal(getDriver(ride) as any, 'driver')}
                                                                className="text-primary hover:underline cursor-pointer text-left"
                                                            >
                                                                {getDriver(ride)?.fullName}
                                                            </button>
                                                        ) : (
                                                            <span>Unassigned</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">{ride.pickupAddress}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{ride.dropOffAddress}</TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {ride.pickupRequestedTime ?
                                                            new Date(ride.pickupRequestedTime).toLocaleString() :
                                                            'No pickup time set'
                                                        }
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        <AssignedRideStatus
                                                            onClickFn={() => startRide(ride)}
                                                            rideRequestStatus={ride.rideRequestStatus}
                                                            rideStatus={ride.rideStatus}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        <Button
                                                            onClick={() => openSmsModal(ride)}
                                                            size="sm"
                                                            variant="outline"
                                                        >
                                                            <MessageSquare className="h-4 w-4 mr-2" />
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* SMS Modal */}
            <Dialog open={smsModalOpen} onOpenChange={setSmsModalOpen}>
                <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-4">
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <MessageSquare className="h-6 w-6 text-primary" />
                            SMS Conversation
                        </DialogTitle>
                        <DialogDescription asChild>
                            {selectedRideForSms ? (
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <User className="h-4 w-4" />
                                        {getRider(selectedRideForSms)?.fullName || 'Unknown'}
                                    </span>
                                    <Separator orientation="vertical" className="h-4" />
                                    <span className="flex items-center gap-1.5">
                                        <Phone className="h-4 w-4" />
                                        {getRider(selectedRideForSms)?.phone || 'N/A'}
                                    </span>
                                </div>
                            ) : (
                                <span>Loading conversation...</span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                        {selectedRideForSms && (
                            <SMSConversationModal
                                rideUuid={selectedRideForSms.uuid}
                                riderPhone={getRider(selectedRideForSms)?.phone || ''}
                                driverPhone={getDriver(selectedRideForSms)?.mobilePhone || ''}
                                riderName={getRider(selectedRideForSms)?.fullName || ''}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* User Detail Modal */}
            <UserDetailModal
                isOpen={userDetailModalOpen}
                onClose={closeUserDetailModal}
                user={selectedUserDetail}
                type={selectedUserDetail?.type || 'rider'}
            />
        </div>
    );
}
