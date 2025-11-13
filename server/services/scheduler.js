const notificationService = require('./notificationService');
const { RIDE_STATUSES } = require('../constants/rideStatuses');

/**
 * Ride Scheduler Service
 * Handles time-based SMS notifications and status changes
 *
 * Features:
 * - 1 hour prior reminders
 * - Pickup time arrival checks
 * - Dropoff time checks
 * - Roundtrip return checks
 * - Delayed status changes (5 min after pickup -> RIDE_STARTED)
 * - Delayed re-checks (5 min after driver waiting)
 */
class RideScheduler {
  constructor() {
    // Map of rideUuid -> array of scheduled tasks
    this.scheduledTasks = new Map();
  }

  /**
   * Schedule 1 hour prior reminder to rider
   * @param {object} ride - The ride object
   * @param {object} rider - The rider object
   * @param {Function} apiUpdateFunction - Function to update ride in DB
   */
  scheduleOneHourPrior(ride, rider, apiUpdateFunction) {
    const pickupTime = new Date(ride.pickupRequestedTime);
    const oneHourPrior = new Date(pickupTime.getTime() - 60 * 60 * 1000);

    const now = new Date();
    if (oneHourPrior <= now) {
      console.log(`⏭️  1-hour prior time has passed for ride #${ride.uuid}, skipping`);
      return;
    }

    const delay = oneHourPrior.getTime() - now.getTime();

    console.log(`⏰ Scheduling 1-hour prior reminder for ride #${ride.uuid}`);
    console.log(`   Pickup time: ${pickupTime.toLocaleString()}`);
    console.log(`   Reminder at: ${oneHourPrior.toLocaleString()}`);
    console.log(`   Delay: ${Math.round(delay / 1000 / 60)} minutes`);

    const timeoutId = setTimeout(async () => {
      try {
        console.log(`⏰ Sending 1-hour prior reminder for ride #${ride.uuid}`);
        await notificationService.sendOneHourPriorReminder(ride, rider);
      } catch (error) {
        console.error('❌ Error sending 1-hour prior reminder:', error);
      } finally {
        // Remove task after execution (success or failure)
        this.removeTask(ride.uuid, '1_hour_prior');
      }
    }, delay);

    this.addTask(ride.uuid, '1_hour_prior', timeoutId);
  }

  /**
   * Schedule driver arrival check at pickup time
   * @param {object} ride - The ride object
   * @param {object} driver - The driver object
   */
  scheduleDriverArrivalCheck(ride, driver) {
    const pickupTime = new Date(ride.pickupRequestedTime);

    const now = new Date();
    const delay = pickupTime.getTime() - now.getTime();

    if (delay <= 0) {
      // Send immediately if pickup time has passed
      console.log(`⏭️  Pickup time has passed for ride #${ride.uuid}, sending arrival check immediately`);
      notificationService.sendDriverArrivalCheck(ride, driver);
      return;
    }

    console.log(`⏰ Scheduling driver arrival check for ride #${ride.uuid}`);
    console.log(`   Pickup time: ${pickupTime.toLocaleString()}`);
    console.log(`   Delay: ${Math.round(delay / 1000 / 60)} minutes`);

    const timeoutId = setTimeout(async () => {
      try {
        console.log(`⏰ Sending driver arrival check for ride #${ride.uuid}`);
        await notificationService.sendDriverArrivalCheck(ride, driver);
      } catch (error) {
        console.error('❌ Error sending driver arrival check:', error);
      } finally {
        // Remove task after execution (success or failure)
        this.removeTask(ride.uuid, 'driver_arrival_check');
      }
    }, delay);

    this.addTask(ride.uuid, 'driver_arrival_check', timeoutId);
  }

  /**
   * Schedule dropoff check at estimated dropoff time
   * @param {object} ride - The ride object
   * @param {object} driver - The driver object
   */
  scheduleDropoffCheck(ride, driver) {
    // Calculate estimated dropoff time
    // pickupTime + estimatedTravelTime
    const pickupTime = new Date(ride.pickupRequestedTime);
    const travelTimeMinutes = ride.estimatedTravelTime || 30; // Default 30 min if not set
    const dropoffTime = new Date(pickupTime.getTime() + travelTimeMinutes * 60 * 1000);

    const now = new Date();
    const delay = dropoffTime.getTime() - now.getTime();

    if (delay <= 0) {
      // Send immediately if dropoff time has passed
      console.log(`⏭️  Dropoff time has passed for ride #${ride.uuid}, sending check immediately`);
      notificationService.sendDropoffCheck(ride, driver);
      return;
    }

    console.log(`⏰ Scheduling dropoff check for ride #${ride.uuid}`);
    console.log(`   Estimated dropoff: ${dropoffTime.toLocaleString()}`);
    console.log(`   Delay: ${Math.round(delay / 1000 / 60)} minutes`);

    const timeoutId = setTimeout(async () => {
      try {
        console.log(`⏰ Sending dropoff check for ride #${ride.uuid}`);
        await notificationService.sendDropoffCheck(ride, driver);
      } catch (error) {
        console.error('❌ Error sending dropoff check:', error);
      } finally {
        // Remove task after execution (success or failure)
        this.removeTask(ride.uuid, 'dropoff_check');
      }
    }, delay);

    this.addTask(ride.uuid, 'dropoff_check', timeoutId);
  }

