import {rideStatuses} from "../constants/rideRequestStatuses";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AssignedRideStatusProps {
    onClickFn: () => void;
    rideRequestStatus: number;
    rideStatus: number;
    isLoading?: boolean;
}

export default function AssignedRideStatus({onClickFn, rideRequestStatus, rideStatus, isLoading = false}: AssignedRideStatusProps) {

    let output;

    if (rideRequestStatus === 1000 && rideStatus === 100 ) {
        output = (
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
                    'Start Ride'
                )}
            </Button>
        );
    }
    else
    {
        output = (
            <span className="text-sm font-medium">{rideStatuses[rideStatus]}</span>
        )
    }

    return output;
}