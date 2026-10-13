import { describe, it, expect } from 'vitest';
import {
  parseResponse,
  determineContext,
  processSMSResponse,
} from '../smsResponseHandler.js';
import { RIDE_STATUSES } from '../../constants/rideStatuses.js';

describe('SMS Response Handler', () => {
  describe('parseResponse', () => {
    it('should parse numeric response "1"', () => {
      expect(parseResponse('1')).toBe(1);
      expect(parseResponse('1 ')).toBe(1);
      expect(parseResponse(' 1')).toBe(1);
    });

    it('should parse numeric response "2"', () => {
      expect(parseResponse('2')).toBe(2);
      expect(parseResponse('2 yes')).toBe(2);
    });

    it('should parse text response "yes"', () => {
      expect(parseResponse('yes')).toBe(1);
      expect(parseResponse('YES')).toBe(1);
      expect(parseResponse('accept')).toBe(1);
      expect(parseResponse('confirm')).toBe(1);
    });

    it('should parse text response "no"', () => {
      expect(parseResponse('no')).toBe(2);
      expect(parseResponse('NO')).toBe(2);
      expect(parseResponse('decline')).toBe(2);
    });

    it('should parse text response "cancel"', () => {
      expect(parseResponse('cancel')).toBe(3);
      expect(parseResponse('3')).toBe(3);
    });

    it('should return null for invalid responses', () => {
      expect(parseResponse('hello')).toBe(null);
      expect(parseResponse('4')).toBe(null);
      expect(parseResponse('')).toBe(null);
    });

    it('should not match keywords inside other words', () => {
      expect(parseResponse('I know, see you then')).toBe(null);
      expect(parseResponse('Ok, ready now')).toBe(null);
      expect(parseResponse('See you at noon')).toBe(null);
      expect(parseResponse('Can you bring another seat?')).toBe(null);
      expect(parseResponse('My eyes are bad, please call')).toBe(null);
    });

    it('should not treat a longer number as a response code', () => {
      expect(parseResponse('10 minutes away')).toBe(null);
      expect(parseResponse('25 min')).toBe(null);
      expect(parseResponse('300 Main St')).toBe(null);
    });

    it('should still match keywords and codes inside a sentence', () => {
      expect(parseResponse('1.')).toBe(1);
      expect(parseResponse('2 - cancel')).toBe(2);
      expect(parseResponse('3!')).toBe(3);
      expect(parseResponse('Yes, I am here')).toBe(1);
      expect(parseResponse('confirmed')).toBe(1);
      expect(parseResponse('No thanks')).toBe(2);
      expect(parseResponse('nope')).toBe(2);
      expect(parseResponse('Please cancel my ride')).toBe(3);
      expect(parseResponse('cancelled')).toBe(3);
    });
  });

  describe('determineContext', () => {
    it('should identify DRIVER_ARRIVAL_CHECK context', () => {
      const ride = {
        uuid: 'test-ride',
        rideStatus: RIDE_STATUSES.RIDE_CONFIRMED,
      };
      expect(determineContext(ride as any, 'driver')).toBe('DRIVER_ARRIVAL_CHECK');
    });

    it('should identify DRIVER_PICKUP_CHECK context', () => {
      const ride = {
        uuid: 'test-ride',
        rideStatus: RIDE_STATUSES.RIDE_STARTED,
      };
      expect(determineContext(ride as any, 'driver')).toBe('DRIVER_PICKUP_CHECK');
    });

    it('should identify DRIVER_DROPOFF_CHECK context', () => {
      const ride = {
        uuid: 'test-ride',
        rideStatus: RIDE_STATUSES.RIDER_PICKED_UP,
      };
      expect(determineContext(ride as any, 'driver')).toBe('DRIVER_DROPOFF_CHECK');
    });

    it('should return UNKNOWN for unknown context', () => {
      const ride = {
        uuid: 'test-ride',
        rideStatus: RIDE_STATUSES.RIDE_COMPLETE,
      };
      expect(determineContext(ride as any, 'driver')).toBe('UNKNOWN');
    });
  });

  describe('processSMSResponse - DRIVER_ARRIVAL_CHECK', () => {
    const ride = {
      uuid: 'test-ride',
      rideStatus: RIDE_STATUSES.RIDE_CONFIRMED,
      roundTrip: false,
    };

    it('should handle driver arrived (response 1)', () => {
      const result = processSMSResponse(ride as any, 'driver', '1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.notifications).toHaveLength(3);
        expect(result.notifications?.some(n => n.recipient === 'rider')).toBe(true);
        expect(result.notifications?.some(n => n.recipient === 'driver')).toBe(true);
        expect(result.notifications?.some(n => n.recipient === 'case_manager')).toBe(true);
        expect(result.metadata?.driverArrived).toBe(true);
      }
    });

    it('should handle driver en route (response 2)', () => {
      const result = processSMSResponse(ride as any, 'driver', '2');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.notifications).toHaveLength(2);
        expect(result.notifications?.some(n => n.recipient === 'rider')).toBe(true);
        expect(result.notifications?.some(n => n.recipient === 'case_manager')).toBe(true);
        expect(result.scheduleNotification?.recipient).toBe('driver');
        expect(result.scheduleNotification?.delayMinutes).toBe(5);
        expect(result.metadata?.driverEnRoute).toBe(true);
      }
    });
  });

  describe('processSMSResponse - DRIVER_PICKUP_CHECK', () => {
    const ride = {
      uuid: 'test-ride',
      rideStatus: RIDE_STATUSES.RIDE_STARTED,
      roundTrip: false,
    };

    it('should handle rider picked up (response 1)', () => {
      const result = processSMSResponse(ride as any, 'driver', '1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.newRideStatus).toBe(RIDE_STATUSES.RIDER_PICKED_UP);
        // NOTE: No scheduleStatusChange - ride stays at RIDER_PICKED_UP (300)
        // Dropoff check is scheduled separately by RideScheduler.schedulePickupTasks
        expect(result.scheduleStatusChange).toBeUndefined();
        expect(result.metadata?.riderPickedUp).toBe(true);
      }
    });

    it('should handle driver waiting (response 2)', () => {
      const result = processSMSResponse(ride as any, 'driver', '2');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.notifications).toHaveLength(2);
        expect(result.scheduleNotification?.template).toBe('PICKUP_RECHECK');
        expect(result.scheduleNotification?.delayMinutes).toBe(5);
      }
    });
  });

  describe('processSMSResponse - Invalid responses', () => {
    const ride = {
      uuid: 'test-ride',
      rideStatus: RIDE_STATUSES.RIDE_CONFIRMED,
      roundTrip: false,
    };

    it('should reject invalid response codes', () => {
      const result = processSMSResponse(ride as any, 'driver', 'invalid');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid response');
        expect(result.requiresResponse).toBe(true);
      }
    });

    it('should not cancel a confirmed ride on a free-text rider reply', () => {
      const result = processSMSResponse(ride as any, 'rider', 'Ok, ready now');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid response');
      }
    });

    it('should not mark the driver arrived on "10 minutes away"', () => {
      const result = processSMSResponse(ride as any, 'driver', '10 minutes away');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid response');
      }
    });
  });
});