  /**
   * Schedule roundtrip return check
   * @param {object} ride - The ride object
   * @param {object} driver - The driver object
   */
  scheduleRoundtripReturnCheck(ride, driver) {
    // Calculate return pickup time
    // dropoffTime + estimatedWaitingTime
    const pickupTime = new Date(ride.pickupRequestedTime);
    const travelTimeMinutes = ride.estimatedTravelTime || 30;
    const waitingTimeMinutes = ride.estimatedWaitingTime || 60; // Default 60 min wait

    const returnPickupTime = new Date(
      pickupTime.getTime() +
      (travelTimeMinutes + waitingTimeMinutes) * 60 * 1000
    );

    const now = new Date();
    const delay = returnPickupTime.getTime() - now.getTime();

    if (delay <= 0) {
      // Send immediately if return time has passed
      console.log(`⏭️  Return pickup time has passed for ride #${ride.uuid}, sending check immediately`);
      notificationService.sendRoundtripReturnCheck(ride, driver);
      return;
    }

    console.log(`⏰ Scheduling roundtrip return check for ride #${ride.uuid}`);
    console.log(`   Estimated return pickup: ${returnPickupTime.toLocaleString()}`);
    console.log(`   Delay: ${Math.round(delay / 1000 / 60)} minutes`);

    const timeoutId = setTimeout(async () => {
      try {
        console.log(`⏰ Sending roundtrip return check for ride #${ride.uuid}`);
        await notificationService.sendRoundtripReturnCheck(ride, driver);
      } catch (error) {
        console.error('❌ Error sending roundtrip return check:', error);
      } finally {
        // Remove task after execution (success or failure)
        this.removeTask(ride.uuid, 'roundtrip_return_check');
      }
    }, delay);

    this.addTask(ride.uuid, 'roundtrip_return_check', timeoutId);
  }

