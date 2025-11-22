import { RIDE_REQUEST_STATUSES, RIDE_STATUSES } from '@shared/schemas';
import { Car, CheckCircle2, Clock, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { exportRideRequestsToCSV } from '@/utils/csvExport';
import { fetchCollection, updateDocument } from '@/utils/database';
import { UserDetailModal } from '../UserDetailModal';
import { AssignedRideCard } from './AssignedRideCard';
import { AssignedRideRow } from './AssignedRideRow';
import { CancelRideModal } from './CancelRideModal';
import { CompletedRideCard } from './CompletedRideCard';
import { CompletedRideRow } from './CompletedRideRow';
import { PendingRideCard } from './PendingRideCard';
import { PendingRideRow } from './PendingRideRow';
import { SkeletonCard, SkeletonTableRow, SkeletonTableRowAssigned } from './SkeletonComponents';
import { SmsModal } from './SmsModal';
import type { RideRequest, RideRequestsProps } from './types';

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
            parseInt(rr.rideRequestStatus.toString(), 10) >=
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
            const status = parseInt(ride.rideStatus?.toString() || '0', 10);
            return (
              status < RIDE_STATUSES.RIDER_DROPPED_OFF ||
              status === RIDE_STATUSES.ROUNDTRIP_RETURNING
            ); // Keep returning rides in active
          });
          completedRides = assignedRides.filter((ride) => {
            const status = parseInt(ride.rideStatus?.toString() || '0', 10);
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
              type="button"
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
          <div className="space-y-4 md:hidden">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              rideRequests.map((rideRequest) => (
                <PendingRideCard
                  key={rideRequest.uuid}
                  rideRequest={rideRequest}
                  onAssignDriver={callbackFn}
                  onCancel={openCancelModal}
                  onOpenUserDetail={openUserDetailModal}
                />
              ))
            )}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden overflow-x-auto rounded-md border md:block">
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
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
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        No pending ride requests
                      </TableCell>
                    </TableRow>
                  ) : (
                    rideRequests.map((rideRequest) => (
                      <PendingRideRow
                        key={rideRequest.uuid}
                        rideRequest={rideRequest}
                        onAssignDriver={callbackFn}
                        onCancel={openCancelModal}
                        onOpenUserDetail={openUserDetailModal}
                      />
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
            <div className="hidden flex-col gap-2 text-xs lg:flex">
              <div className="mb-1 font-semibold text-muted-foreground">Status Legend:</div>
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
          <div className="space-y-4 md:hidden">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              assignedRides.map((ride) => (
                <AssignedRideCard
                  key={ride.uuid}
                  ride={ride}
                  onStartRide={startRide}
                  onEditAssignment={callbackFn}
                  onOpenSms={openSmsModal}
                  onOpenUserDetail={openUserDetailModal}
                  startingRide={startingRide}
                />
              ))
            )}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden overflow-x-auto md:block">
            <div className="max-h-[600px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
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
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        No assigned rides
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignedRides.map((ride) => (
                      <AssignedRideRow
                        key={ride.uuid}
                        ride={ride}
                        onStartRide={startRide}
                        onEditAssignment={callbackFn}
                        onOpenSms={openSmsModal}
                        onOpenUserDetail={openUserDetailModal}
                        startingRide={startingRide}
                      />
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
          <div className="space-y-4 md:hidden">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              completedRides.map((ride) => (
                <CompletedRideCard
                  key={ride.uuid}
                  ride={ride}
                  onOpenUserDetail={openUserDetailModal}
                />
              ))
            )}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden overflow-x-auto md:block">
            <div className="max-h-[600px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
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
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        No completed rides
                      </TableCell>
                    </TableRow>
                  ) : (
                    completedRides.map((ride) => (
                      <CompletedRideRow
                        key={ride.uuid}
                        ride={ride}
                        onOpenUserDetail={openUserDetailModal}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <SmsModal
        isOpen={smsModalOpen}
        onClose={() => setSmsModalOpen(false)}
        ride={selectedRideForSms}
      />

      <UserDetailModal
        isOpen={userDetailModalOpen}
        onClose={closeUserDetailModal}
        user={selectedUserDetail}
        type={selectedUserDetail?.type || 'rider'}
      />

      <CancelRideModal
        isOpen={cancelModalOpen}
        onClose={closeCancelModal}
        rideRequest={rideRequestToCancel}
        onConfirm={cancelRideRequest}
      />
    </div>
  );
}
