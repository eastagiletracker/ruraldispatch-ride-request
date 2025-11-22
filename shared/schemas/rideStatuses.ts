/**
 * Ride Status Constants - Shared between Frontend and Backend
 * Tracks the lifecycle of individual rides from request to completion
 */

/**
 * Core Ride Status Values
 */
export const RIDE_STATUSES = {
  // Initial and Confirmation States
  REQUEST_IN_PROGRESS: 0, // Ride Request In Progress
  RIDE_CONFIRMED: 100, // Ride Confirmed

  // Cancellation States
  RIDE_CANCELED_BY_RIDER: 109, // Ride Canceled by Rider

  // Active Ride States
  RIDE_STARTED: 200, // Ride Started
  RIDE_INTERRUPTED: 209, // Ride Interrupted

  // Pickup States
  RIDER_PICKED_UP: 300, // Rider Picked Up
  RIDER_NOT_PICKED_UP: 309, // Rider Not Picked Up

  // Dropoff States
  RIDER_DROPPED_OFF: 400, // Rider Dropped Off
  RIDER_NOT_DROPPED_OFF: 409, // Rider Not Dropped Off

  // Roundtrip States
  ROUNDTRIP_RETURNING: 450, // Roundtrip Returning
  ROUNDTRIP_RETURN_INTERRUPTED: 459, // Roundtrip Return Interrupted
  ROUNDTRIP_COMPLETE: 475, // Roundtrip Complete
  ROUNDTRIP_COMPLETION_INTERRUPTED: 479, // Roundtrip Completion Interrupted

  // Final States
  RIDE_COMPLETE: 500, // Ride Complete
  RIDE_INCOMPLETE: 509, // Ride Incomplete
} as const;

/**
 * Status categories for easier management
 */
export const RIDE_STATUS_CATEGORIES = {
  REQUEST: [RIDE_STATUSES.REQUEST_IN_PROGRESS],
  CONFIRMATION: [RIDE_STATUSES.RIDE_CONFIRMED],
  CANCELLATION: [RIDE_STATUSES.RIDE_CANCELED_BY_RIDER],
  ACTIVE: [RIDE_STATUSES.RIDE_STARTED, RIDE_STATUSES.RIDE_INTERRUPTED],
  PICKUP: [RIDE_STATUSES.RIDER_PICKED_UP, RIDE_STATUSES.RIDER_NOT_PICKED_UP],
  DROPOFF: [RIDE_STATUSES.RIDER_DROPPED_OFF, RIDE_STATUSES.RIDER_NOT_DROPPED_OFF],
  ROUNDTRIP: [
    RIDE_STATUSES.ROUNDTRIP_RETURNING,
    RIDE_STATUSES.ROUNDTRIP_RETURN_INTERRUPTED,
    RIDE_STATUSES.ROUNDTRIP_COMPLETE,
    RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED,
  ],
  COMPLETION: [RIDE_STATUSES.RIDE_COMPLETE, RIDE_STATUSES.RIDE_INCOMPLETE],
} as const;

/**
 * Statuses that indicate the ride should be closed
 */
export const RIDE_CLOSING_STATUSES = [
  RIDE_STATUSES.RIDE_CANCELED_BY_RIDER,
  RIDE_STATUSES.RIDE_INTERRUPTED,
  RIDE_STATUSES.RIDER_NOT_PICKED_UP,
  RIDE_STATUSES.RIDER_NOT_DROPPED_OFF,
  RIDE_STATUSES.ROUNDTRIP_RETURN_INTERRUPTED,
  RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED,
  RIDE_STATUSES.RIDE_COMPLETE,
  RIDE_STATUSES.ROUNDTRIP_COMPLETE,
  RIDE_STATUSES.RIDE_INCOMPLETE,
] as const;

/**
 * Statuses that indicate a problematic condition
 */
export const RIDE_PROBLEMATIC_STATUSES = [
  RIDE_STATUSES.RIDE_CANCELED_BY_RIDER,
  RIDE_STATUSES.RIDE_INTERRUPTED,
  RIDE_STATUSES.RIDER_NOT_PICKED_UP,
  RIDE_STATUSES.RIDER_NOT_DROPPED_OFF,
  RIDE_STATUSES.ROUNDTRIP_RETURN_INTERRUPTED,
  RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED,
  RIDE_STATUSES.RIDE_INCOMPLETE,
] as const;

/**
 * Human-readable status descriptions
 */
