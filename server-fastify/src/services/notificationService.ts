import { randomUUID } from 'node:crypto';
import { RIDE_REQUEST_STATUSES } from '../constants/rideRequestStatuses.js';
import type { DatabaseAPI } from '../database/api.js';
import type { Ride, ServiceProvider, SystemUser, User, Vehicle } from '../types/database.types.js';
import type { SMSResult } from '../types/sms.types.js';
import { SMSProviderManager } from './smsProviders/SMSProviderManager.js';
import { processSMSResponse, type SMSResponseResult } from './smsResponseHandler.js';
import * as smsTemplates from './smsTemplates.js';

/**
 * Notification Service
 * Handles SMS notifications via multiple providers (Twilio primary, Vonage fallback)
 * Integrated with SMS templates and interactive response handling
 */

interface NotificationData {
  ride?: Ride;
  rider?: User | null;
  driver?: ServiceProvider | null;
  vehicle?: Vehicle | null;
  caseManager?: SystemUser | null;
  dispatcher?: SystemUser | null;
  createdBy?: SystemUser | null;
  rideRequest?: { caseManagerPhone?: string };
  pickupLocation?: string;
}

interface NotificationToSend {
  recipient: 'rider' | 'driver' | 'case_manager' | 'dispatcher';
  template?: string | number;
  message?: string;
}

export class NotificationService {
  private smsProvider: SMSProviderManager;
  private api: DatabaseAPI | null = null;

  constructor() {
    this.smsProvider = new SMSProviderManager();
  }

  /**
   * Initialize the service with API reference for database operations
   */
  setApi(api: DatabaseAPI): void {
    this.api = api;
  }

  /**
   * Send SMS notification
   * Uses SMS Provider Manager with automatic fallback
   */
  async sendSMS(to: string, message: string): Promise<SMSResult> {
    return await this.smsProvider.sendSMS(to, message);
  }

  /**
   * Get SMS provider status
   */
  getProviderStatus(): {
    twilio: { configured: boolean; isPrimary?: boolean };
    vonage: { configured: boolean; isFallback?: boolean };
  } {
    return this.smsProvider.getStatus();
  }

  /**
   * Send ride accepted notification to rider
   */
  async notifyRideAccepted(
    ride: Ride,
    rider: User,
    driver: ServiceProvider,
    vehicle: Vehicle | null
  ): Promise<SMSResult> {
    const vehicleInfo = vehicle ? `Vehicle: ${vehicle.displayName}` : 'Vehicle: TBD';
    const pickupTime = new Date(ride.pickupRequestedTime).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const message = `Ride Confirmed
Driver: ${driver.fullName}
${vehicleInfo}
Pickup: ${ride.pickupAddress}
Time: ${pickupTime}
To cancel ride, reply 3`;

    return await this.sendSMS(rider.phone, message);
  }

  /**
   * Send ride started notification to rider
   */
  async notifyRideStarted(ride: Ride, rider: User, driver: ServiceProvider): Promise<SMSResult> {
    const message = `Your ride has started!
Driver ${driver.fullName} is on the way to pick you up at ${ride.pickupAddress}.
We'll notify you when you arrive.`;

    return await this.sendSMS(rider.phone, message);
  }

  /**
   * Send rider picked up notification
   */
  async notifyRiderPickedUp(ride: Ride, rider: User, driver: ServiceProvider): Promise<SMSResult> {
    const message = `You've been picked up by ${driver.fullName}.
Heading to: ${ride.dropOffAddress}
Have a safe trip!`;

    return await this.sendSMS(rider.phone, message);
  }

  /**
   * Send rider dropped off notification
   */
  async notifyRiderDroppedOff(ride: Ride, rider: User): Promise<SMSResult> {
    const roundTripInfo = ride.roundTrip ? '\nYour return trip will begin shortly.' : '';

    const message = `You've been dropped off at ${ride.dropOffAddress}.
Thank you for riding with us!${roundTripInfo}`;

    return await this.sendSMS(rider.phone, message);
  }

  /**
   * Send ride complete notification
   */
  async notifyRideComplete(_ride: Ride, rider: User): Promise<SMSResult> {
    const message = `Your ride is now complete.
Thank you for using our service! If you have any feedback, please contact us.`;

    return await this.sendSMS(rider.phone, message);
  }



