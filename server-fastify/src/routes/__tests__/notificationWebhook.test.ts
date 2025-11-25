import { describe, it, expect } from 'vitest';
import { RIDE_STATUSES } from '../../constants/rideStatuses.js';

describe('Webhook Active Ride Filtering Logic', () => {
  describe('Finding active rides by phone number', () => {
    it('should match driver phone number correctly', () => {
      const ride = {
        uuid: 'test-ride-123',
        rideStatus: RIDE_STATUSES.RIDE_CONFIRMED as number,
        rider: {
          fullName: 'Test Rider',
          phone: '+15551234567',
        },
        driver: {
          fullName: 'Test Driver',
          mobilePhone: '+15559876543',
          phone: '+15559876543',
        },
      };

      const senderPhone = '+15559876543';
      const isActive =
        ride.rideStatus !== RIDE_STATUSES.RIDE_COMPLETE &&
        ride.rideStatus !== RIDE_STATUSES.ROUNDTRIP_COMPLETE;

      const isDriver =
        ride.driver &&
        (ride.driver.mobilePhone === senderPhone || ride.driver.phone === senderPhone);

      expect(isActive).toBe(true);
      expect(isDriver).toBe(true);
    });

    it('should match rider phone number correctly', () => {
      const ride = {
        uuid: 'test-ride-123',
        rideStatus: RIDE_STATUSES.RIDE_CONFIRMED,
        rider: {
          fullName: 'Test Rider',
          phone: '+15551234567',
        },
        driver: {
          fullName: 'Test Driver',
          mobilePhone: '+15559876543',
        },
      };

      const senderPhone = '+15551234567';
      const isRider = ride.rider && ride.rider.phone === senderPhone;

      expect(isRider).toBe(true);
    });

    it('should not match wrong phone number', () => {
      const ride = {
        uuid: 'test-ride-123',
        rideStatus: RIDE_STATUSES.RIDE_CONFIRMED,
        rider: {
          phone: '+15551234567',
        },
        driver: {
          mobilePhone: '+15559876543',
          phone: '+15559876543',
        },
      };

      const senderPhone = '+15550000000';
      const isRider = ride.rider && ride.rider.phone === senderPhone;
      const isDriver =
        ride.driver &&
        (ride.driver.mobilePhone === senderPhone || ride.driver.phone === senderPhone);

      expect(isRider).toBe(false);
      expect(isDriver).toBe(false);
    });

    it('should not match completed rides', () => {
      const ride = {
        uuid: 'test-ride-123',
        rideStatus: RIDE_STATUSES.RIDE_COMPLETE,
        driver: {
          mobilePhone: '+15559876543',
        },
      };

      const isActive =
        ride.rideStatus !== RIDE_STATUSES.RIDE_COMPLETE &&
        ride.rideStatus !== RIDE_STATUSES.ROUNDTRIP_COMPLETE;

      expect(isActive).toBe(false);
    });
  });

  describe('Sender role determination', () => {
    it('should identify driver correctly', () => {
      const ride = {
        rider: { phone: '+15551234567' },
        driver: { mobilePhone: '+15559876543', phone: '+15559876543' },
      };

      const phoneNumber = '+15559876543';
      const isDriver =
        ride.driver &&
        (ride.driver.mobilePhone === phoneNumber || ride.driver.phone === phoneNumber);

      expect(isDriver).toBe(true);
    });

    it('should identify rider correctly', () => {
      const ride = {
        rider: { phone: '+15551234567' },
        driver: { mobilePhone: '+15559876543' },
        riderPhone: '+15551234567',
      };

      const phoneNumber = '+15551234567';
      const isRider =
        (ride.rider && ride.rider.phone === phoneNumber) ||
        ride.riderPhone === phoneNumber;

      expect(isRider).toBe(true);
    });
  });
});
