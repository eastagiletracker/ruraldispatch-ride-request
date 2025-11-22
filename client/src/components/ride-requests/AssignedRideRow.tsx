import { MapPin, MessageSquare, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatLocalDateTime } from '@/utils/dateUtils';
import AssignedRideStatus from '../AssignedRideStatus';
import { getDriver, getRider, getRiderName } from './helpers';
import type { RideRequest } from './types';

interface AssignedRideRowProps {
  ride: RideRequest;
  onStartRide: (ride: RideRequest) => void;
  onEditAssignment: (uuid: string) => void;
  onOpenSms: (ride: RideRequest) => void;
  onOpenUserDetail: (user: any, type: 'rider' | 'driver') => void;
  startingRide: string | null;
}

export function AssignedRideRow({
  ride,
  onStartRide,
  onEditAssignment,
  onOpenSms,
  onOpenUserDetail,
  startingRide,
}: AssignedRideRowProps) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-sm font-medium">
        {formatLocalDateTime(ride.createdAt)}
      </TableCell>
      <TableCell className="whitespace-nowrap font-medium">
        {getRider(ride) ? (
          <button
            type="button"
            onClick={() => onOpenUserDetail(getRider(ride) as any, 'rider')}
            className="cursor-pointer text-left text-primary hover:underline"
          >
            {getRider(ride)?.fullName}
          </button>
        ) : (
          <span>{getRiderName(ride)}</span>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap font-medium">
        {getDriver(ride) ? (
          <button
            type="button"
            onClick={() => onOpenUserDetail(getDriver(ride) as any, 'driver')}
            className="cursor-pointer text-left text-primary hover:underline"
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
          className="flex cursor-pointer items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
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
          className="flex cursor-pointer items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
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
          onClickFn={() => onStartRide(ride)}
          rideRequestStatus={ride.rideRequestStatus}
          rideStatus={ride.rideStatus}
          isLoading={startingRide === ride.uuid}
        />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => onEditAssignment(ride.uuid)}
            size="sm"
            variant="outline"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button type="button" onClick={() => onOpenSms(ride)} size="sm" variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            SMS
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