  /**
   * Send status update notification to dispatcher
   */
  async notifyDispatcher(dispatcherPhone: string, _ride: Ride, status: number): Promise<SMSResult> {
    const statusText = this.getStatusText(status);
    const message = `Ride status update: ${statusText}`;
    return await this.sendSMS(dispatcherPhone, message);
  }

  /**
   * Handle automatic notifications based on ride status change
   */
  async handleRideStatusChange(
    ride: Ride,
    _oldStatus: number,
    newStatus: number,
    userData: NotificationData
  ): Promise<Array<{ type: string } & SMSResult>> {
    const notifications: Array<{ type: string } & SMSResult> = [];

    try {
      // When driver is assigned (request status moves to RIDE_CONFIRMATION_NEEDED = 400)
      console.log('Checking assignment notification:');
      console.log(
        '  requestStatus === 400 (RIDE_CONFIRMATION_NEEDED)?',
        newStatus === RIDE_REQUEST_STATUSES.RIDE_CONFIRMATION_NEEDED.code,
        `(${newStatus} === ${RIDE_REQUEST_STATUSES.RIDE_CONFIRMATION_NEEDED.code})`
      );
      console.log('  Has rider?', !!userData.rider);
      console.log('  Has driver?', !!userData.driver);

      if (
        newStatus === RIDE_REQUEST_STATUSES.RIDE_CONFIRMATION_NEEDED.code &&
        userData.rider &&
        userData.driver
      ) {
        console.log('   Condition passed! Sending SMS...');

        try {
          console.log('=� Sending rider notification...');
          const riderNotif = await this.notifyRideAccepted(
            ride,
            userData.rider,
            userData.driver,
            userData.vehicle || null
          );
          notifications.push({ type: 'rider_accepted', ...riderNotif });
          console.log(' Rider notification result:', riderNotif.success ? 'SUCCESS' : 'FAILED');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('L Error sending rider notification:', errorMessage);
        }

        // Send notification to case manager
        try {
          console.log('=📭 Sending case manager notification...');
          if (ride.caseManagerPhone) {
            // Create case manager user object with data from ride
            const caseManagerUser = {
              uuid: 'case-manager', // Placeholder UUID
              fullName: ride.caseManagerName || 'Case Manager',
              phone: ride.caseManagerPhone,
              email: null,
              address: null,
              role: 'case_manager',
              smsConsentGiven: true,
              smsConsentTimestamp: null,
              smsConsentIpAddress: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const caseManagerNotif = await this.notifyRideAccepted(
              ride,
              caseManagerUser,
              userData.driver,
              userData.vehicle || null
            );
            notifications.push({ type: 'case_manager_accepted', ...caseManagerNotif });
            console.log('✅ Case manager notification result:', caseManagerNotif.success ? 'SUCCESS' : 'FAILED');
          } else {
            console.log('⚠️ No case manager phone number available');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('❌ Error sending case manager notification:', errorMessage);
        }

        // NOTE: Driver approval notification removed - driver will be notified at pickup time
        console.log('=� Driver will be notified at pickup time (no approval needed)');
      }

      // Status 200 (RIDE_STARTED) - Per CSV spec, NO SMS should be sent
      console.log('Status 200 (RIDE_STARTED) - No SMS per CSV spec');

      // Legacy notification checks - These are now handled by the SMS flow system
      console.log('Status 300 (RIDER_PICKED_UP) - Handled by SMS flow system');
      console.log('Status 400 (RIDER_DROPPED_OFF) - Handled by SMS flow system');
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
  getStatusText(status: number): string {
    const statusMap: Record<number, string> = {
      0: 'Request In Progress',
      100: 'Ride Confirmed',
      200: 'Ride Started',
      300: 'Rider Picked Up',
      400: 'Rider Dropped Off',
      450: 'Returning (Round Trip)',
      475: 'Round Trip Complete',
      500: 'Ride Complete',
    };

    return statusMap[status] || `Status ${status}`;
  }

  /**
   * Close out ride session (cleanup/logging)
   */
  async closeRideSession(rideUuid: string): Promise<{ success: boolean; message: string }> {
    console.log(`Closing ride session for ride #${rideUuid}`);
    return { success: true, message: `Session closed for ride #${rideUuid}` };
  }

  /**
   * Send template-based SMS notification
   */
  async sendTemplateSMS(
    phoneNumber: string,
    template: string | number,
    recipient: 'rider' | 'driver' | 'case_manager' | 'dispatcher',
    _data: NotificationData
  ): Promise<SMSResult> {
    const data = _data; // Workaround for unused parameter
    const message = smsTemplates.getSMSTemplate(template as any, recipient, data);

    if (!message) {
      console.warn(`� No SMS template found for template=${template}, recipient=${recipient}`);
      return {
        success: false,
        provider: 'twilio',
        error: 'No template found',
        to: phoneNumber,
        body: '',
        timestamp: new Date(),
      };
    }

    console.log(`=� Sending ${template} SMS to ${recipient}: ${phoneNumber}`);
    console.log(`   Message preview: ${message.substring(0, 100)}...`);

    const result = await this.sendSMS(phoneNumber, message);

    // Save to database if API is available and SMS was sent successfully
    if (this.api && result.success) {
      try {
        const notificationRecord = {
          uuid: randomUUID(),
          rideUuid: data.ride ? data.ride.uuid : null,
          notificationType: String(template),
          direction: 'outbound',
          recipientPhone: phoneNumber,
          recipientName: data.rider?.fullName || data.driver?.fullName || null,
          recipientRole: recipient,
          messageBody: message,
          twilioMessageSid: result.messageSid || result.messageId || null,
          twilioStatus: result.status || undefined,
          isScheduled: false, // Immediate message, not scheduled
          sentAt: result.timestamp,
          deliveredAt: null,
          errorMessage: result.error || null,
        };

        await this.api.addNotification(notificationRecord);
        console.log(
          `=� Notification saved to database (ID: ${result.messageSid || result.messageId})`
        );
      } catch (dbError) {
        console.error('L Failed to save notification to database:', dbError);
        // Don't fail the SMS send if DB save fails
      }
    }

    return result;
  }

  /**
   * Process incoming SMS response from rider/driver/case manager
   */
  async processIncomingSMS(
    fromPhone: string,
    messageBody: string,
    ride: Ride,
    senderRole: 'driver' | 'rider' | 'case_manager'
  ): Promise<SMSResponseResult> {
    console.log('=� Processing incoming SMS:', {
      from: fromPhone,
      role: senderRole,
      rideUuid: ride.uuid,
      message: messageBody.substring(0, 50),
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
    return action;
  }

  /**
   * Send notifications to multiple recipients for a ride status change
   */
  async sendBulkNotifications(
    ride: Ride,
    notifications: NotificationToSend[],
    data: NotificationData
  ): Promise<Array<{ recipient: string } & Partial<SMSResult>>> {
    const results: Array<{ recipient: string } & Partial<SMSResult>> = [];

    for (const notif of notifications) {
      try {
        const phoneNumber = await this.getRecipientPhone(notif.recipient, data);

        if (!phoneNumber) {
          console.warn(`� No phone number for recipient: ${notif.recipient}`);
          results.push({
            recipient: notif.recipient,
            success: false,
            error: 'No phone number',
          });
          continue;
        }

        let result: SMSResult;
        if (notif.message) {
          // Custom message provided
          result = await this.sendSMS(phoneNumber, notif.message);
        } else if (notif.template) {
          // Use template
          result = await this.sendTemplateSMS(phoneNumber, notif.template, notif.recipient, {
            ride,
            ...data,
          });
        } else {
          results.push({
            recipient: notif.recipient,
            success: false,
            error: 'No message or template provided',
          });
          continue;
        }

        results.push({
          recipient: notif.recipient,
          ...result,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`L Error sending notification to ${notif.recipient}:`, errorMessage);
        results.push({
          recipient: notif.recipient,
          success: false,
          error: errorMessage,
        });
      }
    }

    return results;
  }

  /**
   * Get phone number for recipient role
   */
  async getRecipientPhone(
    recipient: 'rider' | 'driver' | 'case_manager' | 'dispatcher',
    data: NotificationData
  ): Promise<string | null> {
    switch (recipient) {
      case 'rider':
        return data.rider?.phone || null;

      case 'driver':
        return data.driver?.mobilePhone || data.driver?.phone || null;

      case 'case_manager':
        // Note: SystemUser schema doesn't include phone field
        // Check if explicit phone provided, otherwise fall back to caseManagerPhone from ride request
        if (data.caseManager && 'phone' in data.caseManager) {
          return (data.caseManager as any).phone || null;
        }
        if (data.createdBy && 'phone' in data.createdBy) {
          return (data.createdBy as any).phone || null;
        }
        return data.rideRequest?.caseManagerPhone || null;

      case 'dispatcher':
        // Note: SystemUser schema doesn't include phone field
        // This is a limitation that would need to be addressed in the future
        // For now, dispatcher notifications require explicit phone number in data
        if (data.dispatcher && 'phone' in data.dispatcher) {
          return (data.dispatcher as any).phone || null;
        }

        console.warn(
          '⚠️ Dispatcher phone number not available - SystemUser schema has no phone field'
        );
        return null;

      default:
        return null;
    }
  }

  /**
   * Send driver arrival check (at pickup time)
   */
  async sendDriverArrivalCheck(ride: Ride, driver: ServiceProvider): Promise<SMSResult> {
    const driverPhone = driver.mobilePhone || driver.phone;
    if (!driverPhone) {
      return {
        success: false,
        provider: 'twilio',
        error: 'Driver has no phone number',
        to: '',
        body: '',
        timestamp: new Date(),
      };
    }
    return await this.sendTemplateSMS(driverPhone, 'DRIVER_ARRIVAL_CHECK', 'driver', {
      ride,
      driver,
    });
  }

  /**
   * Send dropoff check to driver (at estimated dropoff time)
   */
  async sendDropoffCheck(ride: Ride, driver: ServiceProvider): Promise<SMSResult> {
    const driverPhone = driver.mobilePhone || driver.phone;
    if (!driverPhone) {
      return {
        success: false,
        provider: 'twilio',
        error: 'Driver has no phone number',
        to: '',
        body: '',
        timestamp: new Date(),
      };
    }
    return await this.sendTemplateSMS(driverPhone, 'DROPOFF_CHECK', 'driver', { ride, driver });
  }

  /**
   * Send roundtrip return check to driver
   */
  async sendRoundtripReturnCheck(ride: Ride, driver: ServiceProvider): Promise<SMSResult> {
    const driverPhone = driver.mobilePhone || driver.phone;
    if (!driverPhone) {
      return {
        success: false,
        provider: 'twilio',
        error: 'Driver has no phone number',
        to: '',
        body: '',
        timestamp: new Date(),
      };
    }
    return await this.sendTemplateSMS(driverPhone, 'ROUNDTRIP_RETURN_CHECK', 'driver', {
      ride,
      driver,
    });
  }

  /**
   * Schedule driver arrival check using Twilio's built-in scheduling
   * @param ride - Ride data
   * @param driver - Driver data
   * @param sendAt - ISO 8601 datetime when message should be sent
   * @returns SMS result with scheduled message SID
   */
  async scheduleDriverArrivalCheck(
    ride: Ride,
    driver: ServiceProvider,
    sendAt: string
  ): Promise<SMSResult & { scheduledMessageSid?: string }> {
    const driverPhone = driver.mobilePhone || driver.phone;
    if (!driverPhone) {
      return {
        success: false,
        provider: 'twilio',
        error: 'Driver has no phone number',
        to: '',
        body: '',
        timestamp: new Date(),
      };
    }

    // Get the template message
    const messageBody = smsTemplates.getSMSTemplate('DRIVER_ARRIVAL_CHECK', 'driver', {
      ride,
      driver,
    });
    if (!messageBody) {
      return {
        success: false,
        provider: 'twilio',
        error: 'Failed to generate message template',
        to: driverPhone,
        body: '',
        timestamp: new Date(),
      };
    }

    console.log('\n📅 ===== SCHEDULING DRIVER ARRIVAL CHECK =====');
    console.log(`🎫 Ride UUID: ${ride.uuid}`);
    console.log(`👤 Driver: ${driver.fullName} (${driverPhone})`);
    console.log(`⏰ Pickup Requested Time: ${ride.pickupRequestedTime}`);
    console.log(`⏰ Send at (parameter): ${sendAt}`);
    console.log(`⏰ Send at (parsed): ${new Date(sendAt).toISOString()}`);
    console.log(`⏰ Current server time: ${new Date().toISOString()}`);
    console.log(`⏰ Server timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    console.log(`⏰ Minutes until send: ${Math.round((new Date(sendAt).getTime() - Date.now()) / 60000)}`);

    // Schedule via Twilio
    const result = await this.smsProvider.scheduleScheduledSMS(driverPhone, messageBody, sendAt);

    if (result.success && result.messageSid && this.api) {
      // Save notification record to database
      try {
        const notificationData = {
          uuid: randomUUID(),
          rideUuid: ride.uuid,
          notificationType: 'driver_arrival_check',
          direction: 'outbound',
          recipientPhone: driverPhone,
          recipientName: driver.fullName,
          recipientRole: 'driver',
          messageBody,
          twilioMessageSid: result.messageSid,
          twilioStatus: result.status || 'scheduled',
          scheduledMessageSid: result.messageSid,
          scheduledSendAt: new Date(sendAt),
          isScheduled: true,
          sentAt: new Date(sendAt),
          sessionActive: true,
        };

        console.log('\n💾 Saving scheduled message to database...');
        console.log(`📋 Notification UUID: ${notificationData.uuid}`);
        console.log(`📋 Twilio Message SID: ${result.messageSid}`);
        console.log(`📋 Status: ${result.status}`);
        console.log(`📋 Scheduled Send At: ${new Date(sendAt).toISOString()}`);
        console.log(`📋 Is Scheduled: true`);

        await this.api.addNotification(notificationData);

        console.log('✅ Scheduled driver arrival check saved to database');
      } catch (error) {
        console.error('❌ Failed to save scheduled notification to database:', error);
        console.error('❌ Error details:', error instanceof Error ? error.stack : error);
      }

      return {
        ...result,
        scheduledMessageSid: result.messageSid,
      };
    }

    return result;
  }

  /**
   * Cancel a scheduled message
   * @param messageSid - The Twilio message SID to cancel
   * @returns Success status
   */
  async cancelScheduledMessage(messageSid: string): Promise<{ success: boolean; error?: string }> {
    console.log(`🚫 Canceling scheduled message: ${messageSid}`);
    const result = await this.smsProvider.cancelScheduledSMS(messageSid);

    if (result.success && this.api) {
      // Update notification record in database
      try {
        const notification = await this.api.getNotificationByMessageSid(messageSid);
        if (notification && notification.twilioMessageSid) {
          await this.api.updateNotificationStatus(notification.twilioMessageSid, {
            status: 'canceled',
          });
          console.log(`✅ Updated notification status to canceled in database`);
        }
      } catch (error) {
        console.error('❌ Failed to update notification in database:', error);
      }
    }

    return result;
  }

  /**
   * Cancel all scheduled messages for a ride
   * @param rideUuid - The ride UUID
   * @returns Array of cancellation results
   */
  async cancelScheduledMessagesForRide(
    rideUuid: string
  ): Promise<Array<{ messageSid: string; success: boolean; error?: string }>> {
    console.log(`🚫 Canceling all scheduled messages for ride #${rideUuid}`);

    if (!this.api) {
      console.error('❌ API not initialized');
      return [];
    }

    try {
      // Get all scheduled notifications for the ride
      const notifications = await this.api.getNotificationsByRide(rideUuid);
      const scheduledNotifications = notifications.filter(
        (n: any) =>
          n.isScheduled && (n.twilioStatus === 'scheduled' || n.twilioStatus === 'accepted')
      );

      console.log(`   Found ${scheduledNotifications.length} scheduled messages to cancel`);

      const results = [];
      for (const notif of scheduledNotifications) {
        if (notif.scheduledMessageSid) {
          const result = await this.cancelScheduledMessage(notif.scheduledMessageSid);
          results.push({
            messageSid: notif.scheduledMessageSid,
            ...result,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Failed to cancel scheduled messages:', error);
      return [];
    }
  }
}

// Export singleton instance
export default new NotificationService();
