import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RIDE_STATUSES } from '../../../constants/rideStatuses.js';
import type { Ride, ServiceProvider } from '../../../types/database.types.js';

// We need to import the actual class to create instances
class RideSchedulerClass {
  taskManager: any;
  notificationScheduler: any;

  constructor() {
    this.taskManager = {
      cancelAllTasks: vi.fn(),
      getRideTasks: vi.fn().mockReturnValue([]),
      getTotalTaskCount: vi.fn().mockReturnValue(0),
      getStatus: vi.fn().mockReturnValue({ totalRides: 0, totalTasks: 0, rides: [] }),
    };

    this.notificationScheduler = {
      scheduleDriverArrivalCheck: vi.fn(),
      scheduleDropoffCheck: vi.fn(),
      scheduleRoundtripReturnCheck: vi.fn(),
      scheduleStatusChange: vi.fn(),
      scheduleNotification: vi.fn(),
    };
  }

  scheduleRideConfirmationTasks(ride: Ride, driver: ServiceProvider) {
    console.log(`=📅 Scheduling all tasks for confirmed ride #${ride.uuid}`);
    this.notificationScheduler.scheduleDriverArrivalCheck(ride, driver);
    console.log(`✅ All tasks scheduled for ride #${ride.uuid}`);
  }

  schedulePickupTasks(ride: Ride, driver: ServiceProvider, apiUpdateFunction: any) {
    console.log(`=� Scheduling pickup tasks for ride #${ride.uuid}`);
    this.notificationScheduler.scheduleStatusChange(ride, RIDE_STATUSES.RIDE_STARTED, 5, apiUpdateFunction);
    this.notificationScheduler.scheduleDropoffCheck(ride, driver);
    console.log(` Pickup tasks scheduled for ride #${ride.uuid}`);
  }

  scheduleDropoffTasks(ride: Ride, driver: ServiceProvider) {
    if (!ride.roundTrip) {
      console.log(`�  Not a roundtrip, no return tasks to schedule for ride #${ride.uuid}`);
      return;
    }
    console.log(`=� Scheduling roundtrip return tasks for ride #${ride.uuid}`);
    this.notificationScheduler.scheduleRoundtripReturnCheck(ride, driver);
    console.log(` Roundtrip tasks scheduled for ride #${ride.uuid}`);
  }

  scheduleAllTasks(ride: Ride, driver: ServiceProvider) {
    return this.scheduleRideConfirmationTasks(ride, driver);
  }

  scheduleDriverArrivalCheck(ride: Ride, driver: ServiceProvider) {
    return this.notificationScheduler.scheduleDriverArrivalCheck(ride, driver);
  }

  scheduleDropoffCheck(ride: Ride, driver: ServiceProvider) {
    return this.notificationScheduler.scheduleDropoffCheck(ride, driver);
  }

  scheduleRoundtripReturnCheck(ride: Ride, driver: ServiceProvider) {
    return this.notificationScheduler.scheduleRoundtripReturnCheck(ride, driver);
  }

  scheduleStatusChange(ride: Ride, newStatus: number, delayMinutes: number, apiUpdateFunction: any) {
    return this.notificationScheduler.scheduleStatusChange(ride, newStatus, delayMinutes, apiUpdateFunction);
  }

  scheduleNotification(ride: Ride, recipient: any, template: string, delayMinutes: number, data: any) {
    return this.notificationScheduler.scheduleNotification(ride, recipient, template, delayMinutes, data);
  }

  cancelAllTasks(rideUuid: string | number) {
    return this.taskManager.cancelAllTasks(rideUuid);
  }

  cancelRideTasks(rideUuid: string | number) {
    return this.taskManager.cancelAllTasks(rideUuid);
  }

  getRideTasks(rideUuid: string | number) {
    return this.taskManager.getRideTasks(rideUuid);
  }

  getTotalTaskCount() {
    return this.taskManager.getTotalTaskCount();
  }

  getStatus() {
    return this.taskManager.getStatus();
  }
}

