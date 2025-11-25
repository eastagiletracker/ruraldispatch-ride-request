import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RIDE_STATUSES } from '../../constants/rideStatuses.js';
import { processSMSResponse, parseResponse, determineContext } from '../../services/smsResponseHandler.js';
import type { Ride, ServiceProvider } from '../../types/database.types.js';

/**
 * Integration Tests for Complete SMS Flow
 * Tests end-to-end scenarios from ride assignment through completion
 */

describe('SMS Flow Integration Tests', () => {
  const createMockRide = (overrides: Partial<Ride> = {}): Ride => ({
    uuid: 'ride-123',
    pickupRequestedTime: new Date('2025-11-25T18:00:00Z'),
    pickupAddress: '123 Main St',
    dropOffAddress: '456 Oak Ave',
    rideStatus: RIDE_STATUSES.RIDE_CONFIRMED,
    roundTrip: false,
    ...overrides,
  } as Ride);

  describe('Complete Normal Flow (One-Way Ride)', () => {
    it('should handle complete flow: Confirmed → Arrived → Picked Up → Dropped Off → Complete', () => {
      // Step 1: Ride Confirmed (status 100)
      let ride = createMockRide({ rideStatus: RIDE_STATUSES.RIDE_CONFIRMED });

      // Step 2: Driver arrival check - Driver replies "1" (arrived)
      let result = processSMSResponse(ride, 'driver', '1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.notifications).toHaveLength(3); // rider, driver, case_manager
        expect(result.notifications?.some(n => n.recipient === 'rider')).toBe(true);
        expect(result.notifications?.some(n => n.recipient === 'driver')).toBe(true);
        expect(result.notifications?.some(n => n.recipient === 'case_manager')).toBe(true);
        expect(result.metadata?.driverArrived).toBe(true);
      }

      // Step 3: Ride status transitions to RIDE_STARTED (200)
      ride = createMockRide({ rideStatus: RIDE_STATUSES.RIDE_STARTED });

      // Step 4: Driver pickup check - Driver replies "1" (picked up)
      result = processSMSResponse(ride, 'driver', '1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.newRideStatus).toBe(RIDE_STATUSES.RIDER_PICKED_UP); // 300
        expect(result.scheduleStatusChange?.status).toBe(RIDE_STATUSES.RIDE_STARTED);
        expect(result.scheduleStatusChange?.delayMinutes).toBe(5);
        expect(result.metadata?.riderPickedUp).toBe(true);
      }

      // Step 5: Rider picked up (status 300)
      ride = createMockRide({ rideStatus: RIDE_STATUSES.RIDER_PICKED_UP });

      // Step 6: Driver dropoff check - Driver replies "1" (dropped off)
      result = processSMSResponse(ride, 'driver', '1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.newRideStatus).toBe(RIDE_STATUSES.RIDER_DROPPED_OFF); // 400
        expect(result.notifications).toHaveLength(2); // rider, case_manager
        expect(result.metadata?.riderDroppedOff).toBe(true);
      }
    });
  });

  describe('Driver En Route Flow (Replies "2" at Arrival)', () => {
    it('should handle driver not yet arrived scenario', () => {
      const ride = createMockRide({ rideStatus: RIDE_STATUSES.RIDE_CONFIRMED });

      // Driver replies "2" (not arrived yet, en route)
      const result = processSMSResponse(ride, 'driver', '2');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.notifications).toHaveLength(2); // rider, case_manager
        expect(result.notifications?.some(n => n.template === 'DRIVER_EN_ROUTE')).toBe(true);
        expect(result.scheduleNotification?.recipient).toBe('driver');
        expect(result.scheduleNotification?.template).toBe('DRIVER_ARRIVAL_CHECK');
        expect(result.scheduleNotification?.delayMinutes).toBe(5);
        expect(result.metadata?.driverEnRoute).toBe(true);
      }
    });

    it('should re-check arrival after 5 minutes', () => {
      const ride = createMockRide({ rideStatus: RIDE_STATUSES.RIDE_CONFIRMED });

      // First response: Driver en route
      let result = processSMSResponse(ride, 'driver', '2');
      expect(result.success).toBe(true);

      // After 5 minutes, driver replies "1" (now arrived)
      result = processSMSResponse(ride, 'driver', '1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata?.driverArrived).toBe(true);
        expect(result.notifications).toHaveLength(3);
      }
    });
  });

  describe('Driver Waiting Flow (Replies "2" at Pickup)', () => {
    it('should handle driver waiting for rider scenario', () => {
      const ride = createMockRide({ rideStatus: RIDE_STATUSES.RIDE_STARTED });

      // Driver replies "2" (rider not ready, waiting)
      const result = processSMSResponse(ride, 'driver', '2');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.notifications).toHaveLength(2); // rider, case_manager
        expect(result.notifications?.some(n => n.template === 'DRIVER_WAITING')).toBe(true);
        expect(result.scheduleNotification?.template).toBe('PICKUP_RECHECK');
        expect(result.scheduleNotification?.delayMinutes).toBe(5);
        expect(result.metadata?.driverWaiting).toBe(true);
      }
    });

    it('should re-check pickup after 5 minutes of waiting', () => {
      const ride = createMockRide({ rideStatus: RIDE_STATUSES.RIDE_STARTED });

      // First response: Driver waiting
      let result = processSMSResponse(ride, 'driver', '2');
      expect(result.success).toBe(true);

      // After 5 minutes, driver replies "1" (rider picked up)
      result = processSMSResponse(ride, 'driver', '1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.newRideStatus).toBe(RIDE_STATUSES.RIDER_PICKED_UP);
        expect(result.metadata?.riderPickedUp).toBe(true);
      }
    });
  });

  describe('Roundtrip Flow', () => {
    it('should handle complete roundtrip flow', () => {
      // Step 1: Initial pickup (same as one-way)
      let ride = createMockRide({
        rideStatus: RIDE_STATUSES.RIDE_CONFIRMED,
        roundTrip: true
      });

      // Driver arrives
      let result = processSMSResponse(ride, 'driver', '1');
      expect(result.success).toBe(true);

      // Driver picks up rider
      ride = createMockRide({
        rideStatus: RIDE_STATUSES.RIDE_STARTED,
        roundTrip: true
      });
      result = processSMSResponse(ride, 'driver', '1');
      expect(result.success).toBe(true);

      // Step 2: First dropoff
      ride = createMockRide({
        rideStatus: RIDE_STATUSES.RIDER_PICKED_UP,
        roundTrip: true
      });
      result = processSMSResponse(ride, 'driver', '1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.newRideStatus).toBe(RIDE_STATUSES.RIDER_DROPPED_OFF);
        // After dropoff, should schedule return pickup
        expect(result.metadata?.riderDroppedOff).toBe(true);
      }

      // Step 3: Roundtrip return - status should be ROUNDTRIP_RETURNING (450)
      ride = createMockRide({
        rideStatus: RIDE_STATUSES.ROUNDTRIP_RETURNING,
        roundTrip: true
      });

      // Driver picks up for return (dropoff check context)
      result = processSMSResponse(ride, 'driver', '1');

      expect(result.success).toBe(true);
      if (result.success) {
        // Returns ROUNDTRIP_COMPLETE (475) status
        expect(result.newRideStatus).toBe(RIDE_STATUSES.ROUNDTRIP_COMPLETE);
      }

      // Step 4: Final dropoff
      ride = createMockRide({
        rideStatus: RIDE_STATUSES.RIDER_PICKED_UP,
        roundTrip: true
      });
      result = processSMSResponse(ride, 'driver', '1');

      expect(result.success).toBe(true);
    });

    it('should handle driver response during roundtrip return', () => {
      const ride = createMockRide({
        rideStatus: RIDE_STATUSES.ROUNDTRIP_RETURNING,
        roundTrip: true
      });

      // Driver replies "2" (not yet)
      const result = processSMSResponse(ride, 'driver', '2');

      expect(result.success).toBe(true);
      if (result.success) {
        // Should send notifications
        expect(result.notifications).toBeDefined();
      }
    });
  });

  describe('Cancellation Scenarios', () => {
    it('should handle rider cancellation before pickup', () => {
      const ride = createMockRide({ rideStatus: RIDE_STATUSES.RIDE_CONFIRMED });

      // Rider replies "3" (cancel)
      const result = processSMSResponse(ride, 'rider', '3');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.newRideStatus).toBe(RIDE_STATUSES.RIDE_CANCELED_BY_RIDER);
        expect(result.notifications).toHaveLength(3); // rider, driver, case_manager
      }
    });

    it('should handle driver cancellation after waiting', () => {
      const ride = createMockRide({ rideStatus: RIDE_STATUSES.RIDE_STARTED });

      // Driver waiting, then cancels
      let result = processSMSResponse(ride, 'driver', '2'); // waiting
      expect(result.success).toBe(true);

      // Driver replies "2" again (still not ready, implied cancel)
      result = processSMSResponse(ride, 'driver', '2');
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid Response Handling', () => {
    it('should reject invalid response codes', () => {
      const ride = createMockRide({ rideStatus: RIDE_STATUSES.RIDE_CONFIRMED });

      const result = processSMSResponse(ride, 'driver', 'hello world');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid response');
        expect(result.requiresResponse).toBe(true);
      }
    });

    it('should handle response for completed ride', () => {
      const ride = createMockRide({ rideStatus: RIDE_STATUSES.RIDE_COMPLETE });

      const result = processSMSResponse(ride, 'driver', '1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.requiresResponse).toBe(false);
      }
    });
  });

  describe('Context Determination', () => {
    it('should correctly identify driver arrival check context', () => {
      const ride = createMockRide({ rideStatus: RIDE_STATUSES.RIDE_CONFIRMED });
      const context = determineContext(ride, 'driver');

      expect(context).toBe('DRIVER_ARRIVAL_CHECK');
    });

    it('should correctly identify driver pickup check context', () => {
      const ride = createMockRide({ rideStatus: RIDE_STATUSES.RIDE_STARTED });
      const context = determineContext(ride, 'driver');

      expect(context).toBe('DRIVER_PICKUP_CHECK');
    });

    it('should correctly identify driver dropoff check context', () => {
      const ride = createMockRide({ rideStatus: RIDE_STATUSES.RIDER_PICKED_UP });
      const context = determineContext(ride, 'driver');

      expect(context).toBe('DRIVER_DROPOFF_CHECK');
    });

    it('should correctly identify roundtrip dropoff check context', () => {
      const ride = createMockRide({
        rideStatus: RIDE_STATUSES.ROUNDTRIP_RETURNING,
        roundTrip: true
      });
      const context = determineContext(ride, 'driver');

      expect(context).toBe('DRIVER_ROUNDTRIP_DROPOFF_CHECK');
    });
  });

  describe('Response Parsing', () => {
    it('should parse numeric responses', () => {
      expect(parseResponse('1')).toBe(1);
      expect(parseResponse('2')).toBe(2);
      expect(parseResponse('3')).toBe(3);
    });

    it('should parse text responses', () => {
      expect(parseResponse('yes')).toBe(1);
      expect(parseResponse('YES')).toBe(1);
      expect(parseResponse('accept')).toBe(1);
      expect(parseResponse('no')).toBe(2);
      expect(parseResponse('decline')).toBe(2);
      expect(parseResponse('cancel')).toBe(3);
    });

    it('should handle responses with extra text', () => {
      expect(parseResponse('1 yes')).toBe(1);
      expect(parseResponse('2 not yet')).toBe(2);
      expect(parseResponse('  1  ')).toBe(1);
    });

    it('should return null for invalid responses', () => {
      expect(parseResponse('hello')).toBeNull();
      expect(parseResponse('4')).toBeNull();
      expect(parseResponse('')).toBeNull();
    });
  });

  describe('Multi-Step Scenarios', () => {
    it('should handle driver being late (multiple en route responses)', () => {
      const ride = createMockRide({ rideStatus: RIDE_STATUSES.RIDE_CONFIRMED });

      // First check: Driver en route
      let result = processSMSResponse(ride, 'driver', '2');
      expect(result.success).toBe(true);
      expect(result.metadata?.driverEnRoute).toBe(true);

      // Second check (5 min later): Still en route
      result = processSMSResponse(ride, 'driver', '2');
      expect(result.success).toBe(true);

      // Third check (5 min later): Finally arrived
      result = processSMSResponse(ride, 'driver', '1');
      expect(result.success).toBe(true);
      expect(result.metadata?.driverArrived).toBe(true);
    });

    it('should handle rider not ready for extended period', () => {
      const ride = createMockRide({ rideStatus: RIDE_STATUSES.RIDE_STARTED });

      // First check: Rider not ready
      let result = processSMSResponse(ride, 'driver', '2');
      expect(result.success).toBe(true);
      expect(result.metadata?.driverWaiting).toBe(true);

      // Second check: Still not ready
      result = processSMSResponse(ride, 'driver', '2');
      expect(result.success).toBe(true);

      // Third check: Finally ready
      result = processSMSResponse(ride, 'driver', '1');
      expect(result.success).toBe(true);
      expect(result.newRideStatus).toBe(RIDE_STATUSES.RIDER_PICKED_UP);
    });
  });
});
