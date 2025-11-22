import { Clock, MapPin, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatLocalDateTime } from '@/utils/dateUtils';
import { getRider, getRiderName } from './helpers';
import type { RideRequest } from './types';

interface PendingRideCardProps {
  rideRequest: RideRequest;
  onAssignDriver: (uuid: string) => void;
  onCancel: (rideRequest: RideRequest) => void;
  onOpenUserDetail: (user: any, type: 'rider' | 'driver') => void;
}

export function PendingRideCard({
  rideRequest,
  onAssignDriver,
  onCancel,
  onOpenUserDetail,
}: PendingRideCardProps) {
  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rider</p>
              {getRider(rideRequest) ? (
                <button
                  type="button"
                  onClick={() => onOpenUserDetail(getRider(rideRequest) as any, 'rider')}
                  className="cursor-pointer text-left text-base font-semibold text-primary hover:underline"
                >
                  {getRider(rideRequest)?.fullName}
                </button>
              ) : (
                <span className="text-base font-semibold">{getRiderName(rideRequest)}</span>
              )}
            </div>
            <Badge variant="secondary">Pending</Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(rideRequest.pickupAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {rideRequest.pickupAddress}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-red-600" />
              <div>
                <p className="text-xs text-muted-foreground">Dropoff</p>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(rideRequest.dropOffAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {rideRequest.dropOffAddress}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {formatLocalDateTime(rideRequest.pickupRequestedTime) || 'No pickup time set'}
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => onCancel(rideRequest)}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => onAssignDriver(rideRequest.uuid)}
              className="flex-1"
              size="sm"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assign Driver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
