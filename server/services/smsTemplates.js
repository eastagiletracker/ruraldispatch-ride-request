const { RIDE_STATUSES } = require('../constants/rideStatuses');

/**
 * SMS Templates Service
 * Centralized SMS message templates for all ride statuses
 * Based on: /docs/Ride Statuses & SMS Flow.csv
 */

/**
 * Format date/time for SMS messages
 */
function formatDateTime(dateTime) {
  if (!dateTime) return 'TBD';
  const date = new Date(dateTime);
  return date.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format address for SMS (shortened if needed)
 */
function formatAddress(address) {
  if (!address) return 'TBD';

  // If it's an address object with formattedAddress
  if (typeof address === 'object' && address.formattedAddress) {
    return address.formattedAddress;
  }

  // If it's a string
  if (typeof address === 'string') {
    return address;
  }

  return 'TBD';
}

/**
 * Get driver assignment SMS (sent when ride is matched to driver)
 */
function getDriverAssignmentMessage(ride, rider) {
  const pickup = formatAddress(ride.pickupLocation);
  const dropoff = formatAddress(ride.dropoffLocation);
  const pickupTime = formatDateTime(ride.pickupRequestedTime);
  const roundtripIndicator = ride.roundTrip ? 'R' : '';

  return `New ride assigned to you!
Rider: ${rider.fullName}
Pickup: ${pickup}
${pickupTime}
Drop off: ${dropoff}
${roundtripIndicator}
Accept? 1=Yes, 2=No`;
}

/**
 * Get ride confirmed SMS (Status 100)
 * Sent to both rider and case manager when driver accepts
 */
function getRideConfirmedMessage(ride, driver, vehicle) {
  const pickup = formatAddress(ride.pickupLocation);
  const dropoff = formatAddress(ride.dropoffLocation);
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

/**
 * Get 1 hour prior reminder SMS
 */
function getOneHourPriorMessage() {
  return 'Your driver will arrive in 1 hour. Reply 1 to confirm ride. Reply 2 to cancel ride.';
}

/**
 * Get ride canceled SMS (Status 109)
 */
function getRideCanceledMessage() {
  return 'Ride has been canceled';
}

/**
 * Get driver arrival check SMS (sent at pickup time)
 */
function getDriverArrivalCheckMessage() {
  return 'Have you arrived at pick up location? Reply 1 for yes, 2 for no.';
}

/**
 * Get driver en route SMS (when driver replies 2=No to arrival)
 */
function getDriverEnRouteMessage() {
  return 'Driver is en route';
}

/**
 * Get driver arrived SMS (when driver replies 1=Yes to arrival)
 * To Rider & Case Manager
 */
function getDriverArrivedMessageToRider() {
  return 'Driver has arrived';
}

/**
 * Get driver arrived check for pickup SMS (to driver after arrival)
 */
function getPickupCheckMessage() {
  return 'Have you picked up the rider and started the ride? 1-yes, 2-no';
}

/**
 * Get driver waiting SMS (when driver replies 2=No to pickup)
 * Sent to rider and case manager
 */
function getDriverWaitingMessage() {
  return 'Driver is waiting. Driver will wait up to 5 minute before canceling ride. To cancel ride reply 2.';
}

/**
 * Get rider picked up confirmation (Status 300)
 * Internal status update - no SMS needed
 */

/**
 * Get ride started confirmation (Status 200)
 * Set 5 minutes after pickup - no SMS needed
 */

/**
 * Get dropoff check SMS (sent at estimated dropoff time)
 */
function getDropoffCheckMessage() {
  return 'Have you dropped off rider? 1-yes, 2-no';
}

/**
 * Get rider dropped off SMS (Status 400)
 * To rider and case manager
 */
function getRiderDroppedOffMessage() {
  return 'You have been dropped off';
}

function getRiderDroppedOffMessageToCaseManager() {
  return 'Rider has been dropped off';
}

/**
 * Get roundtrip return check SMS (sent at estimated return time)
 */
function getRoundtripReturnCheckMessage() {
  return 'Have you picked up the rider and started the return ride? 1-yes, 2-no';
}

/**
 * Get roundtrip waiting SMS (when driver replies 2=No to return pickup)
 */
function getRoundtripWaitingMessage(pickupLocation) {
  const pickup = formatAddress(pickupLocation);
  return `Driver is waiting to return you to ${pickup}. Driver will wait up to another 15 minutes. To cancel return ride, reply 2- Cancel.`;
}

/**
 * Get roundtrip completion interrupted SMS (Status 479)
 */
function getRoundtripCompletionInterruptedMessage() {
  return 'Return ride has been canceled.';
}

/**
 * Get roundtrip completed SMS (Status 475)
 */
function getRoundtripCompletedMessage() {
  return 'Your roundtrip is completed. Thank you for riding with EastConn';
}

/**
 * Get ride completed SMS (Status 500)
 * Final dispatcher confirmation
 */
function getRideCompletedMessage() {
  return 'Your ride is complete. Thank you for riding with EastConn';
}

/**
 * Get rider not dropped off SMS (Status 409)
 * Requires dispatcher intervention - internal notification
 */
function getRiderNotDroppedOffAlert() {
  return 'Rider not dropped off - requires dispatcher intervention';
}

/**
 * Get generic ride status update message
 */
function getRideStatusUpdateMessage(ride, statusDescription) {
  return `Ride #${ride.uuid} status: ${statusDescription}`;
}

/**
 * Main function to get SMS template based on status and recipient
 */
function getSMSTemplate(status, recipient, data = {}) {
  const { ride, rider, driver, vehicle, pickupLocation } = data;

  // Map of status -> recipient -> message template
  const templates = {
    // Driver Assignment (before status 100)
    'DRIVER_ASSIGNMENT': {
      driver: () => getDriverAssignmentMessage(ride, rider)
    },

    // Status 100 - Ride Confirmed
    [RIDE_STATUSES.RIDE_CONFIRMED]: {
      rider: () => getRideConfirmedMessage(ride, driver, vehicle),
      case_manager: () => getRideConfirmedMessage(ride, driver, vehicle)
    },

    // One hour prior reminder
    'ONE_HOUR_PRIOR': {
      rider: () => getOneHourPriorMessage()
    },

    // Status 109 - Ride Canceled by Rider
    [RIDE_STATUSES.RIDE_CANCELED_BY_RIDER]: {
      rider: () => getRideCanceledMessage(),
      case_manager: () => getRideCanceledMessage(),
      driver: () => getRideCanceledMessage()
    },

    // Pickup time - driver arrival check
    'DRIVER_ARRIVAL_CHECK': {
      driver: () => getDriverArrivalCheckMessage()
    },

    // Driver en route (responded 2=No to arrival)
    'DRIVER_EN_ROUTE': {
      rider: () => getDriverEnRouteMessage(),
      case_manager: () => getDriverEnRouteMessage()
    },

    // Driver arrived (responded 1=Yes to arrival)
    'DRIVER_ARRIVED': {
      rider: () => getDriverArrivedMessageToRider(),
      case_manager: () => getDriverArrivedMessageToRider(),
      driver: () => getPickupCheckMessage()
    },

    // Driver waiting (responded 2=No to pickup)
    'DRIVER_WAITING': {
      rider: () => getDriverWaitingMessage(),
      case_manager: () => getDriverWaitingMessage()
    },

    // 5 minutes after waiting - check again
    'PICKUP_RECHECK': {
      driver: () => getPickupCheckMessage()
    },

    // Status 300 - Rider Picked Up (no SMS)
    // Status 200 - Ride Started (set 5 min after pickup, no SMS)

    // Dropoff check
    'DROPOFF_CHECK': {
      driver: () => getDropoffCheckMessage()
    },

    // Status 400 - Rider Dropped Off
    [RIDE_STATUSES.RIDER_DROPPED_OFF]: {
      rider: () => getRiderDroppedOffMessage(),
      case_manager: () => getRiderDroppedOffMessageToCaseManager()
    },

    // Status 409 - Rider Not Dropped Off (dispatcher alert)
    [RIDE_STATUSES.RIDER_NOT_DROPPED_OFF]: {
      dispatcher: () => getRiderNotDroppedOffAlert()
    },

    // Roundtrip return check
    'ROUNDTRIP_RETURN_CHECK': {
      driver: () => getRoundtripReturnCheckMessage()
    },

    // Roundtrip waiting
    'ROUNDTRIP_WAITING': {
      rider: () => getRoundtripWaitingMessage(pickupLocation),
      case_manager: () => getRoundtripWaitingMessage(pickupLocation)
    },

    // Status 479 - Roundtrip Completion Interrupted
    [RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED]: {
      rider: () => getRoundtripCompletionInterruptedMessage(),
      case_manager: () => getRoundtripCompletionInterruptedMessage(),
      driver: () => getRoundtripCompletionInterruptedMessage()
    },

    // Status 475 - Roundtrip Completed
    [RIDE_STATUSES.ROUNDTRIP_COMPLETE]: {
      rider: () => getRoundtripCompletedMessage(),
      case_manager: () => getRoundtripCompletedMessage()
    },

    // Status 500 - Ride Completed
    [RIDE_STATUSES.RIDE_COMPLETE]: {
      rider: () => getRideCompletedMessage(),
      case_manager: () => getRideCompletedMessage()
    }
  };

  // Get template for status and recipient
  if (templates[status] && templates[status][recipient]) {
    return templates[status][recipient]();
  }

  // Default fallback
  return null;
}

module.exports = {
  getSMSTemplate,
  formatDateTime,
  formatAddress,

  // Export individual message generators for direct use
  getDriverAssignmentMessage,
  getRideConfirmedMessage,
  getOneHourPriorMessage,
  getRideCanceledMessage,
  getDriverArrivalCheckMessage,
  getDriverEnRouteMessage,
  getDriverArrivedMessageToRider,
  getPickupCheckMessage,
  getDriverWaitingMessage,
  getDropoffCheckMessage,
  getRiderDroppedOffMessage,
  getRiderDroppedOffMessageToCaseManager,
  getRoundtripReturnCheckMessage,
  getRoundtripWaitingMessage,
  getRoundtripCompletionInterruptedMessage,
  getRoundtripCompletedMessage,
  getRideCompletedMessage,
  getRiderNotDroppedOffAlert,
  getRideStatusUpdateMessage
};
