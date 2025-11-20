import notificationService from '../notificationService.js';
import timeCalculator from './TimeCalculator.js';
import { RIDE_STATUSES, isClosingStatus } from '../../constants/rideStatuses.js';
import { RIDE_REQUEST_STATUSES } from '../../constants/rideRequestStatuses.js';

/**
 * Notification Scheduler
 * Handles individual notification scheduling operations
 *
 * Responsibilities:
 * - Schedule specific notification types (1 hour prior, arrival, dropoff, etc.)
 * - Schedule status changes
 * - Schedule generic notifications
 * - Execute scheduled tasks and handle cleanup
 */
class NotificationScheduler {
  constructor(taskManager) {
    this.taskManager = taskManager;
  }

  /**
   * Schedule 1 hour prior reminder to rider
   * @param {object} ride - The ride object
   * @param {object} rider - The rider object
   * @param {Function} apiUpdateFunction - Function to update ride in DB
   */
  scheduleOneHourPrior(ride, rider, apiUpdateFunction) {
    const timeInfo = timeCalculator.calculateOneHourPrior(ride);

    if (timeInfo.isPast) {
      console.log(`⏭️  1-hour prior time has passed for ride #${ride.uuid}, skipping`);
      return;
    }

    const { timeString, delayMinutes } = timeCalculator.formatTimeInfo(
      timeInfo.targetTime,
      timeInfo.delay
    );

    console.log(`⏰ Scheduling 1-hour prior reminder for ride #${ride.uuid}`);
    console.log(`   Pickup time: ${timeInfo.pickupTime.toLocaleString()}`);
    console.log(`   Reminder at: ${timeString}`);
    console.log(`   Delay: ${delayMinutes} minutes`);

    const timeoutId = setTimeout(async () => {
      try {
        console.log(`⏰ Sending 1-hour prior reminder for ride #${ride.uuid}`);
        await notificationService.sendOneHourPriorReminder(ride, rider);
      } catch (error) {
        console.error('❌ Error sending 1-hour prior reminder:', error);
      } finally {
        // Remove task after execution (success or failure)
        this.taskManager.removeTask(ride.uuid, '1_hour_prior');
      }
    }, timeInfo.delay);

    this.taskManager.addTask(ride.uuid, '1_hour_prior', timeoutId);
  }

  /**
   * Schedule driver arrival check at pickup time
   * @param {object} ride - The ride object
   * @param {object} driver - The driver object
   */
  scheduleDriverArrivalCheck(ride, driver) {
    const timeInfo = timeCalculator.calculatePickupTime(ride);

    if (timeInfo.isPast) {
      // Send immediately if pickup time has passed
      console.log(`⏭️  Pickup time has passed for ride #${ride.uuid}, sending arrival check immediately`);
      notificationService.sendDriverArrivalCheck(ride, driver);
      return;
    }

    const { timeString, delayMinutes } = timeCalculator.formatTimeInfo(
      timeInfo.targetTime,
      timeInfo.delay
    );

    console.log(`⏰ Scheduling driver arrival check for ride #${ride.uuid}`);
    console.log(`   Pickup time: ${timeString}`);
    console.log(`   Delay: ${delayMinutes} minutes`);

    const timeoutId = setTimeout(async () => {
      try {
        console.log(`⏰ Sending driver arrival check for ride #${ride.uuid}`);
        await notificationService.sendDriverArrivalCheck(ride, driver);
      } catch (error) {
        console.error('❌ Error sending driver arrival check:', error);
      } finally {
        // Remove task after execution (success or failure)
        this.taskManager.removeTask(ride.uuid, 'driver_arrival_check');
      }
    }, timeInfo.delay);

    this.taskManager.addTask(ride.uuid, 'driver_arrival_check', timeoutId);
  }

  /**
   * Schedule dropoff check at estimated dropoff time
   * @param {object} ride - The ride object
   * @param {object} driver - The driver object
   */
  scheduleDropoffCheck(ride, driver) {
    const timeInfo = timeCalculator.calculateDropoffTime(ride);

    if (timeInfo.isPast) {
      // Send immediately if dropoff time has passed
      console.log(`⏭️  Dropoff time has passed for ride #${ride.uuid}, sending check immediately`);
      notificationService.sendDropoffCheck(ride, driver);
      return;
    }

    const { timeString, delayMinutes } = timeCalculator.formatTimeInfo(
      timeInfo.targetTime,
      timeInfo.delay
    );

    console.log(`⏰ Scheduling dropoff check for ride #${ride.uuid}`);
    console.log(`   Estimated dropoff: ${timeString}`);
    console.log(`   Delay: ${delayMinutes} minutes`);

    const timeoutId = setTimeout(async () => {
      try {
        console.log(`⏰ Sending dropoff check for ride #${ride.uuid}`);
        await notificationService.sendDropoffCheck(ride, driver);
      } catch (error) {
        console.error('❌ Error sending dropoff check:', error);
      } finally {
        // Remove task after execution (success or failure)
        this.taskManager.removeTask(ride.uuid, 'dropoff_check');
      }
    }, timeInfo.delay);

    this.taskManager.addTask(ride.uuid, 'dropoff_check', timeoutId);
  }