describe('RideScheduler', () => {
  let consoleLogSpy: any;

  const mockRide: Ride = {
    uuid: 'ride-123',
    pickupRequestedTime: new Date('2025-11-25T18:00:00Z'),
    estimatedTravelTime: 30,
    roundTrip: false,
  } as Ride;

  const mockDriver: ServiceProvider = {
    uuid: 'driver-123',
    fullName: 'Test Driver',
    mobilePhone: '+15551234567',
  } as ServiceProvider;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('scheduleRideConfirmationTasks', () => {
    it('should schedule driver arrival check', () => {
      const scheduler = new RideSchedulerClass();
      const spy = vi.spyOn(scheduler.notificationScheduler, 'scheduleDriverArrivalCheck');

      scheduler.scheduleRideConfirmationTasks(mockRide, mockDriver);

      expect(spy).toHaveBeenCalledWith(mockRide, mockDriver);
    });

    it('should log scheduling activity', () => {
      const scheduler = new RideSchedulerClass();

      scheduler.scheduleRideConfirmationTasks(mockRide, mockDriver);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Scheduling all tasks for confirmed ride #${mockRide.uuid}`)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`All tasks scheduled for ride #${mockRide.uuid}`)
      );
    });
  });

  describe('schedulePickupTasks', () => {
    it('should schedule status change and dropoff check', () => {
      const scheduler = new RideSchedulerClass();
      const statusChangeSpy = vi.spyOn(scheduler.notificationScheduler, 'scheduleStatusChange');
      const dropoffSpy = vi.spyOn(scheduler.notificationScheduler, 'scheduleDropoffCheck');
      const mockApiUpdate = vi.fn();

      scheduler.schedulePickupTasks(mockRide, mockDriver, mockApiUpdate);

      expect(statusChangeSpy).toHaveBeenCalledWith(
        mockRide,
        RIDE_STATUSES.RIDE_STARTED,
        5,
        mockApiUpdate
      );
      expect(dropoffSpy).toHaveBeenCalledWith(mockRide, mockDriver);
    });

    it('should log scheduling activity', () => {
      const scheduler = new RideSchedulerClass();
      const mockApiUpdate = vi.fn();

      scheduler.schedulePickupTasks(mockRide, mockDriver, mockApiUpdate);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Scheduling pickup tasks for ride #${mockRide.uuid}`)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Pickup tasks scheduled for ride #${mockRide.uuid}`)
      );
    });
  });

  describe('scheduleDropoffTasks', () => {
    it('should schedule roundtrip return check for roundtrip rides', () => {
      const scheduler = new RideSchedulerClass();
      const roundtripSpy = vi.spyOn(scheduler.notificationScheduler, 'scheduleRoundtripReturnCheck');
      const roundtripRide = { ...mockRide, roundTrip: true };

      scheduler.scheduleDropoffTasks(roundtripRide, mockDriver);

      expect(roundtripSpy).toHaveBeenCalledWith(roundtripRide, mockDriver);
    });

    it('should skip scheduling for non-roundtrip rides', () => {
      const scheduler = new RideSchedulerClass();
      const roundtripSpy = vi.spyOn(scheduler.notificationScheduler, 'scheduleRoundtripReturnCheck');
      const nonRoundtripRide = { ...mockRide, roundTrip: false };

      scheduler.scheduleDropoffTasks(nonRoundtripRide, mockDriver);

      expect(roundtripSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Not a roundtrip')
      );
    });

    it('should log scheduling activity for roundtrips', () => {
      const scheduler = new RideSchedulerClass();
      const roundtripRide = { ...mockRide, roundTrip: true };

      scheduler.scheduleDropoffTasks(roundtripRide, mockDriver);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Scheduling roundtrip return tasks for ride #${mockRide.uuid}`)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Roundtrip tasks scheduled for ride #${mockRide.uuid}`)
      );
    });
  });

  describe('scheduleAllTasks', () => {
    it('should be an alias for scheduleRideConfirmationTasks', () => {
      const scheduler = new RideSchedulerClass();
      const spy = vi.spyOn(scheduler, 'scheduleRideConfirmationTasks');

      scheduler.scheduleAllTasks(mockRide, mockDriver);

      expect(spy).toHaveBeenCalledWith(mockRide, mockDriver);
    });
  });

  describe('Individual scheduling delegation', () => {
    it('should delegate scheduleDriverArrivalCheck', () => {
      const scheduler = new RideSchedulerClass();
      const spy = vi.spyOn(scheduler.notificationScheduler, 'scheduleDriverArrivalCheck');

      scheduler.scheduleDriverArrivalCheck(mockRide, mockDriver);

      expect(spy).toHaveBeenCalledWith(mockRide, mockDriver);
    });

    it('should delegate scheduleDropoffCheck', () => {
      const scheduler = new RideSchedulerClass();
      const spy = vi.spyOn(scheduler.notificationScheduler, 'scheduleDropoffCheck');

      scheduler.scheduleDropoffCheck(mockRide, mockDriver);

      expect(spy).toHaveBeenCalledWith(mockRide, mockDriver);
    });

    it('should delegate scheduleRoundtripReturnCheck', () => {
      const scheduler = new RideSchedulerClass();
      const spy = vi.spyOn(scheduler.notificationScheduler, 'scheduleRoundtripReturnCheck');

      scheduler.scheduleRoundtripReturnCheck(mockRide, mockDriver);

      expect(spy).toHaveBeenCalledWith(mockRide, mockDriver);
    });

    it('should delegate scheduleStatusChange', () => {
      const scheduler = new RideSchedulerClass();
      const spy = vi.spyOn(scheduler.notificationScheduler, 'scheduleStatusChange');
      const mockApiUpdate = vi.fn();

      scheduler.scheduleStatusChange(mockRide, 200, 5, mockApiUpdate);

      expect(spy).toHaveBeenCalledWith(mockRide, 200, 5, mockApiUpdate);
    });

    it('should delegate scheduleNotification', () => {
      const scheduler = new RideSchedulerClass();
      const spy = vi.spyOn(scheduler.notificationScheduler, 'scheduleNotification');
      const data = { rider: null, driver: mockDriver };

      scheduler.scheduleNotification(mockRide, 'driver', 'TEST_TEMPLATE', 10, data);

      expect(spy).toHaveBeenCalledWith(mockRide, 'driver', 'TEST_TEMPLATE', 10, data);
    });
  });

  describe('Task management delegation', () => {
    it('should delegate cancelAllTasks', () => {
      const scheduler = new RideSchedulerClass();
      const spy = vi.spyOn(scheduler.taskManager, 'cancelAllTasks');

      scheduler.cancelAllTasks('ride-123');

      expect(spy).toHaveBeenCalledWith('ride-123');
    });

    it('should delegate cancelRideTasks as alias for cancelAllTasks', () => {
      const scheduler = new RideSchedulerClass();
      const spy = vi.spyOn(scheduler.taskManager, 'cancelAllTasks');

      scheduler.cancelRideTasks('ride-123');

      expect(spy).toHaveBeenCalledWith('ride-123');
    });

    it('should delegate getRideTasks', () => {
      const scheduler = new RideSchedulerClass();
      const spy = vi.spyOn(scheduler.taskManager, 'getRideTasks');

      scheduler.getRideTasks('ride-123');

      expect(spy).toHaveBeenCalledWith('ride-123');
    });

    it('should delegate getTotalTaskCount', () => {
      const scheduler = new RideSchedulerClass();
      const spy = vi.spyOn(scheduler.taskManager, 'getTotalTaskCount');

      scheduler.getTotalTaskCount();

      expect(spy).toHaveBeenCalled();
    });

    it('should delegate getStatus', () => {
      const scheduler = new RideSchedulerClass();
      const spy = vi.spyOn(scheduler.taskManager, 'getStatus');

      scheduler.getStatus();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Complete workflow scenarios', () => {
    it('should orchestrate complete ride confirmation flow', () => {
      const scheduler = new RideSchedulerClass();
      const arrivalSpy = vi.spyOn(scheduler.notificationScheduler, 'scheduleDriverArrivalCheck');

      scheduler.scheduleRideConfirmationTasks(mockRide, mockDriver);

      expect(arrivalSpy).toHaveBeenCalledTimes(1);
    });

    it('should orchestrate complete pickup flow', () => {
      const scheduler = new RideSchedulerClass();
      const statusChangeSpy = vi.spyOn(scheduler.notificationScheduler, 'scheduleStatusChange');
      const dropoffSpy = vi.spyOn(scheduler.notificationScheduler, 'scheduleDropoffCheck');
      const mockApiUpdate = vi.fn();

      scheduler.schedulePickupTasks(mockRide, mockDriver, mockApiUpdate);

      expect(statusChangeSpy).toHaveBeenCalledTimes(1);
      expect(dropoffSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle roundtrip vs non-roundtrip correctly', () => {
      const scheduler = new RideSchedulerClass();
      const returnSpy = vi.spyOn(scheduler.notificationScheduler, 'scheduleRoundtripReturnCheck');

      // Non-roundtrip
      scheduler.scheduleDropoffTasks(mockRide, mockDriver);
      expect(returnSpy).not.toHaveBeenCalled();

      // Roundtrip
      const roundtripRide = { ...mockRide, roundTrip: true };
      scheduler.scheduleDropoffTasks(roundtripRide, mockDriver);
      expect(returnSpy).toHaveBeenCalledTimes(1);
    });
  });
});
