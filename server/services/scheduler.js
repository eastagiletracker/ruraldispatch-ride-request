/**
 * Scheduler - Backwards Compatibility Wrapper
 *
 * This file re-exports the refactored RideScheduler for backwards compatibility.
 * The scheduler has been refactored into multiple focused modules:
 *
 * - scheduler/TaskManager.js - Task lifecycle management
 * - scheduler/TimeCalculator.js - Time calculations
 * - scheduler/NotificationScheduler.js - Individual notification scheduling
 * - scheduler/RideScheduler.js - Main orchestrator (exported here)
 *
 * All existing code will continue to work without changes.
 */

export default require('./scheduler/RideScheduler');