  /**
   * Schedule roundtrip return check
   * @param {object} ride - The ride object
   * @param {object} driver - The driver object
   */
  scheduleRoundtripReturnCheck(ride, driver) {
    const timeInfo = timeCalculator.calculateRoundtripReturnTime(ride);

    if (timeInfo.isPast) {
      // Send immediately if return time has passed
      console.log(`⏭️  Return pickup time has passed for ride #${ride.uuid}, sending check immediately`);
      notificationService.sendRoundtripReturnCheck(ride, driver);
      return;
    }

    const { timeString, delayMinutes } = timeCalculator.formatTimeInfo(
      timeInfo.targetTime,
      timeInfo.delay
    );

    console.log(`⏰ Scheduling roundtrip return check for ride #${ride.uuid}`);
    console.log(`   Estimated return pickup: ${timeString}`);
    console.log(`   Delay: ${delayMinutes} minutes`);

    const timeoutId = setTimeout(async () => {
      try {
        console.log(`⏰ Sending roundtrip return check for ride #${ride.uuid}`);
        await notificationService.sendRoundtripReturnCheck(ride, driver);
      } catch (error) {
        console.error('❌ Error sending roundtrip return check:', error);
      } finally {
        // Remove task after execution (success or failure)
        this.taskManager.removeTask(ride.uuid, 'roundtrip_return_check');
      }
    }, timeInfo.delay);

    this.taskManager.addTask(ride.uuid, 'roundtrip_return_check', timeoutId);
  }

  /**
   * Schedule status change after delay
   * @param {object} ride - The ride object
   * @param {number} newStatus - New ride status code
   * @param {number} delayMinutes - Delay in minutes
   * @param {Function} apiUpdateFunction - Function to update ride (async (uuid, updates) => {})
   */
  scheduleStatusChange(ride, newStatus, delayMinutes, apiUpdateFunction) {
    const timeInfo = timeCalculator.calculateDelayFromNow(delayMinutes);

    console.log(`⏰ Scheduling status change for ride #${ride.uuid}`);
    console.log(`   New status: ${newStatus}`);
    console.log(`   Delay: ${delayMinutes} minutes`);

    const timeoutId = setTimeout(async () => {
      const taskName = `status_change_${newStatus}`;
      try {
        console.log(`⏰ Changing status for ride #${ride.uuid} to ${newStatus}`);
        const updates = { rideStatus: newStatus };

        if (isClosingStatus(newStatus)) {
          updates.requestStatus = RIDE_REQUEST_STATUSES.CLOSED.code;
        }

        await apiUpdateFunction(ride.uuid, updates);
        console.log(`✅ Ride #${ride.uuid} status changed to ${newStatus}`);

        if (isClosingStatus(newStatus)) {
          this.taskManager.cancelAllTasks(ride.uuid);
        }
      } catch (error) {
        console.error('❌ Error changing ride status:', error);
      } finally {
        // Remove task after execution (success or failure)
        this.taskManager.removeTask(ride.uuid, taskName);
      }
    }, timeInfo.delay);

    this.taskManager.addTask(ride.uuid, `status_change_${newStatus}`, timeoutId);
  }

  /**
   * Schedule notification after delay
   * @param {object} ride - The ride object
   * @param {string} recipient - Recipient role ('driver', 'rider', 'case_manager')
   * @param {string} template - Template identifier
   * @param {number} delayMinutes - Delay in minutes
   * @param {object} data - Data for template (rider, driver, etc.)
   */
  scheduleNotification(ride, recipient, template, delayMinutes, data) {
    const timeInfo = timeCalculator.calculateDelayFromNow(delayMinutes);

    console.log(`⏰ Scheduling ${template} notification for ride #${ride.uuid}`);
    console.log(`   Recipient: ${recipient}`);
    console.log(`   Delay: ${delayMinutes} minutes`);

    const timeoutId = setTimeout(async () => {
      const taskName = `notification_${template}_${recipient}`;
      try {
        console.log(`⏰ Sending scheduled ${template} notification for ride #${ride.uuid}`);

        const phoneNumber = notificationService.getRecipientPhone(recipient, data);
        if (phoneNumber) {
          await notificationService.sendTemplateSMS(
            phoneNumber,
            template,
            recipient,
            { ride, ...data }
          );
        } else {
          console.warn(`⚠️  No phone number found for ${recipient}`);
        }
      } catch (error) {
        console.error('❌ Error sending scheduled notification:', error);
      } finally {
        // Remove task after execution (success or failure)
        this.taskManager.removeTask(ride.uuid, taskName);
      }
    }, timeInfo.delay);

    this.taskManager.addTask(ride.uuid, `notification_${template}_${recipient}`, timeoutId);
  }
}

export default NotificationScheduler;
