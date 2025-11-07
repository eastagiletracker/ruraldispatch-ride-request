const SMSProviderManager = require('./smsProviders/SMSProviderManager');
const rideStatuses = require('../constants/rideStatuses');
const { RIDE_REQUEST_STATUSES } = require('../constants/rideRequestStatuses');

/**
 * Notification Service
 * Handles SMS notifications via multiple providers (Twilio primary, Vonage fallback)
 */
class NotificationService {
  constructor() {
    this.smsProvider = new SMSProviderManager();
  }

  /**
   * Send SMS notification
   * Uses SMS Provider Manager with automatic fallback
   * @param {string} to - Recipient phone number
   * @param {string} message - SMS message body
   * @returns {Promise<object>} SMS result object
   */
  async sendSMS(to, message) {
    return await this.smsProvider.sendSMS(to, message);
  }

  /**
   * Get SMS provider status
   * @returns {object} Provider configuration status
   */
  getProviderStatus() {
    return this.smsProvider.getStatus();
  }

  /**
   * Send ride accepted notification to rider
   */
  async notifyRideAccepted(ride, rider, driver, vehicle) {
    const vehicleInfo = vehicle ? `Vehicle: ${vehicle.displayName}` : 'Vehicle: TBD';
    const message = `Your ride has been accepted!
Driver: ${driver.fullName}
${vehicleInfo}
Pickup: ${ride.pickupAddress}
Time: ${new Date(ride.pickupRequestedTime).toLocaleString()}
Questions? Reply to this message.`;

    return await this.sendSMS(rider.phone, message);
  }

  /**
   * Send ride started notification to rider
   */
  async notifyRideStarted(ride, rider, driver) {
    const message = `Your ride has started!
Driver ${driver.fullName} is on the way to pick you up at ${ride.pickupAddress}.
We'll notify you when you arrive.`;

    return await this.sendSMS(rider.phone, message);
  }

  /**
   * Send rider picked up notification
   */
  async notifyRiderPickedUp(ride, rider, driver) {
    const message = `You've been picked up by ${driver.fullName}.
Heading to: ${ride.dropOffAddress}
Have a safe trip!`;

    return await this.sendSMS(rider.phone, message);
  }

  /**
   * Send rider dropped off notification
   */
  async notifyRiderDroppedOff(ride, rider) {
    const roundTripInfo = ride.roundTrip ? '\nYour return trip will begin shortly.' : '';

    const message = `You've been dropped off at ${ride.dropOffAddress}.
Thank you for riding with us!${roundTripInfo}`;

    return await this.sendSMS(rider.phone, message);
  }

  /**
   * Send ride complete notification
   */
  async notifyRideComplete(ride, rider) {
    const message = `Your ride is now complete.
Thank you for using our service! If you have any feedback, please contact us.`;

    return await this.sendSMS(rider.phone, message);
  }

  /**
   * Send driver assignment notification to driver
   */
  async notifyDriverAssigned(ride, driver, rider) {
    const message = `New ride assigned to you!
Rider: ${rider.fullName}
Pickup: ${ride.pickupAddress}
Time: ${new Date(ride.pickupRequestedTime).toLocaleString()}
Dropoff: ${ride.dropOffAddress}
Check the dashboard for details.`;

    const driverPhone = driver.mobilePhone || driver.phone;

    if (!driverPhone) {
      console.error('❌ Driver has no phone number!', { driver });
      return {
        success: false,
        error: 'Driver has no phone number configured',
        timestamp: new Date()
      };
    }

    console.log('📱 Sending driver notification to:', driverPhone);

    return await this.sendSMS(driverPhone, message);
  }

  /**
   * Send status update notification to dispatcher
   */
  async notifyDispatcher(dispatcherPhone, ride, status) {
    const statusText = this.getStatusText(status);

    const message = `Ride #${ride.uuid} status update: ${statusText}`;

    return await this.sendSMS(dispatcherPhone, message);
  }