  /**
   * Schedule status change after delay
   * @param {object} ride - The ride object
   * @param {number} newStatus - New ride status code
   * @param {number} delayMinutes - Delay in minutes
   * @param {Function} apiUpdateFunction - Function to update ride (async (uuid, updates) => {})
   */
  scheduleStatusChange(ride, newStatus, delayMinutes, apiUpdateFunction) {
    const delay = delayMinutes * 60 * 1000;

    console.log(`⏰ Scheduling status change for ride #${ride.uuid}`);
    console.log(`   New status: ${newStatus}`);
    console.log(`   Delay: ${delayMinutes} minutes`);

    const timeoutId = setTimeout(async () => {
      const taskName = `status_change_${newStatus}`;
      try {
        console.log(`⏰ Changing status for ride #${ride.uuid} to ${newStatus}`);
        await apiUpdateFunction(ride.uuid, { rideStatus: newStatus });
        console.log(`✅ Ride #${ride.uuid} status changed to ${newStatus}`);
      } catch (error) {
        console.error('❌ Error changing ride status:', error);
      } finally {
        // Remove task after execution (success or failure)
        this.removeTask(ride.uuid, taskName);
      }
    }, delay);

    this.addTask(ride.uuid, `status_change_${newStatus}`, timeoutId);
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
    const delay = delayMinutes * 60 * 1000;

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
        this.removeTask(ride.uuid, taskName);
      }
    }, delay);

    this.addTask(ride.uuid, `notification_${template}_${recipient}`, timeoutId);
  }

  /**
   * Schedule all initial notifications when ride is confirmed
   * @param {object} ride - The ride object
   * @param {object} rider - The rider object
   * @param {object} driver - The driver object
   * @param {Function} apiUpdateFunction - Function to update ride
   */
  scheduleRideConfirmationTasks(ride, rider, driver, apiUpdateFunction) {
    console.log(`📅 Scheduling all tasks for confirmed ride #${ride.uuid}`);

    // Schedule 1-hour prior reminder
    this.scheduleOneHourPrior(ride, rider, apiUpdateFunction);

    // Schedule driver arrival check at pickup time
    this.scheduleDriverArrivalCheck(ride, driver);

    console.log(`✅ All tasks scheduled for ride #${ride.uuid}`);
  }

  /**
   * Schedule tasks when rider is picked up
   * @param {object} ride - The ride object
   * @param {object} driver - The driver object
   * @param {Function} apiUpdateFunction - Function to update ride
   */
  schedulePickupTasks(ride, driver, apiUpdateFunction) {
    console.log(`📅 Scheduling pickup tasks for ride #${ride.uuid}`);

    // Schedule status change to RIDE_STARTED after 5 minutes
    this.scheduleStatusChange(ride, RIDE_STATUSES.RIDE_STARTED, 5, apiUpdateFunction);

    // Schedule dropoff check
    this.scheduleDropoffCheck(ride, driver);

    console.log(`✅ Pickup tasks scheduled for ride #${ride.uuid}`);
  }

  /**
   * Schedule tasks when rider is dropped off (for roundtrips)
   * @param {object} ride - The ride object
   * @param {object} driver - The driver object
   */
  scheduleDropoffTasks(ride, driver) {
    if (!ride.roundTrip) {
      console.log(`⏭️  Not a roundtrip, no return tasks to schedule for ride #${ride.uuid}`);
      return;
    }

    console.log(`📅 Scheduling roundtrip return tasks for ride #${ride.uuid}`);

    // Schedule roundtrip return check
    this.scheduleRoundtripReturnCheck(ride, driver);

    console.log(`✅ Roundtrip tasks scheduled for ride #${ride.uuid}`);
  }

  /**
   * Remove a specific completed task from the schedule
   * Called automatically after a task executes
   * @param {string|number} rideUuid - The ride UUID
   * @param {string} taskName - Name of the task to remove
   */
  removeTask(rideUuid, taskName) {
    const key = String(rideUuid);
    const tasks = this.scheduledTasks.get(key);

    if (tasks) {
      const updatedTasks = tasks.filter(task => task.taskName !== taskName);

      if (updatedTasks.length > 0) {
        this.scheduledTasks.set(key, updatedTasks);
      } else {
        // No more tasks for this ride, remove the ride entry
        this.scheduledTasks.delete(key);
      }

      console.log(`   ✓ Removed completed task: ${taskName} for ride #${rideUuid}`);
    }
  }

  /**
   * Cancel all scheduled tasks for a ride
   * @param {string|number} rideUuid - The ride UUID
   */
  cancelRideTasks(rideUuid) {
    const tasks = this.scheduledTasks.get(String(rideUuid));
    if (tasks && tasks.length > 0) {
      console.log(`🗑️  Canceling ${tasks.length} scheduled tasks for ride #${rideUuid}`);
      tasks.forEach(task => {
        clearTimeout(task.timeoutId);
        console.log(`   ✓ Canceled: ${task.taskName}`);
      });
      this.scheduledTasks.delete(String(rideUuid));
    } else {
      console.log(`⏭️  No scheduled tasks to cancel for ride #${rideUuid}`);
    }
  }

  /**
   * Add a task to the scheduled tasks map
   * @param {string|number} rideUuid - The ride UUID
   * @param {string} taskName - Name/description of the task
   * @param {number} timeoutId - The timeout ID from setTimeout
   */
  addTask(rideUuid, taskName, timeoutId) {
    const key = String(rideUuid);
    if (!this.scheduledTasks.has(key)) {
      this.scheduledTasks.set(key, []);
    }

    this.scheduledTasks.get(key).push({ taskName, timeoutId });
    console.log(`   ✓ Added task: ${taskName} for ride #${rideUuid}`);
  }

  /**
   * Get all scheduled tasks for a ride (for debugging)
   * @param {string|number} rideUuid - The ride UUID
   * @returns {array} Array of task objects
   */
  getRideTasks(rideUuid) {
    return this.scheduledTasks.get(String(rideUuid)) || [];
  }

  /**
   * Get total number of scheduled tasks across all rides
   * @returns {number} Total task count
   */
  getTotalTaskCount() {
    let count = 0;
    this.scheduledTasks.forEach(tasks => {
      count += tasks.length;
    });
    return count;
  }

  /**
   * Get scheduler status (for admin/debugging)
   * @returns {object} Scheduler status
   */
  getStatus() {
    return {
      totalRides: this.scheduledTasks.size,
      totalTasks: this.getTotalTaskCount(),
      rides: Array.from(this.scheduledTasks.entries()).map(([rideUuid, tasks]) => ({
        rideUuid,
        taskCount: tasks.length,
        tasks: tasks.map(t => t.taskName)
      }))
    };
  }
}

module.exports = new RideScheduler();