export const RIDE_STATUS_DESCRIPTIONS: Record<number, string> = {
  [RIDE_STATUSES.REQUEST_IN_PROGRESS]: 'Ride request in progress',
  [RIDE_STATUSES.RIDE_CONFIRMED]: 'Ride confirmed',
  [RIDE_STATUSES.RIDE_CANCELED_BY_RIDER]: 'Ride Canceled by Rider',
  [RIDE_STATUSES.RIDE_STARTED]: 'Ride started',
  [RIDE_STATUSES.RIDE_INTERRUPTED]: 'Ride Interrupted',
  [RIDE_STATUSES.RIDER_PICKED_UP]: 'Rider Picked Up',
  [RIDE_STATUSES.RIDER_NOT_PICKED_UP]: 'Rider Not Picked Up',
  [RIDE_STATUSES.RIDER_DROPPED_OFF]: 'Rider Dropped Off',
  [RIDE_STATUSES.RIDER_NOT_DROPPED_OFF]: 'Rider Not Dropped Off',
  [RIDE_STATUSES.ROUNDTRIP_RETURNING]: 'Roundtrip Returning',
  [RIDE_STATUSES.ROUNDTRIP_RETURN_INTERRUPTED]: 'Roundtrip Return Interrupted',
  [RIDE_STATUSES.ROUNDTRIP_COMPLETE]: 'Roundtrip Complete',
  [RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED]: 'Roundtrip Completion Interrupted',
  [RIDE_STATUSES.RIDE_COMPLETE]: 'Ride Complete',
  [RIDE_STATUSES.RIDE_INCOMPLETE]: 'Ride Incomplete',
};

/**
 * Valid status transitions for workflow management
 */
export const RIDE_STATUS_TRANSITIONS: Record<number, number[]> = {
  [RIDE_STATUSES.REQUEST_IN_PROGRESS]: [
    RIDE_STATUSES.RIDE_CONFIRMED,
    RIDE_STATUSES.RIDE_CANCELED_BY_RIDER,
  ],
  [RIDE_STATUSES.RIDE_CONFIRMED]: [
    RIDE_STATUSES.RIDE_STARTED,
    RIDE_STATUSES.RIDE_CANCELED_BY_RIDER,
  ],
  [RIDE_STATUSES.RIDE_STARTED]: [RIDE_STATUSES.RIDER_PICKED_UP, RIDE_STATUSES.RIDE_INTERRUPTED],
  [RIDE_STATUSES.RIDER_PICKED_UP]: [
    RIDE_STATUSES.RIDER_DROPPED_OFF,
    RIDE_STATUSES.RIDE_INTERRUPTED,
  ],
  [RIDE_STATUSES.RIDER_DROPPED_OFF]: [
    RIDE_STATUSES.ROUNDTRIP_RETURNING,
    RIDE_STATUSES.RIDE_COMPLETE,
  ],
  [RIDE_STATUSES.ROUNDTRIP_RETURNING]: [
    RIDE_STATUSES.ROUNDTRIP_COMPLETE,
    RIDE_STATUSES.ROUNDTRIP_RETURN_INTERRUPTED,
  ],
  [RIDE_STATUSES.RIDE_INTERRUPTED]: [RIDE_STATUSES.RIDE_INCOMPLETE],
  [RIDE_STATUSES.RIDER_NOT_PICKED_UP]: [RIDE_STATUSES.RIDE_INCOMPLETE],
  [RIDE_STATUSES.RIDER_NOT_DROPPED_OFF]: [RIDE_STATUSES.RIDE_INCOMPLETE],
  [RIDE_STATUSES.ROUNDTRIP_RETURN_INTERRUPTED]: [RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED],
  [RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED]: [RIDE_STATUSES.RIDE_INCOMPLETE],
};

/**
 * Helper functions
 */
export const isRideClosingStatus = (status: number): boolean => {
  return RIDE_CLOSING_STATUSES.includes(status as any);
};

export const isRideProblematicStatus = (status: number): boolean => {
  return RIDE_PROBLEMATIC_STATUSES.includes(status as any);
};

export const isValidRideStatus = (status: number): boolean => {
  return (Object.values(RIDE_STATUSES) as number[]).includes(status);
};

export const getRideStatusDescription = (status: number): string => {
  return RIDE_STATUS_DESCRIPTIONS[status] || 'Unknown Ride Status';
};

export const getNextValidRideStatuses = (
  currentStatus: number,
  isRoundTrip: boolean = false
): number[] => {
  const transitions = RIDE_STATUS_TRANSITIONS[currentStatus] || [];

  // Handle roundtrip-specific logic
  if (currentStatus === RIDE_STATUSES.RIDER_DROPPED_OFF && !isRoundTrip) {
    return [RIDE_STATUSES.RIDE_COMPLETE];
  }

  return transitions;
};

export const isValidRideStatusTransition = (
  fromStatus: number,
  toStatus: number,
  isRoundTrip: boolean = false
): boolean => {
  const validNextStatuses = getNextValidRideStatuses(fromStatus, isRoundTrip);
  return validNextStatuses.includes(toStatus);
};

/**
 * TypeScript types
 */
export type RideStatus = (typeof RIDE_STATUSES)[keyof typeof RIDE_STATUSES];
export type RideStatusCategory = keyof typeof RIDE_STATUS_CATEGORIES;