  /**
   * Handle automatic notifications based on ride status change
   */
  async handleRideStatusChange(ride, oldStatus, newStatus, userData) {
    const notifications = [];

    try {
      // When driver is assigned (status moves to RIDE_CONFIRMATION_NEEDED)
      console.log('Checking notification condition:');
      console.log('  newStatus === 400?', newStatus === RIDE_REQUEST_STATUSES.RIDE_CONFIRMATION_NEEDED.code, newStatus, RIDE_REQUEST_STATUSES.RIDE_CONFIRMATION_NEEDED.code);
      console.log('  Has rider?', !!userData.rider);
      console.log('  Has driver?', !!userData.driver);

      if (newStatus === RIDE_REQUEST_STATUSES.RIDE_CONFIRMATION_NEEDED.code &&
          userData.rider && userData.driver) {
        console.log('  ✅ Condition passed! Sending SMS...');

        try {
          console.log('📨 Sending rider notification...');
          const riderNotif = await this.notifyRideAccepted(
            ride,
            userData.rider,
            userData.driver,
            userData.vehicle  // Optional - will show "TBD" if not found
          );
          notifications.push({ type: 'rider_accepted', ...riderNotif });
          console.log('✅ Rider notification result:', riderNotif.success ? 'SUCCESS' : 'FAILED');
        } catch (error) {
          console.error('❌ Error sending rider notification:', error.message);
        }

        try {
          console.log('📨 Sending driver notification...');
          const driverNotif = await this.notifyDriverAssigned(
            ride,
            userData.driver,
            userData.rider
          );
          notifications.push({ type: 'driver_assigned', ...driverNotif });
          console.log('✅ Driver notification result:', driverNotif.success ? 'SUCCESS' : 'FAILED');
        } catch (error) {
          console.error('❌ Error sending driver notification:', error.message);
        }
      }

      // When ride starts (RIDE_STARTED)
      if (ride.rideStatus === rideStatuses.RIDE_STARTED &&
          userData.rider && userData.driver) {
        const notif = await this.notifyRideStarted(
          ride,
          userData.rider,
          userData.driver
        );
        notifications.push({ type: 'ride_started', ...notif });
      }

      // When rider is picked up
      if (ride.rideStatus === rideStatuses.RIDER_PICKED_UP &&
          userData.rider && userData.driver) {
        const notif = await this.notifyRiderPickedUp(
          ride,
          userData.rider,
          userData.driver
        );
        notifications.push({ type: 'rider_picked_up', ...notif });
      }

      // When rider is dropped off
      if (ride.rideStatus === rideStatuses.RIDER_DROPPED_OFF &&
          userData.rider) {
        const notif = await this.notifyRiderDroppedOff(ride, userData.rider);
        notifications.push({ type: 'rider_dropped_off', ...notif });
      }

      // When ride is complete
      if (ride.rideStatus === rideStatuses.RIDE_COMPLETE &&
          userData.rider) {
        const notif = await this.notifyRideComplete(ride, userData.rider);
        notifications.push({ type: 'ride_complete', ...notif });
      }

      return notifications;
    } catch (error) {
      console.error('Error in handleRideStatusChange:', error);
      return notifications;
    }
  }

  /**
   * Get human-readable status text
   */
  getStatusText(status) {
    const statusMap = {
      [rideStatuses.REQUEST_IN_PROGRESS]: 'Request In Progress',
      [rideStatuses.RIDE_CONFIRMED]: 'Ride Confirmed',
      [rideStatuses.RIDE_STARTED]: 'Ride Started',
      [rideStatuses.RIDER_PICKED_UP]: 'Rider Picked Up',
      [rideStatuses.RIDER_DROPPED_OFF]: 'Rider Dropped Off',
      [rideStatuses.ROUNDTRIP_RETURNING]: 'Returning (Round Trip)',
      [rideStatuses.ROUNDTRIP_COMPLETE]: 'Round Trip Complete',
      [rideStatuses.RIDE_COMPLETE]: 'Ride Complete'
    };

    return statusMap[status] || `Status ${status}`;
  }

  /**
   * Close out ride session (cleanup/logging)
   */
  async closeRideSession(rideUuid) {
    console.log(`Closing ride session for ride #${rideUuid}`);
    // Add any cleanup logic here (e.g., mark notifications as closed, archive, etc.)
    return { success: true, message: `Session closed for ride #${rideUuid}` };
  }
}

module.exports = new NotificationService();
