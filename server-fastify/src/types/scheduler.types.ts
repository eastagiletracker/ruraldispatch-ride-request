/**
 * Scheduler Types
 * Types for the ride scheduling and notification system
 */

import type { Ride, ServiceProvider, User } from './database.types.js';

// Task types
export type TaskType =
  | 'one_hour_prior'
  | 'driver_arrival_check'
  | 'pickup_reminder'
  | 'dropoff_check'
  | 'roundtrip_return'
  | 'delayed_status_change';

export type TaskStatus = 'pending' | 'executing' | 'completed' | 'cancelled' | 'failed';

// Scheduled task definition
export interface ScheduledTask {
  taskId: string;
  rideUuid: string;
  type: TaskType;
  scheduledTime: Date;
  status: TaskStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  executedAt?: Date;
  cancelledAt?: Date;
  error?: string;
}

// Task execution context
export interface TaskExecutionContext {
  task: ScheduledTask;
  ride: Ride;
  rider?: User | null;
  driver?: ServiceProvider | null;
}

// API update function type
export type RideUpdateFunction = (rideUuid: string, updates: Partial<Ride>) => Promise<Ride | null>;

// Task scheduling options
export interface TaskSchedulingOptions {
  taskType: TaskType;
  rideUuid: string;
  scheduledTime: Date;
  metadata?: Record<string, unknown>;
}

// Scheduler configuration
export interface SchedulerConfig {
  enableAutoCleanup: boolean;
  cleanupIntervalMs: number;
  maxTaskRetries: number;
  taskTimeoutMs: number;
}

// Time calculation results
export interface RideTimeCalculations {
  oneHourPrior: Date;
  pickupTime: Date;
  dropoffTime: Date;
  roundtripReturnTime?: Date;
  estimatedDuration: number; // in minutes
}

// Notification scheduling
export interface ScheduledNotification {
  recipient: string;
  template: string;
  data: Record<string, unknown>;
  sendAt: Date;
}

// Status change scheduling
export interface ScheduledStatusChange {
  rideUuid: string;
  newStatus: number;
  changeAt: Date;
  reason?: string;
}

// Task lifecycle callbacks
export interface TaskLifecycleCallbacks {
  onTaskScheduled?: (task: ScheduledTask) => void | Promise<void>;
  onTaskExecuted?: (task: ScheduledTask, result: unknown) => void | Promise<void>;
  onTaskFailed?: (task: ScheduledTask, error: Error) => void | Promise<void>;
  onTaskCancelled?: (task: ScheduledTask) => void | Promise<void>;
}

// Scheduler statistics
export interface SchedulerStats {
  totalTasks: number;
  pendingTasks: number;
  executingTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  failedTasks: number;
  tasksByType: Record<TaskType, number>;
  tasksByRide: Record<string, number>;
  oldestTask?: Date;
  newestTask?: Date;
}

// Task manager interface
export interface TaskManagerInterface {
  addTask(task: ScheduledTask): void;
  getTask(taskId: string): ScheduledTask | undefined;
  getTasksByRide(rideUuid: string): ScheduledTask[];
  getTasksByType(type: TaskType): ScheduledTask[];
  updateTaskStatus(taskId: string, status: TaskStatus, error?: string): void;
  removeTask(taskId: string): boolean;
  cancelTask(taskId: string): boolean;
  cancelAllTasksForRide(rideUuid: string): number;
  getAllTasks(): ScheduledTask[];
  getStats(): SchedulerStats;
  cleanup(): number;
}

// Time calculator interface
export interface TimeCalculatorInterface {
  calculateOneHourPrior(pickupTime: Date): Date;
  calculatePickupTime(ride: Ride): Date;
  calculateDropoffTime(ride: Ride): Date;
  calculateRoundtripReturnTime(ride: Ride): Date | null;
  calculateEstimatedDuration(pickupTime: Date, dropoffTime: Date): number;
  calculateAllTimes(ride: Ride): RideTimeCalculations;
}
