import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import NotificationScheduler from '../NotificationScheduler.js';
import { TaskManager } from '../TaskManager.js';
import type { Ride, ServiceProvider, User } from '../../../types/database.types.js';
import timeCalculator from '../TimeCalculator.js';
import notificationService from '../../notificationService.js';

describe('NotificationScheduler', () => {
  let scheduler: NotificationScheduler;
  let taskManager: TaskManager;
  let consoleLogSpy: any;
  let consoleWarnSpy: any;

  // Factory function for creating test rides
  const createMockRide = (overrides = {}): Ride =>
    ({
      uuid: 'ride-123',
      displayId: 'RIDE-123',
      riderUuid: null,
      driverUuid: null,
      vehicleUuid: null,
      riderName: null,
      riderPhone: null,
      caseManagerName: null,
      caseManagerPhone: null,
      pickupAddress: 'Test Pickup',
      dropOffAddress: 'Test Dropoff',
      pickupRequestedTime: new Date('2025-11-25T18:00:00Z'),
      dropOffRequestedTime: null,
      rideStartedActualTime: null,
      pickupActualTime: null,
      dropOffActualTime: null,
      rideCompleteRequestedTime: null,
      rideCompleteActualTime: null,
      rideStatus: 0,
      rideRequestStatus: 100,
      roundTrip: false,
      purpose: null,
      notes: null,
      estimatedTravelTime: 30,
      estimatedDistance: null,
      walkerAccessible: false,
      wheelchairAccessible: false,
      serviceAnimalFriendly: false,
      oxygenTankAccessible: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as Ride);

  const mockRide = createMockRide({
    estimatedTravelTime: 30,
    estimatedWaitingTime: 60,
  });

  const mockDriver: ServiceProvider = {
    uuid: 'driver-123',
    fullName: 'Test Driver',
    mobilePhone: '+15551234567',
  } as ServiceProvider;

  const mockRider: User = {
    uuid: 'rider-123',
    fullName: 'Test Rider',
    phone: '+15559876543',
  } as User;

  beforeEach(() => {
    vi.useFakeTimers();
    taskManager = new TaskManager();
    scheduler = new NotificationScheduler(taskManager);

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Spy on dependencies
    vi.spyOn(timeCalculator, 'calculatePickupTime');
    vi.spyOn(timeCalculator, 'calculateDropoffTime');
    vi.spyOn(timeCalculator, 'calculateRoundtripReturnTime');
    vi.spyOn(timeCalculator, 'calculateDelayFromNow');
    vi.spyOn(timeCalculator, 'formatTimeInfo');

    vi.spyOn(notificationService, 'sendDriverArrivalCheck');
    vi.spyOn(notificationService, 'sendDropoffCheck');
    vi.spyOn(notificationService, 'sendRoundtripReturnCheck');
    vi.spyOn(notificationService, 'scheduleDriverArrivalCheck');

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('scheduleDriverArrivalCheck', () => {
    it('should schedule arrival check for future pickup time', async () => {
      const futureTime = new Date(Date.now() + 60 * 60 * 1000);
      const delay = 60 * 60 * 1000;

      (timeCalculator.calculatePickupTime as any).mockReturnValue({
        targetTime: futureTime,
        delay,
        isPast: false,
      });

      (timeCalculator.formatTimeInfo as any).mockReturnValue({
        timeString: futureTime.toLocaleString(),
        delayMinutes: 60,
      });

      // Mock the scheduleDriverArrivalCheck to return a successful result
      (notificationService.scheduleDriverArrivalCheck as any).mockResolvedValue({
        success: true,
        messageSid: 'SM123456',
        provider: 'twilio',
        to: mockDriver.mobilePhone,
        body: 'Test message',
        timestamp: new Date(),
      });

      scheduler.scheduleDriverArrivalCheck(mockRide, mockDriver);

      // Advance timers to allow async operations to complete
      await vi.advanceTimersByTimeAsync(100);

      // Verify task was added (with message SID as the task value)
      const tasks = taskManager.getRideTasks(mockRide.uuid);
      expect(tasks).toHaveLength(1);
      expect(tasks[0]!.taskName).toBe('driver_arrival_check');

      // Verify the Twilio scheduling method was called
      expect(notificationService.scheduleDriverArrivalCheck).toHaveBeenCalledWith(
        mockRide,
        mockDriver,
        expect.any(String) // ISO timestamp
      );
    });

    it('should send immediately for past pickup time', () => {
      (timeCalculator.calculatePickupTime as any).mockReturnValue({
        targetTime: new Date(Date.now() - 1000),
        delay: -1000,
        isPast: true,
      });

      scheduler.scheduleDriverArrivalCheck(mockRide, mockDriver);

      // Verify sent immediately
      expect(notificationService.sendDriverArrivalCheck).toHaveBeenCalledWith(mockRide, mockDriver);

      // Verify no task scheduled
      const tasks = taskManager.getRideTasks(mockRide.uuid);
      expect(tasks).toHaveLength(0);
    });

  });

  describe('scheduleDropoffCheck', () => {
    it('should schedule dropoff check for future dropoff time', () => {
      const futureTime = new Date(Date.now() + 90 * 60 * 1000);
      const delay = 90 * 60 * 1000;

      (timeCalculator.calculateDropoffTime as any).mockReturnValue({
        targetTime: futureTime,
        delay,
        isPast: false,
        travelTimeMinutes: 30,
      });

      (timeCalculator.formatTimeInfo as any).mockReturnValue({
        timeString: futureTime.toLocaleString(),
        delayMinutes: 90,
      });

      scheduler.scheduleDropoffCheck(mockRide, mockDriver);

      const tasks = taskManager.getRideTasks(mockRide.uuid);
      expect(tasks).toHaveLength(1);
      expect(tasks[0]!.taskName).toBe('dropoff_check');
    });

    it('should send immediately for past dropoff time', () => {
      (timeCalculator.calculateDropoffTime as any).mockReturnValue({
        targetTime: new Date(Date.now() - 1000),
        delay: -1000,
        isPast: true,
        travelTimeMinutes: 30,
      });

      scheduler.scheduleDropoffCheck(mockRide, mockDriver);

      expect(notificationService.sendDropoffCheck).toHaveBeenCalledWith(mockRide, mockDriver);

      const tasks = taskManager.getRideTasks(mockRide.uuid);
      expect(tasks).toHaveLength(0);
    });

  });

  describe('scheduleRoundtripReturnCheck', () => {
    it('should schedule roundtrip return check for future time', () => {
      const futureTime = new Date(Date.now() + 150 * 60 * 1000);
      const delay = 150 * 60 * 1000;

      (timeCalculator.calculateRoundtripReturnTime as any).mockReturnValue({
        targetTime: futureTime,
        delay,
        isPast: false,
        travelTimeMinutes: 30,
        waitingTimeMinutes: 60,
      });

      (timeCalculator.formatTimeInfo as any).mockReturnValue({
        timeString: futureTime.toLocaleString(),
        delayMinutes: 150,
      });

      scheduler.scheduleRoundtripReturnCheck(mockRide, mockDriver);

      const tasks = taskManager.getRideTasks(mockRide.uuid);
      expect(tasks).toHaveLength(1);
      expect(tasks[0]!.taskName).toBe('roundtrip_return_check');
    });

    it('should send immediately for past return time', () => {
      (timeCalculator.calculateRoundtripReturnTime as any).mockReturnValue({
        targetTime: new Date(Date.now() - 1000),
        delay: -1000,
        isPast: true,
        travelTimeMinutes: 30,
        waitingTimeMinutes: 60,
      });

      scheduler.scheduleRoundtripReturnCheck(mockRide, mockDriver);

      expect(notificationService.sendRoundtripReturnCheck).toHaveBeenCalledWith(
        mockRide,
        mockDriver
      );

      const tasks = taskManager.getRideTasks(mockRide.uuid);
      expect(tasks).toHaveLength(0);
    });
  });

  describe('scheduleStatusChange', () => {
    it('should schedule status change with delay', () => {
      const delayMinutes = 5;
      const newStatus = 200;
      const mockApiUpdate = vi.fn();

      (timeCalculator.calculateDelayFromNow as any).mockReturnValue({
        targetTime: new Date(Date.now() + delayMinutes * 60 * 1000),
        delay: delayMinutes * 60 * 1000,
        delayMinutes,
      });

      scheduler.scheduleStatusChange(mockRide, newStatus, delayMinutes, mockApiUpdate);

      const tasks = taskManager.getRideTasks(mockRide.uuid);
      expect(tasks).toHaveLength(1);
      expect(tasks[0]!.taskName).toBe(`status_change_${newStatus}`);
    });

  });

  describe('scheduleNotification', () => {
    it('should schedule generic notification', () => {
      const delayMinutes = 10;
      const template = 'DRIVER_EN_ROUTE';
      const recipient = 'rider';

      (timeCalculator.calculateDelayFromNow as any).mockReturnValue({
        targetTime: new Date(Date.now() + delayMinutes * 60 * 1000),
        delay: delayMinutes * 60 * 1000,
        delayMinutes,
      });

      scheduler.scheduleNotification(mockRide, recipient, template, delayMinutes, {
        rider: mockRider,
        driver: mockDriver,
      });

      const tasks = taskManager.getRideTasks(mockRide.uuid);
      expect(tasks).toHaveLength(1);
      expect(tasks[0]!.taskName).toBe(`notification_${template}_${recipient}`);
    });

  });

});
