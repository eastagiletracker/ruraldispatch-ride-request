import TaskManager from './TaskManager.js';
import NotificationScheduler from './NotificationScheduler.js';
import { RIDE_STATUSES } from '../../constants/rideStatuses.js';

/**
 * Ride Scheduler Service
 * Main orchestrator for ride scheduling operations
 *
 * Responsibilities:
 * - High-level orchestration of scheduling tasks
 * - Coordinate between TaskManager and NotificationScheduler
 * - Provide public API for scheduling ride-related tasks
 * - Maintain backwards compatibility with existing code
 *
 * Features:
 * - 1 hour prior reminders
 * - Pickup time arrival checks
 * - Dropoff time checks
 * - Roundtrip return checks
 * - Delayed status changes (5 min after pickup -> RIDE_STARTED)
 * - Auto-cleanup after task execution
 */
class RideScheduler {
  constructor() {
    this.taskManager = new TaskManager();
    this.notificationScheduler = new NotificationScheduler(this.taskManager);
  }

  // ========================================
  // High-Level Orchestration Methods
  // ========================================

  /**
   * Schedule all initial notifications when ride is confirmed
   * @param {object} ride - The ride object
   * @param {object} rider - The rider object
   * @param {object} driver - The driver object
   * @param {Function} apiUpdateFunction - Function to update ride
   */
  scheduleRideConfirmationTasks(ride, rider, driver, apiUpdateFunction) {
    console.log(`📅 Scheduling all tasks for confirmed ride #${ride.uuid}`);

    // NOTE: One-hour prior reminder removed - rider gets confirmation when driver is assigned
    // and can cancel at any time by replying '3'

    // Schedule driver arrival check at pickup time
    this.notificationScheduler.scheduleDriverArrivalCheck(ride, driver);

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
    this.notificationScheduler.scheduleStatusChange(
      ride,
      RIDE_STATUSES.RIDE_STARTED,
      5,
      apiUpdateFunction
    );

    // Schedule dropoff check
    this.notificationScheduler.scheduleDropoffCheck(ride, driver);

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
    this.notificationScheduler.scheduleRoundtripReturnCheck(ride, driver);

    console.log(`✅ Roundtrip tasks scheduled for ride #${ride.uuid}`);
  }

  /**
   * Alias for scheduleRideConfirmationTasks (for backwards compatibility)
   * @param {object} ride - The ride object
   * @param {object} rider - The rider object
   * @param {object} driver - The driver object
   * @param {Function} apiUpdateFunction - Function to update ride
   */
  scheduleAllTasks(ride, rider, driver, apiUpdateFunction) {
    return this.scheduleRideConfirmationTasks(ride, rider, driver, apiUpdateFunction);
  }

  // ========================================
  // Individual Scheduling Methods (Delegated)
  // ========================================

  /**
   * Schedule 1 hour prior reminder to rider
   * @param {object} ride - The ride object
   * @param {object} rider - The rider object
   * @param {Function} apiUpdateFunction - Function to update ride in DB
   */
  scheduleOneHourPrior(ride, rider, apiUpdateFunction) {
    return this.notificationScheduler.scheduleOneHourPrior(ride, rider, apiUpdateFunction);
  }

  /**
   * Schedule driver arrival check at pickup time
   * @param {object} ride - The ride object
   * @param {object} driver - The driver object
   */
  scheduleDriverArrivalCheck(ride, driver) {
    return this.notificationScheduler.scheduleDriverArrivalCheck(ride, driver);
  }

  /**
   * Schedule dropoff check at estimated dropoff time
   * @param {object} ride - The ride object
   * @param {object} driver - The driver object
   */
  scheduleDropoffCheck(ride, driver) {
    return this.notificationScheduler.scheduleDropoffCheck(ride, driver);
  }

  /**
   * Schedule roundtrip return check
   * @param {object} ride - The ride object
   * @param {object} driver - The driver object
   */
  scheduleRoundtripReturnCheck(ride, driver) {
    return this.notificationScheduler.scheduleRoundtripReturnCheck(ride, driver);
  }

  /**
   * Schedule status change after delay
   * @param {object} ride - The ride object
   * @param {number} newStatus - New ride status code
   * @param {number} delayMinutes - Delay in minutes
   * @param {Function} apiUpdateFunction - Function to update ride
   */
  scheduleStatusChange(ride, newStatus, delayMinutes, apiUpdateFunction) {
    return this.notificationScheduler.scheduleStatusChange(
      ride,
      newStatus,
      delayMinutes,
      apiUpdateFunction
    );
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
    return this.notificationScheduler.scheduleNotification(
      ride,
      recipient,
      template,
      delayMinutes,
      data
    );
  }

  // ========================================
  // Task Management Methods (Delegated)
  // ========================================

  /**
   * Cancel all scheduled tasks for a ride
   * @param {string|number} rideUuid - The ride UUID
   */
  cancelAllTasks(rideUuid) {
    return this.taskManager.cancelAllTasks(rideUuid);
  }

  /**
   * Alias for cancelAllTasks (for backwards compatibility)
   * @param {string|number} rideUuid - The ride UUID
   */
  cancelRideTasks(rideUuid) {
    return this.taskManager.cancelAllTasks(rideUuid);
  }

  /**
   * Get all scheduled tasks for a ride (for debugging)
   * @param {string|number} rideUuid - The ride UUID
   * @returns {array} Array of task objects
   */
  getRideTasks(rideUuid) {
    return this.taskManager.getRideTasks(rideUuid);
  }

  /**
   * Get total number of scheduled tasks across all rides
   * @returns {number} Total task count
   */
  getTotalTaskCount() {
    return this.taskManager.getTotalTaskCount();
  }

  /**
   * Get scheduler status (for admin/debugging)
   * @returns {object} Scheduler status
   */
  getStatus() {
    return this.taskManager.getStatus();
  }
}

// Export singleton instance (maintains backwards compatibility)
export default new RideScheduler();
