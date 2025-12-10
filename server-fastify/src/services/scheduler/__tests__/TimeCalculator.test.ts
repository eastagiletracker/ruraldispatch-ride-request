import { describe, it, expect, beforeEach, vi } from 'vitest';
import TimeCalculator from '../TimeCalculator.js';
import type { Ride, RideWithSchedulingFields } from '../../../types/database.types.js';

describe('TimeCalculator', () => {
  beforeEach(() => {
    // Reset time mocks before each test
    vi.useRealTimers();
  });

  describe('calculateOneHourPrior', () => {
    it('should calculate 1 hour before pickup time (future)', () => {
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      const ride = {
        pickupRequestedTime: futureTime,
      } as Ride;

      const result = TimeCalculator.calculateOneHourPrior(ride);

      expect(result.pickupTime).toEqual(futureTime);
      expect(result.targetTime.getTime()).toBe(futureTime.getTime() - 60 * 60 * 1000);
      expect(result.delay).toBeGreaterThan(0);
      expect(result.isPast).toBe(false);
    });

    it('should mark as past when pickup is less than 1 hour away', () => {
      const soonTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      const ride = {
        pickupRequestedTime: soonTime,
      } as Ride;

      const result = TimeCalculator.calculateOneHourPrior(ride);

      expect(result.isPast).toBe(true);
      expect(result.delay).toBeLessThanOrEqual(0);
    });

    it('should handle past pickup times', () => {
      const pastTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const ride = {
        pickupRequestedTime: pastTime,
      } as Ride;

      const result = TimeCalculator.calculateOneHourPrior(ride);

      expect(result.isPast).toBe(true);
      expect(result.delay).toBeLessThan(0);
    });
  });

  describe('calculatePickupTime', () => {
    it('should calculate pickup time in future', () => {
      const futureTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const ride = {
        pickupRequestedTime: futureTime,
      } as Ride;

      const result = TimeCalculator.calculatePickupTime(ride);

      expect(result.targetTime).toEqual(futureTime);
      expect(result.delay).toBeGreaterThan(0);
      expect(result.isPast).toBe(false);
    });

    it('should mark as past when pickup time has passed', () => {
      const pastTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const ride = {
        pickupRequestedTime: pastTime,
      } as Ride;

      const result = TimeCalculator.calculatePickupTime(ride);

      expect(result.isPast).toBe(true);
      expect(result.delay).toBeLessThan(0);
    });
  });

  describe('calculateDropoffTime', () => {
    it('should calculate dropoff time from NOW with provided travel time', () => {
      const now = Date.now();
      const pickupTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now (not used anymore)
      const ride = {
        pickupRequestedTime: pickupTime,
        estimatedTravelTime: 45, // 45 minutes
      } as RideWithSchedulingFields;

      const result = TimeCalculator.calculateDropoffTime(ride);

      // Should calculate from NOW, not from pickupTime
      expect(result.targetTime.getTime()).toBeGreaterThanOrEqual(now + 45 * 60 * 1000 - 1000); // Allow 1s tolerance
      expect(result.targetTime.getTime()).toBeLessThanOrEqual(now + 45 * 60 * 1000 + 1000);
      expect(result.travelTimeMinutes).toBe(45);
      expect(result.delay).toBe(45 * 60 * 1000); // delay is travel time from now
      expect(result.isPast).toBe(false); // Never past since we calculate from now
    });

    it('should use default 30 minutes when travel time not provided', () => {
      const now = Date.now();
      const pickupTime = new Date(Date.now() + 60 * 60 * 1000);
      const ride: Partial<RideWithSchedulingFields> & { pickupRequestedTime: Date } = {
        pickupRequestedTime: pickupTime,
        estimatedTravelTime: undefined,
      };

      const result = TimeCalculator.calculateDropoffTime(ride as RideWithSchedulingFields);

      expect(result.travelTimeMinutes).toBe(30);
      // Should calculate from NOW, not from pickupTime
      expect(result.targetTime.getTime()).toBeGreaterThanOrEqual(now + 30 * 60 * 1000 - 1000);
      expect(result.targetTime.getTime()).toBeLessThanOrEqual(now + 30 * 60 * 1000 + 1000);
    });

    it('should never mark as past since dropoff time is calculated from now', () => {
      // Even with past pickup time, dropoff is calculated from NOW
      const pastPickupTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const ride = {
        pickupRequestedTime: pastPickupTime,
        estimatedTravelTime: 30,
      } as RideWithSchedulingFields;

      const result = TimeCalculator.calculateDropoffTime(ride);

      // isPast should always be false since we calculate from NOW
      expect(result.isPast).toBe(false);
      expect(result.delay).toBe(30 * 60 * 1000); // 30 minutes from now
    });
  });

  describe('calculateRoundtripReturnTime', () => {
    it('should calculate roundtrip return with travel + waiting time', () => {
      const pickupTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const ride = {
        pickupRequestedTime: pickupTime,
        estimatedTravelTime: 30,
        estimatedWaitingTime: 90,
      } as RideWithSchedulingFields;

      const result = TimeCalculator.calculateRoundtripReturnTime(ride);

      expect(result.travelTimeMinutes).toBe(30);
      expect(result.waitingTimeMinutes).toBe(90);
      expect(result.targetTime.getTime()).toBe(pickupTime.getTime() + (30 + 90) * 60 * 1000);
      expect(result.delay).toBeGreaterThan(0);
      expect(result.isPast).toBe(false);
    });

    it('should use default values when times not provided', () => {
      const pickupTime = new Date(Date.now() + 60 * 60 * 1000);
      const ride: Partial<RideWithSchedulingFields> & { pickupRequestedTime: Date } = {
        pickupRequestedTime: pickupTime,
        estimatedTravelTime: undefined,
        estimatedWaitingTime: undefined,
      };

      const result = TimeCalculator.calculateRoundtripReturnTime(ride as RideWithSchedulingFields);

      expect(result.travelTimeMinutes).toBe(30); // Default travel
      expect(result.waitingTimeMinutes).toBe(60); // Default waiting
      expect(result.targetTime.getTime()).toBe(pickupTime.getTime() + (30 + 60) * 60 * 1000);
    });

    it('should mark as past when return time has passed', () => {
      const pastPickupTime = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
      const ride = {
        pickupRequestedTime: pastPickupTime,
        estimatedTravelTime: 30,
        estimatedWaitingTime: 60,
      } as RideWithSchedulingFields;

      const result = TimeCalculator.calculateRoundtripReturnTime(ride);

      expect(result.isPast).toBe(true);
    });
  });

  describe('calculateDelayFromNow', () => {
    it('should calculate delay for 5 minutes from now', () => {
      const beforeCall = Date.now();
      const result = TimeCalculator.calculateDelayFromNow(5);
      const afterCall = Date.now();

      expect(result.delayMinutes).toBe(5);
      expect(result.delay).toBe(5 * 60 * 1000);
      expect(result.targetTime.getTime()).toBeGreaterThanOrEqual(beforeCall + 5 * 60 * 1000);
      expect(result.targetTime.getTime()).toBeLessThanOrEqual(afterCall + 5 * 60 * 1000);
    });

    it('should calculate delay for 60 minutes from now', () => {
      const result = TimeCalculator.calculateDelayFromNow(60);

      expect(result.delayMinutes).toBe(60);
      expect(result.delay).toBe(60 * 60 * 1000);
    });

    it('should handle 0 minutes delay', () => {
      const result = TimeCalculator.calculateDelayFromNow(0);

      expect(result.delayMinutes).toBe(0);
      expect(result.delay).toBe(0);
    });
  });

  describe('formatTimeInfo', () => {
    it('should format time and delay correctly', () => {
      const testTime = new Date('2025-11-25T18:00:00Z');
      const delayMs = 15 * 60 * 1000; // 15 minutes

      const result = TimeCalculator.formatTimeInfo(testTime, delayMs);

      expect(result.timeString).toBe(testTime.toLocaleString());
      expect(result.delayMinutes).toBe(15);
    });

    it('should round delay minutes correctly', () => {
      const testTime = new Date();
      const delayMs = 7.5 * 60 * 1000; // 7.5 minutes

      const result = TimeCalculator.formatTimeInfo(testTime, delayMs);

      expect(result.delayMinutes).toBe(8); // Rounded up
    });

    it('should handle negative delays', () => {
      const testTime = new Date();
      const delayMs = -10 * 60 * 1000; // -10 minutes

      const result = TimeCalculator.formatTimeInfo(testTime, delayMs);

      expect(result.delayMinutes).toBe(-10);
    });

    it('should handle zero delay', () => {
      const testTime = new Date();
      const delayMs = 0;

      const result = TimeCalculator.formatTimeInfo(testTime, delayMs);

      expect(result.delayMinutes).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle pickup time exactly 1 hour from now', () => {
      const exactlyOneHour = new Date(Date.now() + 60 * 60 * 1000);
      const ride = {
        pickupRequestedTime: exactlyOneHour,
      } as Ride;

      const result = TimeCalculator.calculateOneHourPrior(ride);

      // Target time should be approximately now (within 100ms tolerance for test execution time)
      expect(Math.abs(result.delay)).toBeLessThan(100);
    });

    it('should handle very long travel times', () => {
      const now = Date.now();
      const pickupTime = new Date(Date.now() + 60 * 60 * 1000);
      const ride = {
        pickupRequestedTime: pickupTime,
        estimatedTravelTime: 240, // 4 hours
      } as RideWithSchedulingFields;

      const result = TimeCalculator.calculateDropoffTime(ride);

      expect(result.travelTimeMinutes).toBe(240);
      // Should calculate from NOW, not from pickupTime
      expect(result.targetTime.getTime()).toBeGreaterThanOrEqual(now + 240 * 60 * 1000 - 1000);
      expect(result.targetTime.getTime()).toBeLessThanOrEqual(now + 240 * 60 * 1000 + 1000);
    });

    it('should handle very long waiting times in roundtrip', () => {
      const pickupTime = new Date(Date.now() + 60 * 60 * 1000);
      const ride = {
        pickupRequestedTime: pickupTime,
        estimatedTravelTime: 30,
        estimatedWaitingTime: 480, // 8 hours waiting
      } as RideWithSchedulingFields;

      const result = TimeCalculator.calculateRoundtripReturnTime(ride);

      expect(result.waitingTimeMinutes).toBe(480);
      expect(result.targetTime.getTime()).toBe(pickupTime.getTime() + (30 + 480) * 60 * 1000);
    });
  });
});
