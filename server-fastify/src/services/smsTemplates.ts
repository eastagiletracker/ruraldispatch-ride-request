import { RIDE_STATUSES, type RideStatus } from '../constants/rideStatuses.js';
import type { Ride, ServiceProvider, User, Vehicle } from '../types/database.types.js';

/**
 * SMS Templates Service
 * Centralized SMS message templates for all ride statuses
 */

type RecipientType = 'rider' | 'driver' | 'case_manager' | 'dispatcher';
type TemplateStatus =
  | RideStatus
  | 'DRIVER_ARRIVAL_CHECK'
  | 'DRIVER_EN_ROUTE'
  | 'DRIVER_ARRIVED'
  | 'DRIVER_WAITING'
  | 'PICKUP_RECHECK'
  | 'DROPOFF_CHECK'
  | 'ROUNDTRIP_RETURN_CHECK'
  | 'ROUNDTRIP_WAITING';

interface TemplateData {
  ride?: Ride;
  rider?: User | null;
  driver?: ServiceProvider | null;
  vehicle?: Vehicle | null;
  pickupLocation?: string;
}

/**
 * Format date/time for SMS messages
 */
function formatDateTime(dateTime: Date | string | null | undefined): string {
  if (!dateTime) return 'TBD';
  const date = new Date(dateTime);
  return date.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format address for SMS (shortened if needed)
 */
function formatAddress(address: string | { formattedAddress: string } | null | undefined): string {
  if (!address) return 'TBD';

  // If it's an address object with formattedAddress
  if (typeof address === 'object' && 'formattedAddress' in address) {
    return address.formattedAddress;
  }

  // If it's a string
  if (typeof address === 'string') {
    return address;
  }

  return 'TBD';
}



/**
 * Get ride confirmed SMS (Status 100)
 */
function getRideConfirmedMessage(
  ride: Ride,
  driver: ServiceProvider | null,
  vehicle: Vehicle | null
): string {
  const pickup = formatAddress(ride.pickupAddress);
  const dropoff = formatAddress(ride.dropOffAddress);
  const pickupTime = formatDateTime(ride.pickupRequestedTime);
  const roundtripIndicator = ride.roundTrip ? 'R' : '';
  const vehicleName = vehicle ? vehicle.displayName : 'TBD';
  const driverName = driver ? driver.fullName : 'TBD';

  return `Ride Confirmed!
Driver: ${driverName}
Vehicle: ${vehicleName}
${pickupTime}
Pickup: ${pickup}
Drop off: ${dropoff}
${roundtripIndicator}
To Cancel ride, type 3`;
}

export function getRideCanceledMessage(): string {
  return 'Ride has been canceled';
}

export function getDriverArrivalCheckMessage(): string {
  return 'Have you arrived at pick up location? Reply 1 for yes, 2 for no.';
}

export function getDriverEnRouteMessage(): string {
  return 'Driver is en route';
}

export function getDriverArrivedMessageToRider(): string {
  return 'Driver has arrived';
}

export function getPickupCheckMessage(): string {
  return 'Have you picked up the rider and started the ride? 1-yes, 2-no';
}

export function getDriverWaitingMessage(): string {
  return 'Driver is waiting. Driver will wait up to 5 minute before canceling ride. To cancel ride reply 2.';
}

export function getDropoffCheckMessage(): string {
  return 'Have you dropped off rider? 1-yes, 2-no';
}

export function getRiderDroppedOffMessage(): string {
  return 'You have been dropped off';
}

export function getRiderDroppedOffMessageToCaseManager(): string {
  return 'Rider has been dropped off';
}

export function getRoundtripReturnCheckMessage(): string {
  return 'Have you picked up the rider and started the return ride? 1-yes, 2-no';
}

export function getRoundtripWaitingMessage(pickupLocation: string): string {
  const pickup = formatAddress(pickupLocation);
  return `Driver is waiting to return you to ${pickup}. Driver will wait up to another 15 minutes. To cancel return ride, reply 2- Cancel.`;
}

export function getRoundtripCompletionInterruptedMessage(): string {
  return 'Return ride has been canceled.';
}

export function getRoundtripCompletedMessage(): string {
  return 'Your roundtrip is completed. Thank you for riding with EastConn';
}

export function getRideCompletedMessage(): string {
  return 'Your ride is complete. Thank you for riding with EastConn';
}

export function getRiderNotDroppedOffAlert(): string {
  return 'Rider not dropped off - requires dispatcher intervention';
}

export function getRideStatusUpdateMessage(ride: Ride, statusDescription: string): string {
  return `Ride #${ride.uuid} status: ${statusDescription}`;
}

/**
 * Main function to get SMS template based on status and recipient
 */
export function getSMSTemplate(
  status: TemplateStatus,
  recipient: RecipientType,
  data: TemplateData = {}
): string | null {
  const { ride, driver, vehicle, pickupLocation } = data;

  // Map of status -> recipient -> message template
  const templates: Record<TemplateStatus, Partial<Record<RecipientType, () => string>>> = {
    // Status 100 - Ride Confirmed
    [RIDE_STATUSES.RIDE_CONFIRMED]: {
      rider: () => getRideConfirmedMessage(ride!, driver!, vehicle!),
      case_manager: () => getRideConfirmedMessage(ride!, driver!, vehicle!),
    },

    // Status 109 - Ride Canceled by Rider
    [RIDE_STATUSES.RIDE_CANCELED_BY_RIDER]: {
      rider: () => getRideCanceledMessage(),
      case_manager: () => getRideCanceledMessage(),
      driver: () => getRideCanceledMessage(),
    },

    // Pickup time - driver arrival check
    DRIVER_ARRIVAL_CHECK: {
      driver: () => getDriverArrivalCheckMessage(),
    },

    // Driver en route
    DRIVER_EN_ROUTE: {
      rider: () => getDriverEnRouteMessage(),
      case_manager: () => getDriverEnRouteMessage(),
    },

    // Driver arrived
    DRIVER_ARRIVED: {
      rider: () => getDriverArrivedMessageToRider(),
      case_manager: () => getDriverArrivedMessageToRider(),
      driver: () => getPickupCheckMessage(),
    },

    // Driver waiting
    DRIVER_WAITING: {
      rider: () => getDriverWaitingMessage(),
      case_manager: () => getDriverWaitingMessage(),
    },

    // Pickup recheck
    PICKUP_RECHECK: {
      driver: () => getPickupCheckMessage(),
    },

    // Dropoff check
    DROPOFF_CHECK: {
      driver: () => getDropoffCheckMessage(),
    },

    // Status 400 - Rider Dropped Off
    [RIDE_STATUSES.RIDER_DROPPED_OFF]: {
      rider: () => getRiderDroppedOffMessage(),
      case_manager: () => getRiderDroppedOffMessageToCaseManager(),
    },

    // Status 409 - Rider Not Dropped Off
    [RIDE_STATUSES.RIDER_NOT_DROPPED_OFF]: {
      dispatcher: () => getRiderNotDroppedOffAlert(),
    },

    // Roundtrip return check
    ROUNDTRIP_RETURN_CHECK: {
      driver: () => getRoundtripReturnCheckMessage(),
    },

    // Roundtrip waiting
    ROUNDTRIP_WAITING: {
      rider: () => getRoundtripWaitingMessage(pickupLocation!),
      case_manager: () => getRoundtripWaitingMessage(pickupLocation!),
    },

    // Status 479 - Roundtrip Completion Interrupted
    [RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED]: {
      rider: () => getRoundtripCompletionInterruptedMessage(),
      case_manager: () => getRoundtripCompletionInterruptedMessage(),
      driver: () => getRoundtripCompletionInterruptedMessage(),
    },

    // Status 475 - Roundtrip Completed
    [RIDE_STATUSES.ROUNDTRIP_COMPLETE]: {
      rider: () => getRoundtripCompletedMessage(),
      case_manager: () => getRoundtripCompletedMessage(),
    },

    // Status 500 - Ride Completed
    [RIDE_STATUSES.RIDE_COMPLETE]: {
      rider: () => getRideCompletedMessage(),
      case_manager: () => getRideCompletedMessage(),
    },

    // Additional statuses (no SMS templates currently)
    [RIDE_STATUSES.REQUEST_IN_PROGRESS]: {},
    [RIDE_STATUSES.RIDE_STARTED]: {},
    [RIDE_STATUSES.RIDE_INTERRUPTED]: {},
    [RIDE_STATUSES.RIDER_PICKED_UP]: {},
    [RIDE_STATUSES.RIDER_NOT_PICKED_UP]: {},
    [RIDE_STATUSES.ROUNDTRIP_RETURNING]: {},
    [RIDE_STATUSES.ROUNDTRIP_RETURN_INTERRUPTED]: {},
    [RIDE_STATUSES.RIDE_INCOMPLETE]: {},
  };

  // Get template for status and recipient
  const statusTemplates = templates[status];
  if (statusTemplates?.[recipient]) {
    return statusTemplates[recipient]!();
  }

  // Default fallback
  return null;
}

export { formatDateTime, formatAddress, getRideConfirmedMessage };
