/**
 * Task Manager
 * Handles task storage, lifecycle management, and status tracking
 *
 * Responsibilities:
 * - Store scheduled tasks in a Map
 * - Add/remove individual tasks
 * - Cancel all tasks for a ride
 * - Provide status and debugging info
 */
class TaskManager {
  constructor() {
    // Map of rideUuid -> array of scheduled tasks
    this.scheduledTasks = new Map();
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
  cancelAllTasks(rideUuid) {
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

export default TaskManager;
