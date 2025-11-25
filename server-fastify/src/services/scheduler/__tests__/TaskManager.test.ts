import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TaskManager } from '../TaskManager.js';

describe('TaskManager', () => {
  let taskManager: TaskManager;
  let consoleLogSpy: any;

  beforeEach(() => {
    taskManager = new TaskManager();
    // Suppress console.log during tests
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('addTask', () => {
    it('should add a task for a new ride', () => {
      const rideUuid = 'ride-123';
      const timeoutId = setTimeout(() => {}, 1000);

      taskManager.addTask(rideUuid, 'arrival-check', timeoutId);

      const tasks = taskManager.getRideTasks(rideUuid);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].taskName).toBe('arrival-check');
      expect(tasks[0].timeoutId).toBe(timeoutId);

      clearTimeout(timeoutId);
    });

    it('should add multiple tasks for the same ride', () => {
      const rideUuid = 'ride-123';
      const timeout1 = setTimeout(() => {}, 1000);
      const timeout2 = setTimeout(() => {}, 2000);

      taskManager.addTask(rideUuid, 'arrival-check', timeout1);
      taskManager.addTask(rideUuid, 'pickup-check', timeout2);

      const tasks = taskManager.getRideTasks(rideUuid);
      expect(tasks).toHaveLength(2);
      expect(tasks[0].taskName).toBe('arrival-check');
      expect(tasks[1].taskName).toBe('pickup-check');

      clearTimeout(timeout1);
      clearTimeout(timeout2);
    });

    it('should handle numeric ride IDs', () => {
      const rideUuid = 12345;
      const timeoutId = setTimeout(() => {}, 1000);

      taskManager.addTask(rideUuid, 'dropoff-check', timeoutId);

      const tasks = taskManager.getRideTasks(rideUuid);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].taskName).toBe('dropoff-check');

      clearTimeout(timeoutId);
    });

    it('should add tasks for multiple different rides', () => {
      const timeout1 = setTimeout(() => {}, 1000);
      const timeout2 = setTimeout(() => {}, 1000);

      taskManager.addTask('ride-1', 'arrival-check', timeout1);
      taskManager.addTask('ride-2', 'arrival-check', timeout2);

      expect(taskManager.getRideTasks('ride-1')).toHaveLength(1);
      expect(taskManager.getRideTasks('ride-2')).toHaveLength(1);

      clearTimeout(timeout1);
      clearTimeout(timeout2);
    });
  });

  describe('removeTask', () => {
    it('should remove a specific task from a ride', () => {
      const rideUuid = 'ride-123';
      const timeout1 = setTimeout(() => {}, 1000);
      const timeout2 = setTimeout(() => {}, 2000);

      taskManager.addTask(rideUuid, 'arrival-check', timeout1);
      taskManager.addTask(rideUuid, 'pickup-check', timeout2);

      taskManager.removeTask(rideUuid, 'arrival-check');

      const tasks = taskManager.getRideTasks(rideUuid);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].taskName).toBe('pickup-check');

      clearTimeout(timeout1);
      clearTimeout(timeout2);
    });

    it('should remove ride entry when last task is removed', () => {
      const rideUuid = 'ride-123';
      const timeoutId = setTimeout(() => {}, 1000);

      taskManager.addTask(rideUuid, 'arrival-check', timeoutId);
      taskManager.removeTask(rideUuid, 'arrival-check');

      const tasks = taskManager.getRideTasks(rideUuid);
      expect(tasks).toHaveLength(0);

      const status = taskManager.getStatus();
      expect(status.totalRides).toBe(0);

      clearTimeout(timeoutId);
    });

    it('should handle removing non-existent task gracefully', () => {
      const rideUuid = 'ride-123';
      const timeoutId = setTimeout(() => {}, 1000);

      taskManager.addTask(rideUuid, 'arrival-check', timeoutId);
      taskManager.removeTask(rideUuid, 'non-existent-task');

      const tasks = taskManager.getRideTasks(rideUuid);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].taskName).toBe('arrival-check');

      clearTimeout(timeoutId);
    });

    it('should handle removing task for non-existent ride', () => {
      expect(() => {
        taskManager.removeTask('non-existent-ride', 'some-task');
      }).not.toThrow();
    });
  });

  describe('cancelAllTasks', () => {
    it('should cancel all tasks for a ride', () => {
      const rideUuid = 'ride-123';
      const timeout1 = setTimeout(() => {}, 1000);
      const timeout2 = setTimeout(() => {}, 2000);

      taskManager.addTask(rideUuid, 'arrival-check', timeout1);
      taskManager.addTask(rideUuid, 'pickup-check', timeout2);

      taskManager.cancelAllTasks(rideUuid);

      const tasks = taskManager.getRideTasks(rideUuid);
      expect(tasks).toHaveLength(0);

      const status = taskManager.getStatus();
      expect(status.totalRides).toBe(0);

      clearTimeout(timeout1);
      clearTimeout(timeout2);
    });

    it('should clear timeouts when canceling tasks', () => {
      const rideUuid = 'ride-123';
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const timeout1 = setTimeout(() => {}, 1000);
      const timeout2 = setTimeout(() => {}, 2000);

      taskManager.addTask(rideUuid, 'arrival-check', timeout1);
      taskManager.addTask(rideUuid, 'pickup-check', timeout2);

      taskManager.cancelAllTasks(rideUuid);

      expect(clearTimeoutSpy).toHaveBeenCalledWith(timeout1);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(timeout2);

      clearTimeoutSpy.mockRestore();
    });

    it('should handle canceling for ride with no tasks', () => {
      expect(() => {
        taskManager.cancelAllTasks('non-existent-ride');
      }).not.toThrow();
    });

    it('should not affect other rides when canceling', () => {
      const timeout1 = setTimeout(() => {}, 1000);
      const timeout2 = setTimeout(() => {}, 1000);

      taskManager.addTask('ride-1', 'arrival-check', timeout1);
      taskManager.addTask('ride-2', 'arrival-check', timeout2);

      taskManager.cancelAllTasks('ride-1');

      expect(taskManager.getRideTasks('ride-1')).toHaveLength(0);
      expect(taskManager.getRideTasks('ride-2')).toHaveLength(1);

      clearTimeout(timeout1);
      clearTimeout(timeout2);
    });
  });

  describe('getRideTasks', () => {
    it('should return empty array for ride with no tasks', () => {
      const tasks = taskManager.getRideTasks('non-existent-ride');
      expect(tasks).toEqual([]);
    });

    it('should return all tasks for a ride', () => {
      const rideUuid = 'ride-123';
      const timeout1 = setTimeout(() => {}, 1000);
      const timeout2 = setTimeout(() => {}, 2000);
      const timeout3 = setTimeout(() => {}, 3000);

      taskManager.addTask(rideUuid, 'arrival-check', timeout1);
      taskManager.addTask(rideUuid, 'pickup-check', timeout2);
      taskManager.addTask(rideUuid, 'dropoff-check', timeout3);

      const tasks = taskManager.getRideTasks(rideUuid);
      expect(tasks).toHaveLength(3);
      expect(tasks.map(t => t.taskName)).toEqual([
        'arrival-check',
        'pickup-check',
        'dropoff-check',
      ]);

      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    });
  });

  describe('getTotalTaskCount', () => {
    it('should return 0 when no tasks scheduled', () => {
      expect(taskManager.getTotalTaskCount()).toBe(0);
    });

    it('should count tasks across all rides', () => {
      const timeout1 = setTimeout(() => {}, 1000);
      const timeout2 = setTimeout(() => {}, 1000);
      const timeout3 = setTimeout(() => {}, 1000);
      const timeout4 = setTimeout(() => {}, 1000);

      taskManager.addTask('ride-1', 'arrival-check', timeout1);
      taskManager.addTask('ride-1', 'pickup-check', timeout2);
      taskManager.addTask('ride-2', 'arrival-check', timeout3);
      taskManager.addTask('ride-3', 'dropoff-check', timeout4);

      expect(taskManager.getTotalTaskCount()).toBe(4);

      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
    });

    it('should update count after removing tasks', () => {
      const timeout1 = setTimeout(() => {}, 1000);
      const timeout2 = setTimeout(() => {}, 1000);

      taskManager.addTask('ride-1', 'arrival-check', timeout1);
      taskManager.addTask('ride-1', 'pickup-check', timeout2);

      expect(taskManager.getTotalTaskCount()).toBe(2);

      taskManager.removeTask('ride-1', 'arrival-check');
      expect(taskManager.getTotalTaskCount()).toBe(1);

      clearTimeout(timeout1);
      clearTimeout(timeout2);
    });

    it('should update count after canceling all tasks', () => {
      const timeout1 = setTimeout(() => {}, 1000);
      const timeout2 = setTimeout(() => {}, 1000);
      const timeout3 = setTimeout(() => {}, 1000);

      taskManager.addTask('ride-1', 'arrival-check', timeout1);
      taskManager.addTask('ride-1', 'pickup-check', timeout2);
      taskManager.addTask('ride-2', 'arrival-check', timeout3);

      expect(taskManager.getTotalTaskCount()).toBe(3);

      taskManager.cancelAllTasks('ride-1');
      expect(taskManager.getTotalTaskCount()).toBe(1);

      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    });
  });

  describe('getStatus', () => {
    it('should return empty status when no tasks', () => {
      const status = taskManager.getStatus();

      expect(status.totalRides).toBe(0);
      expect(status.totalTasks).toBe(0);
      expect(status.rides).toEqual([]);
    });

    it('should return status for single ride', () => {
      const rideUuid = 'ride-123';
      const timeout1 = setTimeout(() => {}, 1000);
      const timeout2 = setTimeout(() => {}, 2000);

      taskManager.addTask(rideUuid, 'arrival-check', timeout1);
      taskManager.addTask(rideUuid, 'pickup-check', timeout2);

      const status = taskManager.getStatus();

      expect(status.totalRides).toBe(1);
      expect(status.totalTasks).toBe(2);
      expect(status.rides).toHaveLength(1);
      expect(status.rides[0].rideUuid).toBe(rideUuid);
      expect(status.rides[0].taskCount).toBe(2);
      expect(status.rides[0].tasks).toEqual(['arrival-check', 'pickup-check']);

      clearTimeout(timeout1);
      clearTimeout(timeout2);
    });

    it('should return status for multiple rides', () => {
      const timeout1 = setTimeout(() => {}, 1000);
      const timeout2 = setTimeout(() => {}, 1000);
      const timeout3 = setTimeout(() => {}, 1000);

      taskManager.addTask('ride-1', 'arrival-check', timeout1);
      taskManager.addTask('ride-1', 'pickup-check', timeout2);
      taskManager.addTask('ride-2', 'dropoff-check', timeout3);

      const status = taskManager.getStatus();

      expect(status.totalRides).toBe(2);
      expect(status.totalTasks).toBe(3);
      expect(status.rides).toHaveLength(2);

      const ride1Status = status.rides.find(r => r.rideUuid === 'ride-1');
      expect(ride1Status?.taskCount).toBe(2);
      expect(ride1Status?.tasks).toEqual(['arrival-check', 'pickup-check']);

      const ride2Status = status.rides.find(r => r.rideUuid === 'ride-2');
      expect(ride2Status?.taskCount).toBe(1);
      expect(ride2Status?.tasks).toEqual(['dropoff-check']);

      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete lifecycle: add, remove, cancel', () => {
      const timeout1 = setTimeout(() => {}, 1000);
      const timeout2 = setTimeout(() => {}, 1000);
      const timeout3 = setTimeout(() => {}, 1000);

      // Add tasks
      taskManager.addTask('ride-1', 'arrival-check', timeout1);
      taskManager.addTask('ride-1', 'pickup-check', timeout2);
      taskManager.addTask('ride-2', 'dropoff-check', timeout3);

      expect(taskManager.getTotalTaskCount()).toBe(3);

      // Remove one task
      taskManager.removeTask('ride-1', 'arrival-check');
      expect(taskManager.getTotalTaskCount()).toBe(2);

      // Cancel all for ride-1
      taskManager.cancelAllTasks('ride-1');
      expect(taskManager.getTotalTaskCount()).toBe(1);

      // Verify ride-2 still has tasks
      expect(taskManager.getRideTasks('ride-2')).toHaveLength(1);

      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    });

    it('should handle string and numeric ride IDs interchangeably', () => {
      const timeout1 = setTimeout(() => {}, 1000);
      const timeout2 = setTimeout(() => {}, 1000);

      taskManager.addTask('123', 'arrival-check', timeout1);
      taskManager.addTask(123, 'pickup-check', timeout2);

      const tasks = taskManager.getRideTasks('123');
      expect(tasks).toHaveLength(2);

      const tasksNumeric = taskManager.getRideTasks(123);
      expect(tasksNumeric).toHaveLength(2);

      clearTimeout(timeout1);
      clearTimeout(timeout2);
    });
  });
});
