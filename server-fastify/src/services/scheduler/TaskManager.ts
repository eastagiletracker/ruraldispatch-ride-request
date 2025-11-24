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

export interface ScheduledTask {
  taskName: string;
  timeoutId: NodeJS.Timeout;
}

interface RideTaskStatus {
  rideUuid: string;
  taskCount: number;
  tasks: string[];
}

interface SchedulerStatus {
  totalRides: number;
  totalTasks: number;
  rides: RideTaskStatus[];
}

export class TaskManager {
  private scheduledTasks: Map<string, ScheduledTask[]>;

  constructor() {
    // Map of rideUuid -> array of scheduled tasks
    this.scheduledTasks = new Map();
  }

  /**
   * Add a task to the scheduled tasks map
   */
  addTask(rideUuid: string | number, taskName: string, timeoutId: NodeJS.Timeout): void {
    const key = String(rideUuid);
    if (!this.scheduledTasks.has(key)) {
      this.scheduledTasks.set(key, []);
    }

    this.scheduledTasks.get(key)!.push({ taskName, timeoutId });
    console.log(`    Added task: ${taskName} for ride #${rideUuid}`);
  }

  /**
   * Remove a specific completed task from the schedule
   * Called automatically after a task executes
   */
  removeTask(rideUuid: string | number, taskName: string): void {
    const key = String(rideUuid);
    const tasks = this.scheduledTasks.get(key);

    if (tasks) {
      const updatedTasks = tasks.filter((task) => task.taskName !== taskName);

      if (updatedTasks.length > 0) {
        this.scheduledTasks.set(key, updatedTasks);
      } else {
        // No more tasks for this ride, remove the ride entry
        this.scheduledTasks.delete(key);
      }

      console.log(`    Removed completed task: ${taskName} for ride #${rideUuid}`);
    }
  }

  /**
   * Cancel all scheduled tasks for a ride
   */
  cancelAllTasks(rideUuid: string | number): void {
    const tasks = this.scheduledTasks.get(String(rideUuid));
    if (tasks && tasks.length > 0) {
      console.log(`=�  Canceling ${tasks.length} scheduled tasks for ride #${rideUuid}`);
      for (const task of tasks) {
        clearTimeout(task.timeoutId);
        console.log(`    Canceled: ${task.taskName}`);
      }
      this.scheduledTasks.delete(String(rideUuid));
    } else {
      console.log(`�  No scheduled tasks to cancel for ride #${rideUuid}`);
    }
  }

  /**
   * Get all scheduled tasks for a ride (for debugging)
   */
  getRideTasks(rideUuid: string | number): ScheduledTask[] {
    return this.scheduledTasks.get(String(rideUuid)) || [];
  }

  /**
   * Get total number of scheduled tasks across all rides
   */
  getTotalTaskCount(): number {
    let count = 0;
    for (const tasks of this.scheduledTasks.values()) {
      count += tasks.length;
    }
    return count;
  }

  /**
   * Get scheduler status (for admin/debugging)
   */
  getStatus(): SchedulerStatus {
    return {
      totalRides: this.scheduledTasks.size,
      totalTasks: this.getTotalTaskCount(),
      rides: Array.from(this.scheduledTasks.entries()).map(([rideUuid, tasks]) => ({
        rideUuid,
        taskCount: tasks.length,
        tasks: tasks.map((t) => t.taskName),
      })),
    };
  }
}

export default TaskManager;
