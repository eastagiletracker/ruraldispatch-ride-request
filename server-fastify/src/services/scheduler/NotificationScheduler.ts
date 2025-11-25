import { RIDE_REQUEST_STATUSES } from '../../constants/rideRequestStatuses.js';
import { isClosingStatus } from '../../constants/rideStatuses.js';
import type { Ride, ServiceProvider, User } from '../../types/database.types.js';
import notificationService from '../notificationService.js';
import type { TaskManager } from './TaskManager.js';
import timeCalculator from './TimeCalculator.js';

/**
 * Notification Scheduler
 * Handles individual notification scheduling operations using Twilio scheduled messages
 *
 * Responsibilities:
 * - Schedule specific notification types using Twilio's persistent scheduling
 * - Schedule status changes using in-memory setTimeout (server-specific)
 * - Execute scheduled tasks and handle cleanup
 *
 * IMPORTANT: Uses Twilio scheduled messages for SMS (persists across server restarts)
 */

type RecipientRole = 'driver' | 'rider' | 'case_manager';

interface TemplateData {
  ride?: Ride;
  rider?: User | null;
  driver?: ServiceProvider | null;
  [key: string]: unknown;
}

type ApiUpdateFunction = (uuid: string, updates: Record<string, unknown>) => Promise<unknown>;

class NotificationScheduler {
  private taskManager: TaskManager;

  constructor(taskManager: TaskManager) {
    this.taskManager = taskManager;
  }

  /**
   * Schedule driver arrival check at pickup time using Twilio scheduled messages
   * This persists across server restarts
   */
  scheduleDriverArrivalCheck(ride: Ride, driver: ServiceProvider): void {
    const timeInfo = timeCalculator.calculatePickupTime(ride);

    if (timeInfo.isPast) {
      // Send immediately if pickup time has passed
      console.log(
        `[WARN] Pickup time has passed for ride #${ride.uuid}, sending arrival check immediately`
      );
      notificationService.sendDriverArrivalCheck(ride, driver);
      return;
    }

    const { timeString, delayMinutes } = timeCalculator.formatTimeInfo(
      timeInfo.targetTime,
      timeInfo.delay
    );

    console.log(`[SCHEDULE] Driver arrival check for ride #${ride.uuid} via Twilio`);
    console.log(`   Pickup time: ${timeString}`);
    console.log(`   Delay: ${delayMinutes} minutes`);

    // Use Twilio's scheduled messages instead of setTimeout
    // This persists across server restarts
    // Add 15-second buffer to ensure we're safely above Twilio's 5-minute minimum
    const targetTime = new Date(timeInfo.targetTime);
    const minTwilioTime = new Date(Date.now() + 300 * 1000 + 15 * 1000); // 5 min + 15 sec buffer
    
    const sendAt = targetTime > minTwilioTime 
      ? targetTime.toISOString() 
      : minTwilioTime.toISOString();
    
    if (targetTime <= minTwilioTime) {
      console.log(`[ADJUST] Pickup time too soon, adjusting to Twilio minimum (5min + 15sec buffer)`);
    }
    
    notificationService.scheduleDriverArrivalCheck(ride, driver, sendAt)
      .then((result) => {
        if (result.success && result.messageSid) {
          console.log(`[SUCCESS] Driver arrival check scheduled via Twilio`);
          console.log(`   Message SID: ${result.messageSid}`);
          console.log(`   Scheduled for: ${sendAt}`);
          // Store the message SID for potential cancellation
          this.taskManager.addTask(ride.uuid, 'driver_arrival_check', result.messageSid as any);
        } else {
          console.error(`[ERROR] Failed to schedule driver arrival check: ${result.error}`);
        }
      })
      .catch((error) => {
        console.error('[ERROR] Error scheduling driver arrival check:', error);
      });
  }

  /**
   * Schedule dropoff check at estimated dropoff time
   */
  scheduleDropoffCheck(ride: Ride, driver: ServiceProvider): void {
    const timeInfo = timeCalculator.calculateDropoffTime(ride);

    if (timeInfo.isPast) {
      // Send immediately if dropoff time has passed
      console.log(`[WARN] Dropoff time has passed for ride #${ride.uuid}, sending check immediately`);
      notificationService.sendDropoffCheck(ride, driver);
      return;
    }

    const { timeString, delayMinutes } = timeCalculator.formatTimeInfo(
      timeInfo.targetTime,
      timeInfo.delay
    );

    console.log(`[SCHEDULE] Dropoff check for ride #${ride.uuid}`);
    console.log(`   Estimated dropoff: ${timeString}`);
    console.log(`   Delay: ${delayMinutes} minutes`);

    const timeoutId = setTimeout(async () => {
      try {
        console.log(`[SEND] Dropoff check for ride #${ride.uuid}`);
        await notificationService.sendDropoffCheck(ride, driver);
      } catch (error) {
        console.error('[ERROR] Error sending dropoff check:', error);
      } finally {
        // Remove task after execution (success or failure)
        this.taskManager.removeTask(ride.uuid, 'dropoff_check');
      }
    }, timeInfo.delay);

    this.taskManager.addTask(ride.uuid, 'dropoff_check', timeoutId);
  }

