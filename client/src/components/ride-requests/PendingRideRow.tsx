import { MapPin, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatLocalDateTime } from '@/utils/dateUtils';
import { getRider, getRiderName } from './helpers';
import type { RideRequest } from './types';

interface PendingRideRowProps {
  rideRequest: RideRequest;
  onAssignDriver: (uuid: string) => void;
  onCancel: (rideRequest: RideRequest) => void;
  onOpenUserDetail: (user: any, type: 'rider' | 'driver') => void;
}

export function PendingRideRow({
  rideRequest,
  onAssignDriver,
  onCancel,
  onOpenUserDetail,
}: PendingRideRowProps) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-sm font-medium">
        {formatLocalDateTime(rideRequest.createdAt)}
      </TableCell>
      <TableCell className="whitespace-nowrap font-medium">
        {getRider(rideRequest) ? (
          <button
            type="button"
            onClick={() => onOpenUserDetail(getRider(rideRequest) as any, 'rider')}
            className="cursor-pointer text-left text-primary hover:underline"
          >
            {getRider(rideRequest)?.fullName}
          </button>
        ) : (
          <span>{getRiderName(rideRequest)}</span>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <a
          href={`https://www.google.com/maps/search/${encodeURIComponent(rideRequest.pickupAddress)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex cursor-pointer items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
        >
          <MapPin className="h-3 w-3" />
          {rideRequest.pickupAddress}
        </a>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <a
          href={`https://www.google.com/maps/search/${encodeURIComponent(rideRequest.dropOffAddress)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex cursor-pointer items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
        >
          <MapPin className="h-3 w-3" />
          {rideRequest.dropOffAddress}
        </a>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {rideRequest.pickupRequestedTime
          ? formatLocalDateTime(rideRequest.pickupRequestedTime)
          : 'No pickup time set'}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Button
          type="button"
          onClick={() => onAssignDriver(rideRequest.uuid)}
          size="sm"
          variant="default"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Assign Driver & Vehicle
        </Button>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Button type="button" onClick={() => onCancel(rideRequest)} size="sm" variant="outline">
          Cancel
        </Button>
      </TableCell>
    </TableRow>
  );
}
