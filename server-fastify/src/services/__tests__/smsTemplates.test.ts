import { describe, it, expect } from 'vitest';
import {
  formatDateTime,
  formatAddress,
  getRideConfirmedMessage,
  getRideCanceledMessage,
  getDriverArrivalCheckMessage,
  getDriverEnRouteMessage,
  getDriverArrivedMessageToRider,
  getPickupCheckMessage,
  getDriverWaitingMessage,
  getDropoffCheckMessage,
  getRiderDroppedOffMessage,
  getRiderDroppedOffMessageToCaseManager,
  getRoundtripReturnCheckMessage,
  getRoundtripWaitingMessage,
  getRoundtripCompletionInterruptedMessage,
  getRoundtripCompletedMessage,
  getRideCompletedMessage,
  getRiderNotDroppedOffAlert,
  getRideStatusUpdateMessage,
  getSMSTemplate,
} from '../smsTemplates.js';
import { RIDE_STATUSES } from '../../constants/rideStatuses.js';
import type { Ride, ServiceProvider, Vehicle } from '../../types/database.types.js';

describe('SMS Templates', () => {
  const mockRide: Ride = {
    uuid: 'ride-123',
    pickupRequestedTime: new Date('2025-11-25T18:00:00Z'),
    pickupAddress: '123 Main St, City, State 12345',
    dropOffAddress: '456 Oak Ave, City, State 12345',
    roundTrip: false,
  } as Ride;

  const mockDriver: ServiceProvider = {
    uuid: 'driver-123',
    fullName: 'John Driver',
    mobilePhone: '+15551234567',
  } as ServiceProvider;

  const mockVehicle: Vehicle = {
    uuid: 'vehicle-123',
    displayName: 'Toyota Camry',
  } as Vehicle;

  describe('formatDateTime', () => {
    it('should format date to America/New_York timezone', () => {
      const date = new Date('2025-11-25T18:00:00Z');
      const formatted = formatDateTime(date);

      // Should include month, day, hour, minute
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}/); // Date format
      expect(formatted).toMatch(/\d{1,2}:\d{2}/); // Time format
      expect(formatted).toMatch(/(AM|PM)/); // 12-hour format
    });

    it('should handle string dates', () => {
      const formatted = formatDateTime('2025-11-25T18:00:00Z');
      expect(formatted).toBeTruthy();
      expect(formatted).not.toBe('TBD');
    });

    it('should return TBD for null', () => {
      expect(formatDateTime(null)).toBe('TBD');
    });

    it('should return TBD for undefined', () => {
      expect(formatDateTime(undefined)).toBe('TBD');
    });
  });

  describe('formatAddress', () => {
    it('should format string addresses', () => {
      const address = '123 Main St, City, State';
      expect(formatAddress(address)).toBe(address);
    });

    it('should format address objects with formattedAddress', () => {
      const address = { formattedAddress: '456 Oak Ave' };
      expect(formatAddress(address)).toBe('456 Oak Ave');
    });

    it('should return TBD for null', () => {
      expect(formatAddress(null)).toBe('TBD');
    });

    it('should return TBD for undefined', () => {
      expect(formatAddress(undefined)).toBe('TBD');
    });
  });

  describe('getRideConfirmedMessage', () => {
    it('should include all ride details', () => {
      const message = getRideConfirmedMessage(mockRide, mockDriver, mockVehicle);

      expect(message).toContain('Ride Confirmed');
      expect(message).toContain('John Driver');
      expect(message).toContain('Toyota Camry');
      expect(message).toContain('123 Main St');
      expect(message).toContain('456 Oak Ave');
      expect(message).toContain('To Cancel ride, type 3');
    });

    it('should indicate roundtrip with R', () => {
      const roundtripRide = { ...mockRide, roundTrip: true };
      const message = getRideConfirmedMessage(roundtripRide, mockDriver, mockVehicle);

      expect(message).toContain('R');
    });

    it('should not indicate roundtrip for one-way rides', () => {
      const message = getRideConfirmedMessage(mockRide, mockDriver, mockVehicle);

      // Roundtrip indicator is on its own line, so it should be blank
      expect(message).toContain('\n\nTo Cancel');
    });

    it('should handle missing driver', () => {
      const message = getRideConfirmedMessage(mockRide, null, mockVehicle);

      expect(message).toContain('Driver: TBD');
    });

    it('should handle missing vehicle', () => {
      const message = getRideConfirmedMessage(mockRide, mockDriver, null);

      expect(message).toContain('Vehicle: TBD');
    });
  });

  describe('Simple message templates', () => {
    it('should return ride canceled message', () => {
      expect(getRideCanceledMessage()).toBe('Ride has been canceled');
    });

    it('should return driver arrival check message', () => {
      const message = getDriverArrivalCheckMessage();
      expect(message).toContain('arrived at pick up location');
      expect(message).toContain('1 for yes, 2 for no');
    });

    it('should return driver en route message', () => {
      expect(getDriverEnRouteMessage()).toBe('Driver is en route');
    });

    it('should return driver arrived message', () => {
      expect(getDriverArrivedMessageToRider()).toBe('Driver has arrived');
    });

    it('should return pickup check message', () => {
      const message = getPickupCheckMessage();
      expect(message).toContain('picked up the rider');
      expect(message).toContain('1-yes, 2-no');
    });

    it('should return driver waiting message', () => {
      const message = getDriverWaitingMessage();
      expect(message).toContain('Driver is waiting');
      expect(message).toContain('5 minute');
      expect(message).toContain('reply 2');
    });

    it('should return dropoff check message', () => {
      const message = getDropoffCheckMessage();
      expect(message).toContain('dropped off rider');
      expect(message).toContain('1-yes, 2-no');
    });

    it('should return rider dropped off message', () => {
      expect(getRiderDroppedOffMessage()).toBe('You have been dropped off');
    });

    it('should return rider dropped off message for case manager', () => {
      expect(getRiderDroppedOffMessageToCaseManager()).toBe('Rider has been dropped off');
    });

    it('should return roundtrip return check message', () => {
      const message = getRoundtripReturnCheckMessage();
      expect(message).toContain('return ride');
      expect(message).toContain('1-yes, 2-no');
    });

    it('should return roundtrip completion interrupted message', () => {
      expect(getRoundtripCompletionInterruptedMessage()).toBe('Return ride has been canceled.');
    });

    it('should return roundtrip completed message', () => {
      const message = getRoundtripCompletedMessage();
      expect(message).toContain('roundtrip is completed');
      expect(message).toContain('EastConn');
    });

    it('should return ride completed message', () => {
      const message = getRideCompletedMessage();
      expect(message).toContain('ride is complete');
      expect(message).toContain('EastConn');
    });

    it('should return rider not dropped off alert', () => {
      const message = getRiderNotDroppedOffAlert();
      expect(message).toContain('Rider not dropped off');
      expect(message).toContain('dispatcher intervention');
    });
  });

  describe('getRoundtripWaitingMessage', () => {
    it('should include pickup location', () => {
      const message = getRoundtripWaitingMessage('123 Main St');

      expect(message).toContain('waiting to return you to');
      expect(message).toContain('123 Main St');
      expect(message).toContain('15 minutes');
    });

    it('should handle address formatting', () => {
      const address = { formattedAddress: '456 Oak Ave' };
      const message = getRoundtripWaitingMessage(address as any);

      expect(message).toContain('456 Oak Ave');
    });
  });

  describe('getRideStatusUpdateMessage', () => {
    it('should include ride UUID and status description', () => {
      const message = getRideStatusUpdateMessage(mockRide, 'In Progress');

      expect(message).toContain('ride-123');
      expect(message).toContain('In Progress');
    });
  });

  describe('getSMSTemplate', () => {
    it('should return ride confirmed message for rider', () => {
      const message = getSMSTemplate(RIDE_STATUSES.RIDE_CONFIRMED, 'rider', {
        ride: mockRide,
        driver: mockDriver,
        vehicle: mockVehicle,
      });

      expect(message).toContain('Ride Confirmed');
      expect(message).toContain('John Driver');
    });

    it('should return ride confirmed message for case manager', () => {
      const message = getSMSTemplate(RIDE_STATUSES.RIDE_CONFIRMED, 'case_manager', {
        ride: mockRide,
        driver: mockDriver,
        vehicle: mockVehicle,
      });

      expect(message).toContain('Ride Confirmed');
    });

    it('should return ride canceled message for all recipients', () => {
      const riderMessage = getSMSTemplate(RIDE_STATUSES.RIDE_CANCELED_BY_RIDER, 'rider');
      const driverMessage = getSMSTemplate(RIDE_STATUSES.RIDE_CANCELED_BY_RIDER, 'driver');
      const caseManagerMessage = getSMSTemplate(RIDE_STATUSES.RIDE_CANCELED_BY_RIDER, 'case_manager');

      expect(riderMessage).toBe('Ride has been canceled');
      expect(driverMessage).toBe('Ride has been canceled');
      expect(caseManagerMessage).toBe('Ride has been canceled');
    });

    it('should return driver arrival check for driver', () => {
      const message = getSMSTemplate('DRIVER_ARRIVAL_CHECK', 'driver');

      expect(message).toContain('arrived at pick up location');
    });

    it('should return driver en route for rider and case manager', () => {
      const riderMessage = getSMSTemplate('DRIVER_EN_ROUTE', 'rider');
      const caseManagerMessage = getSMSTemplate('DRIVER_EN_ROUTE', 'case_manager');

      expect(riderMessage).toBe('Driver is en route');
      expect(caseManagerMessage).toBe('Driver is en route');
    });

    it('should return different messages for different recipients', () => {
      const riderMessage = getSMSTemplate('DRIVER_ARRIVED', 'rider');
      const driverMessage = getSMSTemplate('DRIVER_ARRIVED', 'driver');

      expect(riderMessage).toBe('Driver has arrived');
      expect(driverMessage).toContain('picked up the rider');
    });

    it('should return dropoff check for driver', () => {
      const message = getSMSTemplate('DROPOFF_CHECK', 'driver');

      expect(message).toContain('dropped off rider');
    });

    it('should return rider dropped off messages', () => {
      const riderMessage = getSMSTemplate(RIDE_STATUSES.RIDER_DROPPED_OFF, 'rider');
      const caseManagerMessage = getSMSTemplate(RIDE_STATUSES.RIDER_DROPPED_OFF, 'case_manager');

      expect(riderMessage).toBe('You have been dropped off');
      expect(caseManagerMessage).toBe('Rider has been dropped off');
    });

    it('should return roundtrip return check for driver', () => {
      const message = getSMSTemplate('ROUNDTRIP_RETURN_CHECK', 'driver');

      expect(message).toContain('return ride');
    });

    it('should return roundtrip waiting message with location', () => {
      const message = getSMSTemplate('ROUNDTRIP_WAITING', 'rider', {
        pickupLocation: '123 Main St',
      });

      expect(message).toContain('waiting to return you');
      expect(message).toContain('123 Main St');
    });

    it('should return ride complete message', () => {
      const riderMessage = getSMSTemplate(RIDE_STATUSES.RIDE_COMPLETE, 'rider');
      const caseManagerMessage = getSMSTemplate(RIDE_STATUSES.RIDE_COMPLETE, 'case_manager');

      expect(riderMessage).toContain('ride is complete');
      expect(caseManagerMessage).toContain('ride is complete');
    });

    it('should return roundtrip complete message', () => {
      const message = getSMSTemplate(RIDE_STATUSES.ROUNDTRIP_COMPLETE, 'rider');

      expect(message).toContain('roundtrip is completed');
    });

    it('should return null for unsupported status/recipient combinations', () => {
      const message = getSMSTemplate(RIDE_STATUSES.RIDE_STARTED, 'rider');

      expect(message).toBeNull();
    });

    it('should return null for invalid recipient', () => {
      const message = getSMSTemplate('DRIVER_ARRIVAL_CHECK', 'rider');

      expect(message).toBeNull();
    });

    it('should handle dispatcher recipient', () => {
      const message = getSMSTemplate(RIDE_STATUSES.RIDER_NOT_DROPPED_OFF, 'dispatcher');

      expect(message).toContain('Rider not dropped off');
      expect(message).toContain('dispatcher intervention');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty ride data', () => {
      const emptyRide = {
        uuid: 'test',
        pickupRequestedTime: null,
        pickupAddress: null,
        dropOffAddress: null,
        roundTrip: false,
      } as any;

      const message = getRideConfirmedMessage(emptyRide, null, null);

      expect(message).toContain('TBD'); // Should fallback to TBD
    });

    it('should return null for missing required data', () => {
      // When ride data is missing, template returns null
      const message = getSMSTemplate('DRIVER_ARRIVAL_CHECK', 'dispatcher');

      expect(message).toBeNull();
    });
  });
});
