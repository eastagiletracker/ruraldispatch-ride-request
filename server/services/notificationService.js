const SMSProviderManager = require('./smsProviders/SMSProviderManager');
const rideStatuses = require('../constants/rideStatuses');
const { RIDE_REQUEST_STATUSES } = require('../constants/rideRequestStatuses');
const smsTemplates = require('./smsTemplates');
const { processSMSResponse } = require('./smsResponseHandler');
const { generateUuid } = require('../utils/uuid');

/**
 * Notification Service
 * Handles SMS notifications via multiple providers (Twilio primary, Vonage fallback)
 * Integrated with SMS templates and interactive response handling
 */
class NotificationService {
  constructor() {
    this.smsProvider = new SMSProviderManager();
    this.api = null; // Will be set by router after API initialization
  }

  /**
   * Initialize the service with API reference for database operations
   * @param {object} api - Database API instance
   */
  setApi(api) {
    this.api = api;
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
      // When driver is assigned (request status moves to RIDE_CONFIRMATION_NEEDED = 400)
      console.log('Checking assignment notification:');
      console.log('  requestStatus === 400 (RIDE_CONFIRMATION_NEEDED)?', newStatus === RIDE_REQUEST_STATUSES.RIDE_CONFIRMATION_NEEDED.code, `(${newStatus} === ${RIDE_REQUEST_STATUSES.RIDE_CONFIRMATION_NEEDED.code})`);
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

      // Status 200 (RIDE_STARTED) - Per CSV spec, NO SMS should be sent
      // This status happens automatically 5 min after pickup (status 300)
      // If manual "Start Ride" button is used, it also shouldn't trigger SMS
      console.log('Status 200 (RIDE_STARTED) - No SMS per CSV spec');

      // Legacy notification checks - These are now handled by the SMS flow system
      // via smsResponseHandler.js and router.js webhook processing
      // Keeping them commented out in case manual status updates need fallback notifications

      // Status 300 (RIDER_PICKED_UP) - Handled by SMS flow
      console.log('Status 300 (RIDER_PICKED_UP) - Handled by SMS flow system');

      // Status 400 (RIDER_DROPPED_OFF) - Handled by SMS flow
      console.log('Status 400 (RIDER_DROPPED_OFF) - Handled by SMS flow system');

      // Status 500 (RIDE_COMPLETE) - Handled by SMS flow
      console.log('Status 500 (RIDE_COMPLETE) - Handled by SMS flow system');

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

  /**
   * Send template-based SMS notification
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} template - Template identifier or status code
   * @param {string} recipient - Recipient role (rider, driver, case_manager, etc.)
   * @param {object} data - Data for template (ride, rider, driver, vehicle, etc.)
   * @returns {Promise<object>} SMS result
   */
  async sendTemplateSMS(phoneNumber, template, recipient, data) {
    const message = smsTemplates.getSMSTemplate(template, recipient, data);

    if (!message) {
      console.warn(`⚠️ No SMS template found for template=${template}, recipient=${recipient}`);
      return {
        success: false,
        error: 'No template found',
        timestamp: new Date()
      };
    }

    console.log(`📤 Sending ${template} SMS to ${recipient}: ${phoneNumber}`);
    console.log(`   Message preview: ${message.substring(0, 100)}...`);

    const result = await this.sendSMS(phoneNumber, message);

    // Save to database if API is available and SMS was sent successfully
    if (this.api && result.success) {
      try {
        const notificationRecord = {
          uuid: generateUuid(),
          rideRequestUuid: data.ride ? data.ride.uuid : null,
          notificationType: template,
          direction: 'outbound',
          recipientPhone: phoneNumber,
          recipientName: data.rider?.fullName || data.driver?.fullName,
          recipientRole: recipient,
          messageBody: message,
          twilioMessageSid: result.messageSid,
          twilioStatus: result.status,
          sentAt: result.timestamp,
          sessionActive: true
        };

        await this.api.addNotification(notificationRecord);
        console.log(`💾 Notification saved to database (SID: ${result.messageSid})`);
      } catch (dbError) {
        console.error('❌ Failed to save notification to database:', dbError);
        // Don't fail the SMS send if DB save fails
      }
    }

    return result;
  }

  /**
   * Process incoming SMS response from rider/driver/case manager
   * @param {string} fromPhone - Sender phone number
   * @param {string} messageBody - SMS message text
   * @param {object} ride - Current ride object
   * @param {string} senderRole - 'driver', 'rider', or 'case_manager'
   * @returns {Promise<object>} Processing result with actions to take
   */
  async processIncomingSMS(fromPhone, messageBody, ride, senderRole) {
    console.log('📥 Processing incoming SMS:', {
      from: fromPhone,
      role: senderRole,
      rideUuid: ride.uuid,
      message: messageBody.substring(0, 50)
    });

    const action = processSMSResponse(ride, senderRole, messageBody);

    if (!action.success) {
      // Invalid response - send error message back
      if (action.requiresResponse && action.error) {
        await this.sendSMS(fromPhone, action.error);
      }
      return action;
    }

    // Return the action object for the API to execute
    // (status updates, notifications, scheduling)
    return action;
  }

  /**
   * Send notifications to multiple recipients for a ride status change
   * @param {object} ride - The ride object
   * @param {array} notifications - Array of {recipient, template, message} objects
   * @param {object} data - Data context (rider, driver, vehicle, etc.)
   * @returns {Promise<array>} Array of notification results
   */
  async sendBulkNotifications(ride, notifications, data) {
    const results = [];

    for (const notif of notifications) {
      try {
        const phoneNumber = await this.getRecipientPhone(notif.recipient, data);

        if (!phoneNumber) {
          console.warn(`⚠️ No phone number for recipient: ${notif.recipient}`);
          results.push({
            recipient: notif.recipient,
            success: false,
            error: 'No phone number'
          });
          continue;
        }

        let result;
        if (notif.message) {
          // Custom message provided
          result = await this.sendSMS(phoneNumber, notif.message);
        } else if (notif.template) {
          // Use template
          result = await this.sendTemplateSMS(
            phoneNumber,
            notif.template,
            notif.recipient,
            { ride, ...data }
          );
        }

        results.push({
          recipient: notif.recipient,
          ...result
        });
      } catch (error) {
        console.error(`❌ Error sending notification to ${notif.recipient}:`, error);
        results.push({
          recipient: notif.recipient,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get phone number for recipient role
   * @param {string} recipient - 'rider', 'driver', 'case_manager', or 'dispatcher'
   * @param {object} data - Context data with rider, driver, etc.
   * @returns {string|null} Phone number
   */
  async getRecipientPhone(recipient, data) {
    switch (recipient) {
      case 'rider':
        return data.rider?.phone;

      case 'driver':
        return data.driver?.mobilePhone || data.driver?.phone;

      case 'case_manager':
        // Check authenticated case manager first, then manually entered phone
        return data.caseManager?.phone || data.createdBy?.phone || data.rideRequest?.caseManagerPhone;

      case 'dispatcher':
        // Check if specific dispatcher provided in data, otherwise get first active dispatcher
        if (data.dispatcher?.phone) {
          return data.dispatcher.phone;
        }
        
        // Query database for active dispatcher
        if (this.api) {
          try {
            const systemUsers = await this.api.getAllSystemUsers();
            const activeDispatcher = systemUsers.find(u => u.role === 'dispatcher' && u.isActive && u.phone);
            if (activeDispatcher) {
              return activeDispatcher.phone;
            }
          } catch (error) {
            console.error('❌ Error querying dispatcher:', error);
          }
        }
        
        return null;

      default:
        return null;
    }
  }

  /**
   * Send driver assignment notification (when ride matched to driver)
   * Uses new template system
   */
  async sendDriverAssignment(ride, driver, rider) {
    const message = smsTemplates.getDriverAssignmentMessage(ride, rider);
    const driverPhone = driver.mobilePhone || driver.phone;

    if (!driverPhone) {
      console.error('❌ Driver has no phone number!', { driver });
      return {
        success: false,
        error: 'Driver has no phone number configured',
        timestamp: new Date()
      };
    }

    console.log('📱 Sending driver assignment to:', driverPhone);

    return await this.sendSMS(driverPhone, message);
  }

  /**
   * Send 1 hour prior reminder to rider
   * @param {object} ride - The ride object
   * @param {object} rider - The rider object
   * @returns {Promise<object>} SMS result
   */
  async sendOneHourPriorReminder(ride, rider) {
    return await this.sendTemplateSMS(
      rider.phone,
      'ONE_HOUR_PRIOR',
      'rider',
      { ride, rider }
    );
  }

  /**
   * Send driver arrival check (at pickup time)
   * @param {object} ride - The ride object
   * @param {object} driver - The driver object
   * @returns {Promise<object>} SMS result
   */
  async sendDriverArrivalCheck(ride, driver) {
    return await this.sendTemplateSMS(
      driver.mobilePhone || driver.phone,
      'DRIVER_ARRIVAL_CHECK',
      'driver',
      { ride, driver }
    );
  }

  /**
   * Send dropoff check to driver (at estimated dropoff time)
   * @param {object} ride - The ride object
   * @param {object} driver - The driver object
   * @returns {Promise<object>} SMS result
   */
  async sendDropoffCheck(ride, driver) {
    return await this.sendTemplateSMS(
      driver.mobilePhone || driver.phone,
      'DROPOFF_CHECK',
      'driver',
      { ride, driver }
    );
  }

  /**
   * Send roundtrip return check to driver
   * @param {object} ride - The ride object
   * @param {object} driver - The driver object
   * @returns {Promise<object>} SMS result
   */
  async sendRoundtripReturnCheck(ride, driver) {
    return await this.sendTemplateSMS(
      driver.mobilePhone || driver.phone,
      'ROUNDTRIP_RETURN_CHECK',
      'driver',
      { ride, driver }
    );
  }
}

module.exports = new NotificationService();
