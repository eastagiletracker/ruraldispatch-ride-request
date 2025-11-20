const { RIDE_STATUSES } = require('../constants/rideStatuses');
const { RIDE_REQUEST_STATUSES } = require('../constants/rideRequestStatuses');

/**
 * SMS Response Handler
 * Processes interactive SMS responses (1=Yes, 2=No, 3=Cancel)
 * Maps responses to appropriate ride status updates
 */

/**
 * Parse SMS message body to extract response code
 * @param {string} messageBody - The SMS message text
 * @returns {number|null} - The response code (1, 2, or 3) or null
 */
function parseResponse(messageBody) {
  if (!messageBody) return null;

  const trimmed = messageBody.trim().toLowerCase();

  // Check for numeric responses
  if (trimmed === '1' || trimmed.startsWith('1')) return 1;
  if (trimmed === '2' || trimmed.startsWith('2')) return 2;
  if (trimmed === '3' || trimmed.startsWith('3')) return 3;

  // Check for text responses
  if (trimmed.includes('yes') || trimmed.includes('accept') || trimmed.includes('confirm')) return 1;
  if (trimmed.includes('no') || trimmed.includes('decline') || trimmed.includes('reject')) return 2;
  if (trimmed.includes('cancel')) return 3;

  return null;
}

/**
 * Determine the context of the SMS based on current ride status
 * @param {object} ride - The ride object
 * @param {string} senderRole - 'driver', 'rider', or 'case_manager'
 * @returns {string} - The context identifier
 */
function determineContext(ride, senderRole) {
  const status = ride.rideStatus;

  // Driver contexts
  if (senderRole === 'driver') {
    // Waiting for driver arrival confirmation (at pickup time)
    if (status === RIDE_STATUSES.RIDE_CONFIRMED) {
      return 'DRIVER_ARRIVAL_CHECK';
    }

    // Waiting for driver to confirm pickup
    if (status === RIDE_STATUSES.RIDE_STARTED || status === RIDE_STATUSES.RIDE_CONFIRMED) {
      return 'DRIVER_PICKUP_CHECK';
    }

    // Waiting for driver to confirm dropoff
    if (status === RIDE_STATUSES.RIDER_PICKED_UP) {
      return 'DRIVER_DROPOFF_CHECK';
    }

    // Waiting for driver to confirm roundtrip return pickup
    if (status === RIDE_STATUSES.RIDER_DROPPED_OFF && ride.roundTrip) {
      return 'DRIVER_ROUNDTRIP_RETURN_CHECK';
    }

    // Waiting for driver to confirm roundtrip return dropoff
    if (status === RIDE_STATUSES.ROUNDTRIP_RETURNING) {
      return 'DRIVER_ROUNDTRIP_DROPOFF_CHECK';
    }
  }

  // Rider/Case Manager contexts
  if (senderRole === 'rider' || senderRole === 'case_manager') {
    // Confirming ride 1 hour prior
    if (status === RIDE_STATUSES.RIDE_CONFIRMED) {
      return 'RIDER_CONFIRM_OR_CANCEL';
    }

    // Canceling while driver is waiting
    if (status === RIDE_STATUSES.RIDE_STARTED) {
      return 'RIDER_CANCEL_WHILE_WAITING';
    }

    // Canceling roundtrip return
    if (status === RIDE_STATUSES.RIDER_DROPPED_OFF && ride.roundTrip) {
      return 'RIDER_CANCEL_ROUNDTRIP_RETURN';
    }
  }

  return 'UNKNOWN';
}

/**
 * Process SMS response and determine next action
 * @param {object} ride - The ride object
 * @param {string} senderRole - 'driver', 'rider', or 'case_manager'
 * @param {string} messageBody - The SMS message text
 * @returns {object} - Action object with newStatus, notifications, and metadata
 */
