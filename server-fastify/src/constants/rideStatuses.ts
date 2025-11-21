/**
 * Ride Status Constants
 * ** means the ride request status will change to closed upon achieving this ride status
 * Many of these indicate a bad condition
 */

export const RIDE_STATUSES = {
  // Initial and Confirmation States
  REQUEST_IN_PROGRESS: 0, // Ride Request In Progress
  RIDE_CONFIRMED: 100, // Ride Confirmed

  // Cancellation States
  RIDE_CANCELED_BY_RIDER: 109, // Ride Canceled by Rider

  // Active Ride States
  RIDE_STARTED: 200, // Ride Started
  RIDE_INTERRUPTED: 209, // Ride Interrupted *

  // Pickup States
  RIDER_PICKED_UP: 300, // Rider Picked Up
  RIDER_NOT_PICKED_UP: 309, // Rider Not Picked Up *

  // Dropoff States
  RIDER_DROPPED_OFF: 400, // Rider Dropped Off
  RIDER_NOT_DROPPED_OFF: 409, // Rider Not Dropped Off *

  // Roundtrip States
  ROUNDTRIP_RETURNING: 450, // Roundtrip Returning
  ROUNDTRIP_RETURN_INTERRUPTED: 459, // Roundtrip Return Interrupted *
  ROUNDTRIP_COMPLETE: 475, // Roundtrip Complete
  ROUNDTRIP_COMPLETION_INTERRUPTED: 479, // Roundtrip Completion Interrupted *

  // Final States
  RIDE_COMPLETE: 500, // Ride Complete
  RIDE_INCOMPLETE: 509, // Ride Incomplete
} as const;

export type RideStatus = (typeof RIDE_STATUSES)[keyof typeof RIDE_STATUSES];

// Status categories for easier management
export const STATUS_CATEGORIES = {
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

export type StatusCategory = keyof typeof STATUS_CATEGORIES;

// Statuses that indicate the ride request should be closed
export const CLOSING_STATUSES: readonly RideStatus[] = [
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

// Statuses that indicate a bad condition
export const PROBLEMATIC_STATUSES: readonly RideStatus[] = [
  RIDE_STATUSES.RIDE_CANCELED_BY_RIDER,
  RIDE_STATUSES.RIDE_INTERRUPTED,
  RIDE_STATUSES.RIDER_NOT_PICKED_UP,
  RIDE_STATUSES.RIDER_NOT_DROPPED_OFF,
  RIDE_STATUSES.ROUNDTRIP_RETURN_INTERRUPTED,
  RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED,
  RIDE_STATUSES.RIDE_INCOMPLETE,
] as const;

// Helper functions
export const isClosingStatus = (status: number): status is RideStatus => {
  return CLOSING_STATUSES.includes(status as RideStatus);
};

export const isProblematicStatus = (status: number): status is RideStatus => {
  return PROBLEMATIC_STATUSES.includes(status as RideStatus);
};

export const isValidStatus = (status: number): status is RideStatus => {
  return Object.values(RIDE_STATUSES).includes(status as RideStatus);
};

// Get status description
const STATUS_DESCRIPTIONS: Record<RideStatus, string> = {
  [RIDE_STATUSES.REQUEST_IN_PROGRESS]: 'Ride Request In Progress',
  [RIDE_STATUSES.RIDE_CONFIRMED]: 'Ride Confirmed',
  [RIDE_STATUSES.RIDE_CANCELED_BY_RIDER]: 'Ride Canceled by Rider',
  [RIDE_STATUSES.RIDE_STARTED]: 'Ride Started',
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

export const getStatusDescription = (status: number): string => {
  return STATUS_DESCRIPTIONS[status as RideStatus] || 'Unknown Ride Status';
};

// Status transition map
type TransitionMap = Record<RideStatus, RideStatus[]>;

const getStatusTransitions = (isRoundTrip = false): Partial<TransitionMap> => ({
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
  [RIDE_STATUSES.RIDER_DROPPED_OFF]: isRoundTrip
    ? [RIDE_STATUSES.ROUNDTRIP_RETURNING, RIDE_STATUSES.RIDE_COMPLETE]
    : [RIDE_STATUSES.RIDE_COMPLETE],
  [RIDE_STATUSES.ROUNDTRIP_RETURNING]: [
    RIDE_STATUSES.ROUNDTRIP_COMPLETE,
    RIDE_STATUSES.ROUNDTRIP_RETURN_INTERRUPTED,
  ],
  [RIDE_STATUSES.RIDE_INTERRUPTED]: [RIDE_STATUSES.RIDE_INCOMPLETE],
  [RIDE_STATUSES.RIDER_NOT_PICKED_UP]: [RIDE_STATUSES.RIDE_INCOMPLETE],
  [RIDE_STATUSES.RIDER_NOT_DROPPED_OFF]: [RIDE_STATUSES.RIDE_INCOMPLETE],
  [RIDE_STATUSES.ROUNDTRIP_RETURN_INTERRUPTED]: [RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED],
  [RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED]: [RIDE_STATUSES.RIDE_INCOMPLETE],
});

// Get next valid statuses (for status transitions)
export const getNextValidStatuses = (
  currentStatus: number,
  isRoundTrip = false,
): RideStatus[] => {
  const transitions = getStatusTransitions(isRoundTrip);
  return (transitions[currentStatus as RideStatus] || []) as RideStatus[];
};

// Check if status transition is valid
export const isValidStatusTransition = (
  fromStatus: number,
  toStatus: number,
  isRoundTrip = false,
): boolean => {
  const validNextStatuses = getNextValidStatuses(fromStatus, isRoundTrip);
  return validNextStatuses.includes(toStatus as RideStatus);
};
