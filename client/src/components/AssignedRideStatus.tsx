import { RIDE_STATUSES, RIDE_STATUS_DESCRIPTIONS, RIDE_REQUEST_STATUSES } from "@shared/schemas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlayCircle, Navigation, UserCheck, MapPin, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssignedRideStatusProps {
    onClickFn: () => void;
    rideRequestStatus: number;
    rideStatus: number | undefined;
    isLoading?: boolean;
}

// Status configuration with colors and icons
const getStatusConfig = (rideStatus: number | undefined) => {
    switch(rideStatus) {
        case RIDE_STATUSES.REQUEST_IN_PROGRESS: // 0
            return {
                label: "Pending",
                icon: AlertTriangle,
                variant: "secondary" as const,
                className: "bg-gray-100 text-gray-700 border-gray-300"
            };
        case RIDE_STATUSES.RIDE_CONFIRMED: // 100
            return {
                label: "Confirmed",
                icon: CheckCircle2,
                variant: "outline" as const,
                className: "bg-blue-50 text-blue-700 border-blue-300"
            };
        case RIDE_STATUSES.RIDE_CANCELED_BY_RIDER: // 109
            return {
                label: "Canceled",
                icon: XCircle,
                variant: "destructive" as const,
                className: "bg-red-50 text-red-700 border-red-300"
            };
        case RIDE_STATUSES.RIDE_STARTED: // 200
            return {
                label: "In Progress",
                icon: Navigation,
                variant: "default" as const,
                className: "bg-purple-100 text-purple-700 border-purple-300"
            };
        case RIDE_STATUSES.RIDE_INTERRUPTED: // 209
            return {
                label: "Interrupted",
                icon: AlertTriangle,
                variant: "destructive" as const,
                className: "bg-orange-100 text-orange-700 border-orange-300"
            };
        case RIDE_STATUSES.RIDER_PICKED_UP: // 300
            return {
                label: "En Route",
                icon: UserCheck,
                variant: "default" as const,
                className: "bg-indigo-100 text-indigo-700 border-indigo-300"
            };
        case RIDE_STATUSES.RIDER_NOT_PICKED_UP: // 309
            return {
                label: "Not Picked Up",
                icon: XCircle,
                variant: "destructive" as const,
                className: "bg-red-100 text-red-700 border-red-300"
            };
        case RIDE_STATUSES.RIDER_DROPPED_OFF: // 400
            return {
                label: "Dropped Off",
                icon: MapPin,
                variant: "default" as const,
                className: "bg-teal-100 text-teal-700 border-teal-300"
            };
        case RIDE_STATUSES.RIDE_COMPLETE: // 500
            return {
                label: "Complete",
                icon: CheckCircle2,
                variant: "default" as const,
                className: "bg-green-100 text-green-700 border-green-300"
            };
        case RIDE_STATUSES.RIDE_INCOMPLETE: // 509
            return {
                label: "Incomplete",
                icon: XCircle,
                variant: "destructive" as const,
                className: "bg-red-100 text-red-700 border-red-300"
            };
        default:
            return {
                label: RIDE_STATUS_DESCRIPTIONS[rideStatus as number] || "Unknown",
                icon: AlertTriangle,
                variant: "secondary" as const,
                className: "bg-gray-100 text-gray-700 border-gray-300"
            };
    }
};

export default function AssignedRideStatus({onClickFn, rideRequestStatus, rideStatus, isLoading = false}: AssignedRideStatusProps) {

    // Ready to start - show button
    if (rideRequestStatus === RIDE_REQUEST_STATUSES.ALL_RIDE_REQUEST_READY_TO_RIDE && rideStatus === RIDE_STATUSES.RIDE_CONFIRMED) {
        return (
            <Button 
                onClick={onClickFn} 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                    </>
                ) : (
                    <>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start Ride
                    </>
                )}
            </Button>
        );
    }

    // Show status badge
    const config = getStatusConfig(rideStatus);
    const Icon = config.icon;

    return (
        <Badge 
            variant={config.variant} 
            className={cn("flex items-center gap-1.5 px-3 py-1 border pointer-events-none", config.className)}
        >
            <Icon className="h-3.5 w-3.5" />
            {config.label}
        </Badge>
    );
}