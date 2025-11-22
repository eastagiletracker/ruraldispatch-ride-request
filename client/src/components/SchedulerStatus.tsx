import { useQuery } from '@tanstack/react-query';
import { Bell, Calendar, ChevronDown, ChevronUp, Clock, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiUrl } from '@/lib/api';
import { formatRideId } from '@/utils/formatters';

interface ScheduledRide {
  rideUuid: string;
  taskCount: number;
  tasks: string[];
}

interface SchedulerData {
  totalRides: number;
  totalTasks: number;
  rides: ScheduledRide[];
}

interface SchedulerStatusResponse {
  success: boolean;
  scheduler: SchedulerData;
  timestamp: string;
}

/**
 * SchedulerStatus Component
 * Displays scheduled SMS notifications and automated tasks
 * Useful for admin/dispatcher to monitor upcoming ride events
 */
export default function SchedulerStatus() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Use TanStack Query with automatic polling
  const { data, isLoading, error, refetch } = useQuery<SchedulerStatusResponse>({
    queryKey: ['scheduler-status'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/api/notifications/scheduler-status'));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });

  const status = data?.scheduler || null;
  const lastUpdated = data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '';

  const getTaskIcon = (taskName: string) => {
    if (taskName.includes('1_hour_prior')) return <Bell className="w-4 h-4 text-blue-600" />;
    if (taskName.includes('arrival_check')) return <Clock className="w-4 h-4 text-purple-600" />;
    if (taskName.includes('dropoff_check')) return <Calendar className="w-4 h-4 text-green-600" />;
    if (taskName.includes('roundtrip')) return <RefreshCw className="w-4 h-4 text-orange-600" />;
    if (taskName.includes('status_change')) return <Clock className="w-4 h-4 text-indigo-600" />;
    return <Bell className="w-4 h-4 text-gray-600" />;
  };

  const formatTaskName = (taskName: string): string => {
    // Convert snake_case to readable format
    return taskName.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  if (isLoading && !status) {
    return (
      <Card className="border-2">
        <CardHeader>
          <Skeleton className="w-48 h-6" />
          <Skeleton className="w-64 h-4 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-20" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Bell className="w-5 h-5" />
            Scheduler Status
          </CardTitle>
          <CardDescription className="text-red-600">
            Error loading scheduler: {error?.message || 'Unknown error'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <Card className="border-2">
      <CardHeader className="cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Scheduled Tasks
                {!isCollapsed && status && (
                  <Badge variant="secondary" className="ml-2">
                    {status.totalTasks} {status.totalTasks === 1 ? 'task' : 'tasks'}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Automated SMS notifications and status changes</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                refetch();
              }}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" className="px-2">
              {isCollapsed ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronUp className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="space-y-4">
          {/* Summary stats */}
          <div className="flex gap-4 p-4 rounded-lg bg-gray-50">
            <div className="flex-1">
              <div className="text-2xl font-bold text-gray-900">{status.totalRides}</div>
              <div className="text-sm text-gray-600">Active Rides</div>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-blue-600">{status.totalTasks}</div>
              <div className="text-sm text-gray-600">Pending Tasks</div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Last Updated</div>
              <div className="text-sm text-gray-600">{lastUpdated}</div>
            </div>
          </div>

          {/* No scheduled tasks */}
          {status.totalRides === 0 && (
            <div className="py-8 text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="font-medium">No scheduled tasks</p>
              <p className="text-sm">Tasks appear when rides are confirmed</p>
            </div>
          )}

          {/* Scheduled tasks by ride */}
          {status.rides && status.rides.length > 0 && (
            <div className="space-y-3">
              {status.rides.map((ride) => (
                <div
                  key={ride.rideUuid}
                  className="p-4 transition-colors border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        Ride {formatRideId(ride.rideUuid)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {ride.taskCount} {ride.taskCount === 1 ? 'task' : 'tasks'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {ride.tasks.map((task, index) => (
                      <div
                        key={`${ride.rideUuid}-${task}-${index}`}
                        className="flex items-center gap-2 pl-2 text-sm text-gray-700"
                      >
                        {getTaskIcon(task)}
                        <span>{formatTaskName(task)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info footer */}
          <div className="pt-4 text-xs text-gray-500 border-t">
            <p>
              <strong>Note:</strong> Tasks are scheduled based on ride pickup time and status. They
              execute automatically to send SMS notifications to riders and drivers.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
