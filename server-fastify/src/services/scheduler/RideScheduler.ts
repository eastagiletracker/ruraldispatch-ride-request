import { RIDE_STATUSES } from '../../constants/rideStatuses.js';
import type { Ride, ServiceProvider, User } from '../../types/database.types.js';
import NotificationScheduler from './NotificationScheduler.js';
import type { ScheduledTask } from './TaskManager.js';
import { TaskManager } from './TaskManager.js';

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

type ApiUpdateFunction = (uuid: string, updates: Record<string, unknown>) => Promise<unknown>;

type RecipientRole = 'driver' | 'rider' | 'case_manager';

interface TemplateData {
  ride?: Ride;
  rider?: User | null;
  driver?: ServiceProvider | null;
  [key: string]: unknown;
}

class RideScheduler {
  private taskManager: TaskManager;
  private notificationScheduler: NotificationScheduler;

  constructor() {
    this.taskManager = new TaskManager();
    this.notificationScheduler = new NotificationScheduler(this.taskManager);
  }

  // ========================================
  // High-Level Orchestration Methods
  // ========================================

  /**
   * Schedule all initial notifications when ride is confirmed
   */
  scheduleRideConfirmationTasks(ride: Ride, driver: ServiceProvider): void {
    console.log(`=📅 Scheduling all tasks for confirmed ride #${ride.uuid}`);

    // Schedule driver arrival check at pickup time (driver should arrive at estimated time)
    this.notificationScheduler.scheduleDriverArrivalCheck(ride, driver);

    console.log(`✅ All tasks scheduled for ride #${ride.uuid}`);
  }

  /**
   * Schedule tasks when rider is picked up
   */
  schedulePickupTasks(
    ride: Ride,
    driver: ServiceProvider,
    apiUpdateFunction: ApiUpdateFunction
  ): void {
    console.log(`=� Scheduling pickup tasks for ride #${ride.uuid}`);

    // Schedule status change to RIDE_STARTED after 5 minutes
    this.notificationScheduler.scheduleStatusChange(
      ride,
      RIDE_STATUSES.RIDE_STARTED,
      5,
      apiUpdateFunction
    );

    // Schedule dropoff check
    this.notificationScheduler.scheduleDropoffCheck(ride, driver);

    console.log(` Pickup tasks scheduled for ride #${ride.uuid}`);
  }

  /**
   * Schedule tasks when rider is dropped off (for roundtrips)
   */
  scheduleDropoffTasks(ride: Ride, driver: ServiceProvider): void {
    if (!ride.roundTrip) {
      console.log(`�  Not a roundtrip, no return tasks to schedule for ride #${ride.uuid}`);
      return;
    }

    console.log(`=� Scheduling roundtrip return tasks for ride #${ride.uuid}`);

    // Schedule roundtrip return check
    this.notificationScheduler.scheduleRoundtripReturnCheck(ride, driver);

    console.log(` Roundtrip tasks scheduled for ride #${ride.uuid}`);
  }

  /**
   * Alias for scheduleRideConfirmationTasks (for backwards compatibility)
   */
  scheduleAllTasks(ride: Ride, driver: ServiceProvider): void {
    return this.scheduleRideConfirmationTasks(ride, driver);
  }

  // ========================================
  // Individual Scheduling Methods (Delegated)
  // ========================================

  /**
   * Schedule driver arrival check at pickup time
   */
  scheduleDriverArrivalCheck(ride: Ride, driver: ServiceProvider): void {
    return this.notificationScheduler.scheduleDriverArrivalCheck(ride, driver);
  }

  /**
   * Schedule dropoff check at estimated dropoff time
   */
  scheduleDropoffCheck(ride: Ride, driver: ServiceProvider): void {
    return this.notificationScheduler.scheduleDropoffCheck(ride, driver);
  }

  /**
   * Schedule roundtrip return check
   */
  scheduleRoundtripReturnCheck(ride: Ride, driver: ServiceProvider): void {
    return this.notificationScheduler.scheduleRoundtripReturnCheck(ride, driver);
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
    return this.notificationScheduler.scheduleStatusChange(
      ride,
      newStatus,
      delayMinutes,
      apiUpdateFunction
    );
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
   */
  cancelAllTasks(rideUuid: string | number): void {
    return this.taskManager.cancelAllTasks(rideUuid);
  }

  /**
   * Alias for cancelAllTasks (for backwards compatibility)
   */
  cancelRideTasks(rideUuid: string | number): void {
    return this.taskManager.cancelAllTasks(rideUuid);
  }

  /**
   * Get all scheduled tasks for a ride (for debugging)
   */
  getRideTasks(rideUuid: string | number): ScheduledTask[] {
    return this.taskManager.getRideTasks(rideUuid);
  }

  /**
   * Get total number of scheduled tasks across all rides
   */
  getTotalTaskCount(): number {
    return this.taskManager.getTotalTaskCount();
  }

  /**
   * Get scheduler status (for admin/debugging)
   */
  getStatus() {
    return this.taskManager.getStatus();
  }
}

// Export singleton instance (maintains backwards compatibility)
export default new RideScheduler();
