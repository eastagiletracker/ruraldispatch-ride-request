import { MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AssignedRideStatus from '../AssignedRideStatus';
import { getDriver, getRider, getRiderName } from './helpers';
import type { RideRequest } from './types';

interface CompletedRideCardProps {
  ride: RideRequest;
  onOpenUserDetail: (user: any, type: 'rider' | 'driver') => void;
}

export function CompletedRideCard({ ride, onOpenUserDetail }: CompletedRideCardProps) {
  return (
    <Card className="border-2 border-green-200 bg-green-50/30">
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
              onClickFn={() => {}}
              rideRequestStatus={ride.rideRequestStatus}
              rideStatus={ride.rideStatus}
            />
          </div>

          <Separator />

          <div className="space-y-2">
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
        </div>
      </CardContent>
    </Card>
  );
}
