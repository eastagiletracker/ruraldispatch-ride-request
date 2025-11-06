import { useEffect, useState } from 'react';
import { fetchCollection } from "../utils/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { UserPlus, Car } from "lucide-react";

export default function ActiveRides({ callbackFn }) {
    const [rideRequests, setRideRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const getRideRequests = async () => {
        try {
            console.log('Fetching ride requests...');
            const rideRequests = await fetchCollection("riderequests");
            console.log('Ride requests:', rideRequests);
            if (rideRequests) {
                const sortedRideRequests = rideRequests.sort((a, b) => {
                    // Sort by pickup requested time (soonest first)
                    const timeA = new Date(a.pickupRequestedTime || 0);
                    const timeB = new Date(b.pickupRequestedTime || 0);
                    return timeA.getTime() - timeB.getTime();
                });
                setRideRequests(sortedRideRequests);
            }
        } catch (error) {
            console.error('Error fetching ride requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUsers = async () => {
        try {
            const users = await fetchCollection("users");
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
        }, 5000);

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
                    <div className="rounded-md border">
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
                                {rideRequests.map((rideRequest) => {
                                    const rider = users.find(user => user.uuid === rideRequest.serviceUserUuid);
                                    return (
                                        <TableRow key={rideRequest.uuid}>
                                            <TableCell className="font-medium">
                                                {rider?.fullName || 'Unknown Rider'}
                                            </TableCell>
                                            <TableCell>{rideRequest.pickupAddress}</TableCell>
                                            <TableCell>{rideRequest.dropOffAddress}</TableCell>
                                            <TableCell>
                                                {rideRequest.pickupRequestedTime
                                                    ? new Date(rideRequest.pickupRequestedTime).toLocaleString()
                                                    : 'No pickup time set'}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => callbackFn(rideRequest.uuid)}
                                                >
                                                    <UserPlus className="h-4 w-4 mr-2" />
                                                    Assign Driver
                                                </Button>
                                            </TableCell>
                                            <TableCell>
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
