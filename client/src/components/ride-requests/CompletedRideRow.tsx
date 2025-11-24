import { MapPin } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatLocalDateTime } from '@/utils/dateUtils';
import AssignedRideStatus from '../AssignedRideStatus';
import { getDriver, getRider, getRiderName } from './helpers';
import type { RideRequest } from './types';

interface CompletedRideRowProps {
  ride: RideRequest;
  onOpenUserDetail: (user: any, type: 'rider' | 'driver') => void;
}

export function CompletedRideRow({ ride, onOpenUserDetail }: CompletedRideRowProps) {
  return (
    <TableRow className="bg-green-50/30">
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
        <AssignedRideStatus
          onClickFn={() => {}}
          rideRequestStatus={ride.rideRequestStatus}
          rideStatus={ride.rideStatus}
        />
      </TableCell>
    </TableRow>
  );
}