function processSMSResponse(ride, senderRole, messageBody) {
  const responseCode = parseResponse(messageBody);
  const context = determineContext(ride, senderRole);

  console.log('📥 Processing SMS Response:', {
    rideUuid: ride.uuid,
    senderRole,
    currentStatus: ride.rideStatus,
    responseCode,
    context,
    messageBody: messageBody.substring(0, 50)
  });

  // No valid response code found
  if (responseCode === null) {
    return {
      success: false,
      error: 'Invalid response. Please reply with 1, 2, or 3.',
      requiresResponse: true
    };
  }

  // Process based on context
  switch (context) {
    // ==================== DRIVER RESPONSES ====================

    case 'DRIVER_ARRIVAL_CHECK':
      if (responseCode === 1) {
        // Driver arrived
        return {
          success: true,
          notifications: [
            { recipient: 'rider', template: 'DRIVER_ARRIVED' },
            { recipient: 'case_manager', template: 'DRIVER_ARRIVED' },
            { recipient: 'driver', template: 'DRIVER_ARRIVED' } // Ask to confirm pickup
          ],
          metadata: { driverArrived: true, waitingForPickup: true }
        };
      } else if (responseCode === 2) {
        // Driver en route
        return {
          success: true,
          notifications: [
            { recipient: 'rider', template: 'DRIVER_EN_ROUTE' },
            { recipient: 'case_manager', template: 'DRIVER_EN_ROUTE' }
          ],
          scheduleNotification: {
            recipient: 'driver',
            template: 'DRIVER_ARRIVAL_CHECK',
            delayMinutes: 5
          },
          metadata: { driverEnRoute: true }
        };
      }
      break;

    case 'DRIVER_PICKUP_CHECK':
      if (responseCode === 1) {
        // Rider picked up
        return {
          success: true,
          newRideStatus: RIDE_STATUSES.RIDER_PICKED_UP,
          scheduleStatusChange: {
            status: RIDE_STATUSES.RIDE_STARTED,
            delayMinutes: 5
          },
          metadata: { riderPickedUp: true }
        };
      } else if (responseCode === 2) {
        // Driver waiting
        return {
          success: true,
          notifications: [
            { recipient: 'rider', template: 'DRIVER_WAITING' },
            { recipient: 'case_manager', template: 'DRIVER_WAITING' }
          ],
          scheduleNotification: {
            recipient: 'driver',
            template: 'PICKUP_RECHECK',
            delayMinutes: 5
          },
          metadata: { driverWaiting: true, waitStartTime: new Date() }
        };
      }
      break;

    case 'DRIVER_DROPOFF_CHECK':
      if (responseCode === 1) {
        // Rider dropped off
        return {
          success: true,
          newRideStatus: RIDE_STATUSES.RIDER_DROPPED_OFF,
          notifications: [
            { recipient: 'rider', template: RIDE_STATUSES.RIDER_DROPPED_OFF },
            { recipient: 'case_manager', template: RIDE_STATUSES.RIDER_DROPPED_OFF }
          ],
          ...(!ride.roundTrip ? {
            scheduleStatusChange: {
              status: RIDE_STATUSES.RIDE_COMPLETE,
              delayMinutes: 0
            }
          } : {}),
          metadata: { riderDroppedOff: true }
        };
      } else if (responseCode === 2) {
        // Rider not dropped off
        return {
          success: true,
          newRideStatus: RIDE_STATUSES.RIDER_NOT_DROPPED_OFF,
          newRequestStatus: RIDE_REQUEST_STATUSES.CLOSED.code, // Auto-close
          notifications: [
            { recipient: 'dispatcher', template: RIDE_STATUSES.RIDER_NOT_DROPPED_OFF }
          ],
          metadata: { requiresIntervention: true }
        };
      }
      break;

    case 'DRIVER_ROUNDTRIP_RETURN_CHECK':
      if (responseCode === 1) {
        // Started return trip
        return {
          success: true,
          newRideStatus: RIDE_STATUSES.ROUNDTRIP_RETURNING,
          metadata: { roundtripReturning: true }
        };
      } else if (responseCode === 2) {
        // Driver waiting for return
        return {
          success: true,
          notifications: [
            { recipient: 'rider', template: 'ROUNDTRIP_WAITING' },
            { recipient: 'case_manager', template: 'ROUNDTRIP_WAITING' }
          ],
          scheduleNotification: {
            recipient: 'driver',
            template: 'ROUNDTRIP_RETURN_CHECK',
            delayMinutes: 15
          },
          metadata: { roundtripWaiting: true, waitStartTime: new Date() }
        };
      }
      break;

    case 'DRIVER_ROUNDTRIP_DROPOFF_CHECK':
      if (responseCode === 1) {
        // Roundtrip completed
        return {
          success: true,
          newRideStatus: RIDE_STATUSES.ROUNDTRIP_COMPLETE,
          newRequestStatus: RIDE_REQUEST_STATUSES.CLOSED.code, // Auto-close on success
          notifications: [
            { recipient: 'rider', template: RIDE_STATUSES.ROUNDTRIP_COMPLETE },
            { recipient: 'case_manager', template: RIDE_STATUSES.ROUNDTRIP_COMPLETE }
          ],
          metadata: { roundtripCompleted: true }
        };
      } else if (responseCode === 2) {
        // Roundtrip completion interrupted
        return {
          success: true,
          newRideStatus: RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED,
          newRequestStatus: RIDE_REQUEST_STATUSES.CLOSED.code, // Auto-close on failure
          notifications: [
            { recipient: 'rider', template: RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED },
            { recipient: 'case_manager', template: RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED },
            { recipient: 'driver', template: RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED }
          ],
          metadata: { requiresIntervention: true }
        };
      }
      break;

    // ==================== RIDER/CASE MANAGER RESPONSES ====================

    case 'RIDER_CONFIRM_OR_CANCEL':
      if (responseCode === 1) {
        // Rider confirms
        return {
          success: true,
          metadata: { riderConfirmed: true }
        };
      } else if (responseCode === 2 || responseCode === 3) {
        // Rider cancels
        return {
          success: true,
          newRideStatus: RIDE_STATUSES.RIDE_CANCELED_BY_RIDER,
          newRequestStatus: RIDE_REQUEST_STATUSES.CLOSED.code, // Auto-close
          notifications: [
            { recipient: 'rider', template: RIDE_STATUSES.RIDE_CANCELED_BY_RIDER },
            { recipient: 'case_manager', template: RIDE_STATUSES.RIDE_CANCELED_BY_RIDER },
            { recipient: 'driver', template: RIDE_STATUSES.RIDE_CANCELED_BY_RIDER }
          ],
          metadata: { riderCanceled: true }
        };
      }
      break;

    case 'RIDER_CANCEL_WHILE_WAITING':
      if (responseCode === 2) {
        // Cancel while driver waiting
        return {
          success: true,
          newRideStatus: RIDE_STATUSES.RIDE_CANCELED_BY_RIDER,
          newRequestStatus: RIDE_REQUEST_STATUSES.CLOSED.code, // Auto-close
          notifications: [
            { recipient: 'rider', template: RIDE_STATUSES.RIDE_CANCELED_BY_RIDER },
            { recipient: 'case_manager', template: RIDE_STATUSES.RIDE_CANCELED_BY_RIDER },
            { recipient: 'driver', template: RIDE_STATUSES.RIDE_CANCELED_BY_RIDER }
          ],
          metadata: { riderCanceled: true }
        };
      }
      break;

    case 'RIDER_CANCEL_ROUNDTRIP_RETURN':
      if (responseCode === 2) {
        // Cancel roundtrip return
        return {
          success: true,
          newRideStatus: RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED,
          newRequestStatus: RIDE_REQUEST_STATUSES.CLOSED.code, // Auto-close
          notifications: [
            { recipient: 'rider', template: RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED },
            { recipient: 'case_manager', template: RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED },
            { recipient: 'driver', template: RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED }
          ],
          metadata: { roundtripReturnCanceled: true }
        };
      }
      break;

    default:
      return {
        success: false,
        error: 'Unable to process response in current context.',
        requiresResponse: false
      };
  }

  // If we get here, responseCode wasn't handled in the switch
  return {
    success: false,
    error: `Response ${responseCode} not valid for current ride status.`,
    requiresResponse: true
  };
}

module.exports = {
  parseResponse,
  determineContext,
  processSMSResponse
};
