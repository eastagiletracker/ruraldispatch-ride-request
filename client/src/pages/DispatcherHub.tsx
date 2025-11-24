import {
  Activity,
  AlertTriangle,
  Car,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRideId } from '@/utils/formatters';
import { getCurrentUser } from '@/utils/permissions';
import { fetchCollection } from '../utils/database';

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
}

export default function DispatcherHub() {
  const [allRides, setAllRides] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  const getRideRequests = async () => {
    try {
      const fetchedRideRequests = (await fetchCollection('riderequests')) as RideRequest[];
      if (fetchedRideRequests) {
        // Sort by creation time - most recent first
        fetchedRideRequests.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.uuid);
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.uuid);
          return timeB - timeA;
        });
        setAllRides(fetchedRideRequests);
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
  }, [getRideRequests]);

  // Calculate metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRides = allRides.filter((ride) => {
    const rideDate = ride.createdAt ? new Date(ride.createdAt) : new Date(Number(ride.uuid));
    rideDate.setHours(0, 0, 0, 0);
    return rideDate.getTime() === today.getTime();
  });

  const unassignedRides = allRides.filter(
    (ride) => parseInt(ride.rideRequestStatus.toString(), 10) < 400
  );

  const activeRides = allRides.filter((ride) => {
    const status = ride.rideStatus || 0;
    return status >= 200 && status < 300;
  });

  const completedRides = allRides.filter((ride) => {
    const status = ride.rideStatus || 0;
    return status >= 300;
  });

  const completedToday = todayRides.filter((ride) => {
    const status = ride.rideStatus || 0;
    return status >= 300;
  });

  // Urgent rides (needed today or sooner, not assigned)
  const urgentRides = unassignedRides.filter((ride) => {
    const pickupTime = ride.pickupRequestedTime ? new Date(ride.pickupRequestedTime) : null;
    if (!pickupTime) return false;
    const hoursDiff = (pickupTime.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursDiff <= 24 && hoursDiff > 0;
  });

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Not specified';

    // Check if it's already a formatted time string (e.g., "10:00 AM")
    if (typeof dateString === 'string' && dateString.match(/^\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)?$/)) {
      return dateString;
    }

    const date = new Date(dateString);

    // Check if date is valid
    if (Number.isNaN(date.getTime())) {
      return dateString; // Return original string if invalid date
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color = 'blue',
  }: {
    title: string;
    value: number;
    icon: any;
    trend?: string;
    color?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );

  const SkeletonCard = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Dispatcher Hub
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Control center for ride management and assignments
          </p>
          {currentUser.fullName && (
            <p className="text-sm text-muted-foreground mt-1">
              Welcome, <span className="font-medium">{currentUser.fullName}</span>
            </p>
          )}
        </div>

        {/* Alerts Section */}
        {!loading && urgentRides.length > 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-900">Urgent Attention Needed</AlertTitle>
            <AlertDescription className="text-orange-800">
              <strong>{urgentRides.length}</strong>{' '}
              {urgentRides.length === 1 ? 'ride needs' : 'rides need'} assignment within 24 hours
            </AlertDescription>
          </Alert>
        )}

        {/* Metrics Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <MetricCard
                title="Unassigned Rides"
                value={unassignedRides.length}
                icon={AlertTriangle}
                color="orange"
                trend={urgentRides.length > 0 ? `${urgentRides.length} urgent` : 'All on schedule'}
              />
              <MetricCard
                title="Active Rides"
                value={activeRides.length}
                icon={Activity}
                color="green"
                trend="In progress now"
              />
              <MetricCard
                title="Completed Today"
                value={completedToday.length}
                icon={CheckCircle2}
                color="blue"
                trend={`${todayRides.length} total today`}
              />
              <MetricCard
                title="Total Rides"
                value={allRides.length}
                icon={Car}
                color="purple"
                trend={`${completedRides.length} completed all-time`}
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common dispatcher tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button onClick={() => navigate('/dashboard')} className="w-full" variant="outline">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                View All Rides
              </Button>
              <Button onClick={() => navigate('/')} className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Ride Request
              </Button>
              <Button
                onClick={() => navigate('/service-provider')}
                className="w-full"
                variant="outline"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Drivers
              </Button>
              <Button onClick={() => navigate('/vehicle')} className="w-full" variant="outline">
                <Car className="h-4 w-4 mr-2" />
                Manage Vehicles
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Unassigned Rides Requiring Attention */}
        {!loading && unassignedRides.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Rides Needing Assignment
                <Badge variant="destructive" className="ml-auto">
                  {unassignedRides.length}
                </Badge>
              </CardTitle>
              <CardDescription>Assign drivers to these pending ride requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unassignedRides.slice(0, 5).map((ride) => (
                  <div
                    key={ride.uuid}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Ride {formatRideId(ride.uuid)}</span>
                        {urgentRides.some((ur) => ur.uuid === ride.uuid) && (
                          <Badge variant="destructive" className="text-xs">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {ride.rider && ride.rider.length > 0 && ride.rider[0].fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDateTime(ride.pickupRequestedTime)}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => navigate('/dashboard')}>
                      Assign
                    </Button>
                  </div>
                ))}
                {unassignedRides.length > 5 && (
                  <div className="text-center pt-2">
                    <Button variant="link" onClick={() => navigate('/dashboard')}>
                      View all {unassignedRides.length} unassigned rides →
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && unassignedRides.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">All rides have been assigned. Great work!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
