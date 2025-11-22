import { Clock, MapPin, MessageSquare, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatLocalDateTime } from '@/utils/dateUtils';
import AssignedRideStatus from '../AssignedRideStatus';
import { getDriver, getRider, getRiderName } from './helpers';
import type { RideRequest } from './types';

interface AssignedRideCardProps {
  ride: RideRequest;
  onStartRide: (ride: RideRequest) => void;
  onEditAssignment: (uuid: string) => void;
  onOpenSms: (ride: RideRequest) => void;
  onOpenUserDetail: (user: any, type: 'rider' | 'driver') => void;
  startingRide: string | null;
}

export function AssignedRideCard({
  ride,
  onStartRide,
  onEditAssignment,
  onOpenSms,
  onOpenUserDetail,
  startingRide,
}: AssignedRideCardProps) {
  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rider</p>
              {getRider(ride) ? (
                <button
                  type="button"
                  onClick={() => onOpenUserDetail(getRider(ride) as any, 'rider')}
                  className="cursor-pointer text-left text-base font-semibold text-primary hover:underline"
                >
                  {getRider(ride)?.fullName}
                </button>
              ) : (
                <span className="text-base font-semibold">{getRiderName(ride)}</span>
              )}
            </div>
            <AssignedRideStatus
              onClickFn={() => onStartRide(ride)}
              rideRequestStatus={ride.rideRequestStatus}
              rideStatus={ride.rideStatus}
              isLoading={startingRide === ride.uuid}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Clock className="mt-1 h-4 w-4 flex-shrink-0 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Request Created</p>
                <p className="text-sm">{formatLocalDateTime(ride.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="text-sm">{ride.pickupAddress}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-red-600" />
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
            <p className="mb-1 text-sm font-medium text-muted-foreground">Driver</p>
            {getDriver(ride) ? (
              <button
                type="button"
                onClick={() => onOpenUserDetail(getDriver(ride) as any, 'driver')}
                className="cursor-pointer text-left text-sm font-semibold text-primary hover:underline"
              >
                {getDriver(ride)?.fullName}
              </button>
            ) : (
              <span className="text-sm font-semibold">Unassigned</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => onEditAssignment(ride.uuid)}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Edit Assignment
            </Button>
            <Button
              type="button"
              onClick={() => onOpenSms(ride)}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              View SMS
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
