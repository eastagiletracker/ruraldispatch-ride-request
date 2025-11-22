/**
 * CSV Export Utilities
 * Functions for exporting ride request data to CSV format
 */

import { RIDE_STATUSES } from '@shared/schemas';
import { toast } from 'sonner';
import { formatLocalDateTime } from './dateUtils';

interface RideRequest {
  uuid: string;
  rideRequestStatus: number;
  rideStatus?: number;
  rider: Array<{ fullName: string; phone: string }>;
  driver?: Array<{ fullName: string; mobilePhone: string }>;
  serviceUserName?: string;
  serviceUserPhone?: string;
  pickupAddress: string;
  dropOffAddress: string;
  pickupRequestedTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Helper function to get rider from ride request
 */
function getRider(ride: RideRequest) {
  return ride?.rider && ride.rider.length > 0 ? ride.rider[0] : undefined;
}

/**
 * Helper function to get driver from ride request
 */
function getDriver(ride: RideRequest) {
  return ride?.driver && ride.driver.length > 0 ? ride.driver[0] : undefined;
}

/**
 * Get human-readable status label from ride status code
 */
function getRideStatusLabel(rideStatus?: number): string {
  if (rideStatus === undefined) return 'Pending';

  switch (rideStatus) {
    case RIDE_STATUSES.REQUEST_IN_PROGRESS:
      return 'Pending';
    case RIDE_STATUSES.RIDE_CONFIRMED:
      return 'Confirmed';
    case RIDE_STATUSES.RIDE_CANCELED_BY_RIDER:
      return 'Canceled';
    case RIDE_STATUSES.RIDE_STARTED:
      return 'In Progress';
    case RIDE_STATUSES.RIDE_INTERRUPTED:
      return 'Interrupted';
    case RIDE_STATUSES.RIDER_PICKED_UP:
      return 'En Route';
    case RIDE_STATUSES.RIDER_NOT_PICKED_UP:
      return 'Not Picked Up';
    case RIDE_STATUSES.RIDER_DROPPED_OFF:
      return 'Dropped Off';
    case RIDE_STATUSES.RIDE_COMPLETE:
      return 'Complete';
    case RIDE_STATUSES.RIDE_INCOMPLETE:
      return 'Incomplete';
    default:
      return 'Unknown';
  }
}

/**
 * Format created date from ride request, trying multiple fields
 */
function getFormattedCreatedDate(ride: RideRequest): string {
  if (ride.createdAt) {
    return formatLocalDateTime(ride.createdAt);
  }

  if (ride.updatedAt) {
    return formatLocalDateTime(ride.updatedAt);
  }

  return 'N/A';
}

/**
 * Export ride requests to CSV file
 * @param rideRequests - Array of pending ride requests
 * @param assignedRides - Array of assigned/active rides
 * @param completedRides - Array of completed rides
 * @param filename - Optional custom filename (without extension)
 */
export function exportRideRequestsToCSV(
  rideRequests: RideRequest[],
  assignedRides: RideRequest[],
  completedRides: RideRequest[],
  filename?: string
): void {
  try {
    // Combine all rides
    const allRides = [...rideRequests, ...assignedRides, ...completedRides];

    if (allRides.length === 0) {
      toast.error('No rides to export');
      return;
    }

    // CSV Headers
    const headers = [
      'Status',
      'Rider Name',
      'Rider Phone',
      'Driver Name',
      'Driver Phone',
      'Pickup Location',
      'Dropoff Location',
      'Requested Pickup Time',
      'Created At',
    ];

    // Map rides to CSV rows
    const rows = allRides.map((ride) => {
      const rider = getRider(ride);
      const driver = getDriver(ride);
      const status = getRideStatusLabel(ride.rideStatus);
      const createdDate = getFormattedCreatedDate(ride);

      return [
        status,
        rider?.fullName || ride.serviceUserName || 'N/A',
        rider?.phone || ride.serviceUserPhone || 'N/A',
        driver?.fullName || 'Unassigned',
        driver?.mobilePhone || 'N/A',
        ride.pickupAddress || 'N/A',
        ride.dropOffAddress || 'N/A',
        formatLocalDateTime(ride.pickupRequestedTime),
        createdDate,
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map(
            (cell) =>
              // Escape commas and quotes in cell content
              `"${String(cell).replace(/"/g, '""')}"`
          )
          .join(',')
      ),
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    const downloadFilename = filename || `ride-requests-${timestamp}`;

    link.setAttribute('href', url);
    link.setAttribute('download', `${downloadFilename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);

    toast.success('Export successful', {
      description: `Downloaded ${allRides.length} ride records`,
    });
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    toast.error('Failed to export rides');
  }
}