  /**
   * Schedule roundtrip return check
   */
  scheduleRoundtripReturnCheck(ride: Ride, driver: ServiceProvider): void {
    const timeInfo = timeCalculator.calculateRoundtripReturnTime(ride);

    if (timeInfo.isPast) {
      // Send immediately if return time has passed
      console.log(
        `[WARN] Return pickup time has passed for ride #${ride.uuid}, sending check immediately`
      );
      notificationService.sendRoundtripReturnCheck(ride, driver);
      return;
    }

    const { timeString, delayMinutes } = timeCalculator.formatTimeInfo(
      timeInfo.targetTime,
      timeInfo.delay
    );

    console.log(`[SCHEDULE] Roundtrip return check for ride #${ride.uuid}`);
    console.log(`   Estimated return pickup: ${timeString}`);
    console.log(`   Delay: ${delayMinutes} minutes`);

    const timeoutId = setTimeout(async () => {
      try {
        console.log(`[SEND] Roundtrip return check for ride #${ride.uuid}`);
        await notificationService.sendRoundtripReturnCheck(ride, driver);
      } catch (error) {
        console.error('[ERROR] Error sending roundtrip return check:', error);
      } finally {
        // Remove task after execution (success or failure)
        this.taskManager.removeTask(ride.uuid, 'roundtrip_return_check');
      }
    }, timeInfo.delay);

    this.taskManager.addTask(ride.uuid, 'roundtrip_return_check', timeoutId);
  }

  /**
   * Schedule status change after delay
   */
  scheduleStatusChange(
    ride: Ride,
    newStatus: number,
    delayMinutes: number,
    apiUpdateFunction: ApiUpdateFunction
  ): void {
    const timeInfo = timeCalculator.calculateDelayFromNow(delayMinutes);

    console.log(`[SCHEDULE] Status change for ride #${ride.uuid}`);
    console.log(`   New status: ${newStatus}`);
    console.log(`   Delay: ${delayMinutes} minutes`);

    const timeoutId = setTimeout(async () => {
      const taskName = `status_change_${newStatus}`;
      try {
        console.log(`[UPDATE] Changing status for ride #${ride.uuid} to ${newStatus}`);
        const updates: Record<string, unknown> = { rideStatus: newStatus };

        if (isClosingStatus(newStatus)) {
          updates.requestStatus = RIDE_REQUEST_STATUSES.ALL_RIDE_REQUEST_CLOSED.code;
        }

        await apiUpdateFunction(ride.uuid, updates);
        console.log(`[SUCCESS] Ride #${ride.uuid} status changed to ${newStatus}`);

        if (isClosingStatus(newStatus)) {
          this.taskManager.cancelAllTasks(ride.uuid);
        }
      } catch (error) {
        console.error('[ERROR] Error changing ride status:', error);
      } finally {
        // Remove task after execution (success or failure)
        this.taskManager.removeTask(ride.uuid, taskName);
      }
    }, timeInfo.delay);

    this.taskManager.addTask(ride.uuid, `status_change_${newStatus}`, timeoutId);
  }

  /**
   * Schedule notification after delay
   */
  scheduleNotification(
    ride: Ride,
    recipient: RecipientRole,
    template: string,
    delayMinutes: number,
    data: TemplateData
  ): void {
    const timeInfo = timeCalculator.calculateDelayFromNow(delayMinutes);

    console.log(`[SCHEDULE] ${template} notification for ride #${ride.uuid}`);
    console.log(`   Recipient: ${recipient}`);
    console.log(`   Delay: ${delayMinutes} minutes`);

    const timeoutId = setTimeout(async () => {
      const taskName = `notification_${template}_${recipient}`;
      try {
        console.log(`[SEND] Scheduled ${template} notification for ride #${ride.uuid}`);

        const phoneNumber = await notificationService.getRecipientPhone(recipient, data);
        if (phoneNumber) {
          await notificationService.sendTemplateSMS(phoneNumber, template, recipient, {
            ride,
            ...data,
          });
        } else {
          console.warn(`[WARN] No phone number found for ${recipient}`);
        }
      } catch (error) {
        console.error('[ERROR] Error sending scheduled notification:', error);
      } finally {
        // Remove task after execution (success or failure)
        this.taskManager.removeTask(ride.uuid, taskName);
      }
    }, timeInfo.delay);

    this.taskManager.addTask(ride.uuid, `notification_${template}_${recipient}`, timeoutId);
  }
}

export default NotificationScheduler;
