import { useEffect, useState } from 'react';
import { fetchCollection } from "../utils/database";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { UserPlus, Car } from "lucide-react";
import type { RideRequest, User } from "@/types";

interface ActiveRidesProps {
    callbackFn: (uuid: string | number) => void;
}

export default function ActiveRides({ callbackFn }: ActiveRidesProps) {
    const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const getRideRequests = async () => {
        try {
            const rideRequests = await fetchCollection<RideRequest>("riderequests");
            if (rideRequests) {
                const sortedRideRequests = rideRequests.sort((a, b) => {
                    // Sort by pickup requested time (soonest first)
                    const timeA = new Date(a.pickupRequestedTime || 0);
                    const timeB = new Date(b.pickupRequestedTime || 0);
                    return timeA.getTime() - timeB.getTime();
                });
                
                // Then sort by createdAt (most recent first) for secondary sorting
                const finalSorted = sortedRideRequests.sort((a, b) => {
                    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.uuid);
                    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.uuid);
                    return createdB - createdA;
                });
                
                setRideRequests(finalSorted);
            }
        } catch (error) {
            console.error('Error fetching ride requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUsers = async () => {
        try {
            const users = await fetchCollection<User>("users");
            setUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        getRideRequests();
        getUsers();
        const interval = setInterval(async () => {
            getRideRequests();
            getUsers();
        }, 20000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Ride Requests</CardTitle>
                <CardDescription>
                    Active ride requests awaiting driver assignment
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Loading ride requests...
                    </div>
                ) : rideRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No active ride requests
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="whitespace-nowrap">Request Time</TableHead>
                                    <TableHead className="whitespace-nowrap">Rider</TableHead>
                                    <TableHead className="whitespace-nowrap">Pickup Location</TableHead>
                                    <TableHead className="whitespace-nowrap">Dropoff Location</TableHead>
                                    <TableHead className="whitespace-nowrap">Requested Pickup Time</TableHead>
                                    <TableHead className="whitespace-nowrap">Driver</TableHead>
                                    <TableHead className="whitespace-nowrap">Vehicle</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rideRequests.map((rideRequest) => {
                                    const rider = users.find(user => user.uuid === rideRequest.serviceUserUuid);
                                    return (
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
                                            <TableCell className="font-medium whitespace-nowrap">
                                                {rider?.fullName || 'Unknown Rider'}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">{rideRequest.pickupAddress}</TableCell>
                                            <TableCell className="whitespace-nowrap">{rideRequest.dropOffAddress}</TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {rideRequest.pickupRequestedTime
                                                    ? new Date(rideRequest.pickupRequestedTime).toLocaleString()
                                                    : 'No pickup time set'}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => callbackFn(rideRequest.uuid)}
                                                >
                                                    <UserPlus className="h-4 w-4 mr-2" />
                                                    Assign Driver
                                                </Button>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Car className="h-4 w-4 mr-2" />
                                                    Assign Vehicle
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
