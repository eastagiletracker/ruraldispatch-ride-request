import { RIDE_REQUEST_STATUSES, RIDE_STATUSES } from '@shared/schemas';
import {
  Car,
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  MessageSquare,
  Phone,
  User,
  UserPlus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { exportRideRequestsToCSV } from '@/utils/csvExport';
import { formatLocalDateTime } from '@/utils/dateUtils';
import { fetchCollection, updateDocument } from '../utils/database';
import AssignedRideStatus from './AssignedRideStatus';
import SMSConversationModal from './SMSConversationModal';
import { UserDetailModal } from './UserDetailModal';

interface RideRequest {
  uuid: string;
  rideRequestStatus: number;
  rideStatus?: number;
  rider: Array<{ fullName: string; phone: string }>;
  driver?: Array<{ fullName: string; mobilePhone: string }>;
  serviceUserName?: string;
  serviceUserPhone?: string;
  pickupAddress: string;
  dropOffAddress: string;
  pickupRequestedTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RideRequestsProps {
  callbackFn: (uuid: string) => void;
}

export default function RideRequests({ callbackFn }: RideRequestsProps) {
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [assignedRides, setAssignedRides] = useState<RideRequest[]>([]);
  const [completedRides, setCompletedRides] = useState<RideRequest[]>([]);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [selectedRideForSms, setSelectedRideForSms] = useState<RideRequest | null>(null);
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rideRequestToCancel, setRideRequestToCancel] = useState<RideRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingRide, setStartingRide] = useState<string | null>(null);

  let fetchInterval: NodeJS.Timeout;

  // Helpers to guard optional rider/driver
  const getRider = (ride: RideRequest) =>
    ride?.rider && ride.rider.length > 0 ? ride.rider[0] : undefined;
  const getDriver = (ride: RideRequest) =>
    ride?.driver && ride.driver.length > 0 ? ride.driver[0] : undefined;

  // Helper to get rider name with fallback to serviceUserName
  const getRiderName = (ride: RideRequest) => {
    const rider = getRider(ride);
    return rider?.fullName || ride?.serviceUserName || 'Unknown';
  };

  async function startRide(assignedRide: RideRequest) {
    setStartingRide(assignedRide.uuid);
    try {
      await updateDocument('riderequests', assignedRide.uuid, { rideStatus: 200 });
      toast.success('Ride started successfully!', {
        description: 'The ride is now in progress.',
      });
      getRideRequests();
    } catch (error) {
      console.error('Error starting ride:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Failed to start ride', {
        description: errorMessage,
      });
    } finally {
      setStartingRide(null);
    }
  }

  const exportToCSV = () => {
    exportRideRequestsToCSV(rideRequests, assignedRides, completedRides);
  };

  async function cancelRideRequest(rideRequest: RideRequest) {
    try {
      await updateDocument('riderequests', rideRequest.uuid, {
        rideRequestStatus: RIDE_REQUEST_STATUSES.ALL_RIDE_REQUEST_CANCELED,
      });
      toast.success('Ride request cancelled successfully!', {
        description: `Request for ${rideRequest.rider?.[0]?.fullName || 'rider'} has been cancelled.`,
      });
      closeCancelModal();
      getRideRequests();
    } catch (error) {
      console.error('Error cancelling ride request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Failed to cancel ride request', {
        description: errorMessage,
      });
    }
  }

  const openSmsModal = (ride: RideRequest) => {
    setSelectedRideForSms(ride);
    setSmsModalOpen(true);
  };

  const openUserDetailModal = (user: any, type: 'rider' | 'driver') => {
    setSelectedUserDetail({ ...user, type });
    setUserDetailModalOpen(true);
  };

  const closeUserDetailModal = () => {
    setUserDetailModalOpen(false);
    setSelectedUserDetail(null);
  };

  const openCancelModal = (rideRequest: RideRequest) => {
    setRideRequestToCancel(rideRequest);
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setCancelModalOpen(false);
    setRideRequestToCancel(null);
  };

  const getRideRequests = async () => {
    try {
      const fetchedRideRequests = (await fetchCollection('riderequests')) as RideRequest[];
      if (fetchedRideRequests) {
        const rideReqsSortedByRrStatus = fetchedRideRequests.sort(
          (a, b) => a.rideRequestStatus - b.rideRequestStatus
        );
        const length = rideReqsSortedByRrStatus.length;

        const pivotIndex = rideReqsSortedByRrStatus.findIndex(
          (rr) =>
            parseInt(rr.rideRequestStatus.toString()) >=
            RIDE_REQUEST_STATUSES.RIDE_CONFIRMATION_NEEDED
        );

        let nonActiveRideReqs: RideRequest[],
          activeRides: RideRequest[],
          completedRides: RideRequest[];

        if (pivotIndex < 0) {
          nonActiveRideReqs = rideReqsSortedByRrStatus;
          activeRides = [];
          completedRides = [];
        } else {
          nonActiveRideReqs = rideReqsSortedByRrStatus.slice(0, pivotIndex);
          const assignedRides = rideReqsSortedByRrStatus.slice(pivotIndex, length);

          // Separate assigned rides into active and completed
          // Active: status < 400 OR status = 450 (roundtrip returning - still in progress)
          // Completed: status >= 400 but NOT 450 (roundtrip returning)
          activeRides = assignedRides.filter((ride) => {
            const status = parseInt(ride.rideStatus?.toString() || '0');
            return (
              status < RIDE_STATUSES.RIDER_DROPPED_OFF ||
              status === RIDE_STATUSES.ROUNDTRIP_RETURNING
            ); // Keep returning rides in active
          });
          completedRides = assignedRides.filter((ride) => {
            const status = parseInt(ride.rideStatus?.toString() || '0');
            return (
              status >= RIDE_STATUSES.RIDER_DROPPED_OFF &&
              status !== RIDE_STATUSES.ROUNDTRIP_RETURNING
            ); // Move returning rides to active
          });
        }

        // Sort by uuid (timestamp) - most recent first
        nonActiveRideReqs.sort((a, b) => {
          // Use createdAt if available, fallback to uuid lexicographic comparison
          // UUIDv7 can be sorted as strings (timestamp prefix)
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          // Fallback to UUIDv7 string comparison (descending)
          return b.uuid.localeCompare(a.uuid);
        });
        activeRides.sort((a, b) => {
          // Sort by pickupRequestedTime (most urgent first)
          if (a.pickupRequestedTime && b.pickupRequestedTime) {
            return (
              new Date(a.pickupRequestedTime).getTime() - new Date(b.pickupRequestedTime).getTime()
            );
          }
          // Fallback to UUIDv7 string comparison (ascending)
          return a.uuid.localeCompare(b.uuid);
        });
        completedRides.sort((a, b) => {
          // Sort by createdAt (most recent first)
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          // Fallback to UUIDv7 string comparison (descending)
          return b.uuid.localeCompare(a.uuid);
        });

        setRideRequests(nonActiveRideReqs);
        setAssignedRides(activeRides);
        setCompletedRides(completedRides);
      }
    } catch (error) {
      console.error('Error fetching ride requests:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-20" />
      </TableCell>
    </TableRow>
  );

  const SkeletonTableRowAssigned = () => (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-20" />
      </TableCell>
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
    <div className="space-y-6">
      {/* Pending Ride Requests Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Pending Ride Requests
              </CardTitle>
              <CardDescription>
                {loading
                  ? 'Loading...'
                  : rideRequests.length === 0
                    ? 'No pending ride requests'
                    : `${rideRequests.length} ride${rideRequests.length > 1 ? 's' : ''} awaiting assignment`}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={
                loading ||
                (rideRequests.length === 0 &&
                  assignedRides.length === 0 &&
                  completedRides.length === 0)
              }
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
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
                          {getRider(rideRequest) ? (
                            <button
                              onClick={() =>
                                openUserDetailModal(getRider(rideRequest) as any, 'rider')
                              }
                              className="text-base font-semibold text-primary hover:underline cursor-pointer text-left"
                            >
                              {getRider(rideRequest)?.fullName}
                            </button>
                          ) : (
                            <span className="text-base font-semibold">
                              {getRiderName(rideRequest)}
                            </span>
                          )}
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
                              href={`https://www.google.com/maps/search/${encodeURIComponent(rideRequest.pickupAddress)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
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
                              href={`https://www.google.com/maps/search/${encodeURIComponent(rideRequest.dropOffAddress)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              {rideRequest.dropOffAddress}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatLocalDateTime(rideRequest.pickupRequestedTime) ||
                              'No pickup time set'}
                          </span>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex gap-2">
                        <Button
                          onClick={() => openCancelModal(rideRequest)}
                          variant="outline"
                          className="flex-1"
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => callbackFn(rideRequest.uuid)}
                          className="flex-1"
                          size="sm"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign Driver
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
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
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
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No pending ride requests
                      </TableCell>
                    </TableRow>
                  ) : (
                    rideRequests.map((rideRequest) => (
                      <TableRow key={rideRequest.uuid}>
                        <TableCell className="font-medium text-sm whitespace-nowrap">
                          {formatLocalDateTime(rideRequest.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {getRider(rideRequest) ? (
                            <button
                              onClick={() =>
                                openUserDetailModal(getRider(rideRequest) as any, 'rider')
                              }
                              className="text-primary hover:underline cursor-pointer text-left"
                            >
                              {getRider(rideRequest)?.fullName}
                            </button>
                          ) : (
                            <span>{getRiderName(rideRequest)}</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <a
                            href={`https://www.google.com/maps/search/${encodeURIComponent(rideRequest.pickupAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <MapPin className="h-3 w-3" />
                            {rideRequest.pickupAddress}
                          </a>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <a
                            href={`https://www.google.com/maps/search/${encodeURIComponent(rideRequest.dropOffAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <MapPin className="h-3 w-3" />
                            {rideRequest.dropOffAddress}
                          </a>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {rideRequest.pickupRequestedTime
                            ? formatLocalDateTime(rideRequest.pickupRequestedTime)
                            : 'No pickup time set'}
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
                        <TableCell className="whitespace-nowrap">
                          <Button
                            onClick={() => openCancelModal(rideRequest)}
                            size="sm"
                            variant="outline"
                          >
                            Cancel
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
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Assigned Rides
              </CardTitle>
              <CardDescription>
                {loading
                  ? 'Loading...'
                  : assignedRides.length === 0
                    ? 'No assigned rides'
                    : `${assignedRides.length} active ride${assignedRides.length > 1 ? 's' : ''}`}
              </CardDescription>
            </div>
            {/* Status Legend */}
            <div className="hidden lg:flex flex-col gap-2 text-xs">
              <div className="font-semibold text-muted-foreground mb-1">Status Legend:</div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                  <span className="text-muted-foreground">Confirmed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-purple-600"></div>
                  <span className="text-muted-foreground">In Progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                  <span className="text-muted-foreground">En Route</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-teal-600"></div>
                  <span className="text-muted-foreground">Dropped Off</span>
                </div>
              </div>
            </div>
          </div>
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
                              <span className="text-base font-semibold">{getRiderName(ride)}</span>
                            )}
                          </div>
                          <AssignedRideStatus
                            onClickFn={() => startRide(ride)}
                            rideRequestStatus={ride.rideRequestStatus}
                            rideStatus={ride.rideStatus}
                            isLoading={startingRide === ride.uuid}
                          />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 mt-1 text-blue-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Request Created</p>
                              <p className="text-sm">{formatLocalDateTime(ride.createdAt)}</p>
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
                                {ride.pickupRequestedTime
                                  ? formatLocalDateTime(ride.pickupRequestedTime)
                                  : 'No pickup time set'}
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

                        <div className="flex gap-2">
                          <Button
                            onClick={() => callbackFn(ride.uuid)}
                            variant="outline"
                            className="flex-1"
                            size="sm"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Edit Assignment
                          </Button>
                          <Button
                            onClick={() => openSmsModal(ride)}
                            variant="outline"
                            className="flex-1"
                            size="sm"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View SMS
                          </Button>
                        </div>
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
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
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
                          {formatLocalDateTime(ride.createdAt)}
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
                            <span>{getRiderName(ride)}</span>
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
                        <TableCell className="whitespace-nowrap">
                          <a
                            href={`https://www.google.com/maps/search/${encodeURIComponent(ride.pickupAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <MapPin className="h-3 w-3" />
                            {ride.pickupAddress}
                          </a>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <a
                            href={`https://www.google.com/maps/search/${encodeURIComponent(ride.dropOffAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <MapPin className="h-3 w-3" />
                            {ride.dropOffAddress}
                          </a>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {ride.pickupRequestedTime
                            ? formatLocalDateTime(ride.pickupRequestedTime)
                            : 'No pickup time set'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <AssignedRideStatus
                            onClickFn={() => startRide(ride)}
                            rideRequestStatus={ride.rideRequestStatus}
                            rideStatus={ride.rideStatus}
                            isLoading={startingRide === ride.uuid}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => callbackFn(ride.uuid)}
                              size="sm"
                              variant="outline"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button onClick={() => openSmsModal(ride)} size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              SMS
                            </Button>
                          </div>
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

      {/* Completed Rides Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Completed Rides
          </CardTitle>
          <CardDescription>
            {loading
              ? 'Loading...'
              : completedRides.length === 0
                ? 'No completed rides'
                : `${completedRides.length} completed ride${completedRides.length > 1 ? 's' : ''}`}
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
              completedRides.map((ride) => (
                <div key={ride.uuid} className="space-y-2">
                  <Card className="border-2 border-green-200 bg-green-50/30">
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
                              <span className="text-base font-semibold">{getRiderName(ride)}</span>
                            )}
                          </div>
                          <AssignedRideStatus
                            onClickFn={() => {}}
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
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <>
                      <SkeletonTableRowAssigned />
                      <SkeletonTableRowAssigned />
                    </>
                  ) : completedRides.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No completed rides
                      </TableCell>
                    </TableRow>
                  ) : (
                    completedRides.map((ride) => (
                      <TableRow key={ride.uuid} className="bg-green-50/30">
                        <TableCell className="font-medium text-sm whitespace-nowrap">
                          {formatLocalDateTime(ride.createdAt)}
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
                            <span>{getRiderName(ride)}</span>
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
                        <TableCell className="whitespace-nowrap">
                          <a
                            href={`https://www.google.com/maps/search/${encodeURIComponent(ride.pickupAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <MapPin className="h-3 w-3" />
                            {ride.pickupAddress}
                          </a>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <a
                            href={`https://www.google.com/maps/search/${encodeURIComponent(ride.dropOffAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <MapPin className="h-3 w-3" />
                            {ride.dropOffAddress}
                          </a>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <AssignedRideStatus
                            onClickFn={() => {}}
                            rideRequestStatus={ride.rideRequestStatus}
                            rideStatus={ride.rideStatus}
                          />
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

      {/* Cancel Confirmation Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Ride Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this ride request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {rideRequestToCancel && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Rider</p>
                  <p className="text-sm text-muted-foreground">
                    {rideRequestToCancel.rider?.[0]?.fullName || 'Unknown Rider'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Pickup</p>
                  <p className="text-sm text-muted-foreground">
                    {rideRequestToCancel.pickupAddress}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Dropoff</p>
                  <p className="text-sm text-muted-foreground">
                    {rideRequestToCancel.dropOffAddress}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={closeCancelModal}>
              Keep Request
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => rideRequestToCancel && cancelRideRequest(rideRequestToCancel)}
            >
              Cancel Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
