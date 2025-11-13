import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, Bell, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRideId } from "@/utils/formatters";

interface SchedulerTask {
    taskName: string;
}

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
    const [status, setStatus] = useState<SchedulerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [isCollapsed, setIsCollapsed] = useState(false);

    const fetchSchedulerStatus = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/notifications/scheduler-status');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: SchedulerStatusResponse = await response.json();

            if (data.success) {
                setStatus(data.scheduler);
                setLastUpdated(new Date(data.timestamp).toLocaleTimeString());
            } else {
                throw new Error('Failed to fetch scheduler status');
            }
        } catch (err) {
            console.error('Error fetching scheduler status:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedulerStatus();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchSchedulerStatus, 30000);

        return () => clearInterval(interval);
    }, []);

    const getTaskIcon = (taskName: string) => {
        if (taskName.includes('1_hour_prior')) return <Bell className="h-4 w-4 text-blue-600" />;
        if (taskName.includes('arrival_check')) return <Clock className="h-4 w-4 text-purple-600" />;
        if (taskName.includes('dropoff_check')) return <Calendar className="h-4 w-4 text-green-600" />;
        if (taskName.includes('roundtrip')) return <RefreshCw className="h-4 w-4 text-orange-600" />;
        if (taskName.includes('status_change')) return <Clock className="h-4 w-4 text-indigo-600" />;
        return <Bell className="h-4 w-4 text-gray-600" />;
    };

    const formatTaskName = (taskName: string): string => {
        // Convert snake_case to readable format
        return taskName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    if (loading && !status) {
        return (
            <Card className="border-2">
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-2 border-red-200">
                <CardHeader>
                    <CardTitle className="text-red-700 flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Scheduler Status
                    </CardTitle>
                    <CardDescription className="text-red-600">
                        Error loading scheduler: {error}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={fetchSchedulerStatus} variant="outline" size="sm">
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
                    <div className="flex items-center gap-3 flex-1">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5 text-blue-600" />
                                Scheduled Tasks
                                {!isCollapsed && status && (
                                    <Badge variant="secondary" className="ml-2">
                                        {status.totalTasks} {status.totalTasks === 1 ? 'task' : 'tasks'}
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Automated SMS notifications and status changes
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                fetchSchedulerStatus();
                            }}
                            variant="outline"
                            size="sm"
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="px-2"
                        >
                            {isCollapsed ? (
                                <ChevronDown className="h-5 w-5" />
                            ) : (
                                <ChevronUp className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            {!isCollapsed && (
                <CardContent className="space-y-4">
                {/* Summary stats */}
                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
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
                    <div className="text-center py-8 text-gray-500">
                        <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
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
                                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
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
                                            key={index}
                                            className="flex items-center gap-2 text-sm text-gray-700 pl-2"
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
                <div className="pt-4 border-t text-xs text-gray-500">
                    <p>
                        <strong>Note:</strong> Tasks are scheduled based on ride pickup time and status.
                        They execute automatically to send SMS notifications to riders and drivers.
                    </p>
                </div>
                </CardContent>
            )}
        </Card>
    );
}
