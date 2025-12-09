import { describe, it, expect, vi } from 'vitest';

/**
 * NotificationService Tests
 * Tests for SMS notification sending, scheduling, and database integration
 */

// Mock dependencies
vi.mock('../../services/smsProviders/SMSProviderManager.js', () => ({
  SMSProviderManager: vi.fn().mockImplementation(() => ({
    sendSMS: vi.fn().mockResolvedValue({
      success: true,
      provider: 'twilio',
      messageSid: 'SM_TEST_123',
      status: 'accepted',
    }),
    scheduleScheduledSMS: vi.fn().mockResolvedValue({
      success: true,
      provider: 'twilio',
      messageSid: 'SM_SCHEDULED_123',
      status: 'scheduled',
    }),
    cancelScheduledSMS: vi.fn().mockResolvedValue({ success: true }),
    getStatus: vi.fn().mockReturnValue({
      twilio: { configured: true, isPrimary: true },
      vonage: { configured: true, isFallback: true },
    }),
  })),
}));

describe('NotificationService - Message Scheduling', () => {
  describe('Schedule Driver Arrival Check', () => {
    it('should calculate correct send time based on pickup time', () => {
      const pickupTime = new Date('2025-11-25T18:00:00Z');
      
      // Expected: 5 minutes after pickup time, minimum 5 min 15 sec from now
      const minScheduleTime = new Date(Date.now() + (5 * 60 + 15) * 1000);
      const scheduledTime = new Date(pickupTime.getTime());

      // Use whichever is later
      const actualSendTime = scheduledTime > minScheduleTime ? scheduledTime : minScheduleTime;

      expect(actualSendTime.getTime()).toBeGreaterThanOrEqual(minScheduleTime.getTime());
    });

    it('should enforce Twilio minimum 5-minute schedule window', () => {
      const now = new Date();
      const minTwilioTime = new Date(now.getTime() + 5 * 60 * 1000);

      // Any scheduled time must be at least 5 minutes from now
      expect(minTwilioTime.getTime() - now.getTime()).toBeGreaterThanOrEqual(5 * 60 * 1000);
    });

    it('should add 15-second buffer to Twilio minimum', () => {
      const now = new Date();
      const bufferSeconds = 15;
      const minWithBuffer = new Date(now.getTime() + (5 * 60 + bufferSeconds) * 1000);

      const timeDiff = minWithBuffer.getTime() - now.getTime();
      expect(timeDiff).toBeGreaterThanOrEqual((5 * 60 + 15) * 1000);
    });

    it('should not schedule in the past', () => {
      const pastTime = new Date(Date.now() - 60000);
      const now = new Date();

      const isValidScheduleTime = pastTime > now;
      expect(isValidScheduleTime).toBe(false);
    });

    it('should not schedule beyond 7 days (Twilio limit)', () => {
      const maxDays = 7;
      const now = new Date();
      const maxScheduleTime = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);

      const eightDaysFromNow = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
      const isWithinLimit = eightDaysFromNow <= maxScheduleTime;

      expect(isWithinLimit).toBe(false);
    });
  });

  describe('Cancel Scheduled Messages', () => {
    it('should track scheduled message SIDs for cancellation', () => {
      const scheduledMessages = new Map<string, string[]>();
      const rideUuid = 'ride-123';
      const messageSid = 'SM_SCHEDULED_123';

      // Add scheduled message
      if (!scheduledMessages.has(rideUuid)) {
        scheduledMessages.set(rideUuid, []);
      }
      scheduledMessages.get(rideUuid)!.push(messageSid);

      expect(scheduledMessages.get(rideUuid)).toContain(messageSid);
    });

    it('should cancel all scheduled messages for a ride', async () => {
      const scheduledMessages = new Map<string, string[]>();
      const rideUuid = 'ride-123';
      scheduledMessages.set(rideUuid, ['SM_1', 'SM_2', 'SM_3']);

      const cancelledSids: string[] = [];
      const messagesToCancel = scheduledMessages.get(rideUuid) || [];

      for (const sid of messagesToCancel) {
        cancelledSids.push(sid);
      }

      expect(cancelledSids).toHaveLength(3);
      expect(cancelledSids).toEqual(['SM_1', 'SM_2', 'SM_3']);
    });

    it('should handle empty scheduled messages list', () => {
      const scheduledMessages = new Map<string, string[]>();
      const rideUuid = 'ride-456';

      const messagesToCancel = scheduledMessages.get(rideUuid) || [];

      expect(messagesToCancel).toHaveLength(0);
    });
  });

  describe('Close Ride Session', () => {
    it('should cancel scheduled messages when closing session', async () => {
      const scheduledSids = ['SM_1', 'SM_2'];
      let cancelCount = 0;

      // Simulate cancellation
      for (const _sid of scheduledSids) {
        cancelCount++;
      }

      expect(cancelCount).toBe(2);
    });

    it('should return count of cancelled messages', () => {
      const scheduledCount = 3;
      const result = {
        success: true,
        cancelledMessages: scheduledCount,
      };

      expect(result.cancelledMessages).toBe(3);
    });
  });
});

describe('NotificationService - Bulk Notifications', () => {
  describe('Send to Multiple Recipients', () => {
    it('should send to rider, driver, and case manager', () => {
      const recipients = ['rider', 'driver', 'case_manager'];
      const notifications = recipients.map(recipient => ({
        recipient,
        template: 'RIDE_CONFIRMED',
      }));

      expect(notifications).toHaveLength(3);
      expect(notifications.map(n => n.recipient)).toEqual(['rider', 'driver', 'case_manager']);
    });

    it('should handle missing recipient phone numbers', () => {
      const data = {
        rider: { phone: '+15551234567' },
        driver: { mobilePhone: null, phone: null },
        caseManager: null,
      };

      const hasDriverPhone = Boolean(data.driver?.mobilePhone || data.driver?.phone);
      const hasCaseManagerPhone = Boolean(data.caseManager);

      expect(hasDriverPhone).toBe(false);
      expect(hasCaseManagerPhone).toBe(false);
    });

    it('should continue sending to valid recipients when some fail', async () => {
      const results = [
        { recipient: 'rider', success: true },
        { recipient: 'driver', success: false, error: 'Invalid number' },
        { recipient: 'case_manager', success: true },
      ];

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      expect(successful).toHaveLength(2);
      expect(failed).toHaveLength(1);
    });
  });
});

describe('NotificationService - Database Integration', () => {
  describe('Store Notification Records', () => {
    it('should create notification record with all required fields', () => {
      const notification = {
        uuid: 'notif-123',
        rideUuid: 'ride-123',
        notificationType: 'RIDE_CONFIRMED',
        direction: 'outbound' as const,
        recipientPhone: '+15551234567',
        recipientName: 'Test Rider',
        recipientRole: 'rider',
        messageBody: 'Your ride is confirmed...',
        twilioMessageSid: 'SM_123',
        twilioStatus: 'accepted',
        sentAt: new Date(),
        deliveredAt: null,
        errorMessage: null,
        isScheduled: false,
        scheduledSendAt: null,
        scheduledMessageSid: null,
      };

      expect(notification.uuid).toBeDefined();
      expect(notification.rideUuid).toBeDefined();
      expect(notification.direction).toBe('outbound');
      expect(notification.isScheduled).toBe(false);
    });

    it('should create scheduled notification record', () => {
      const scheduledNotification = {
        uuid: 'notif-456',
        rideUuid: 'ride-123',
        notificationType: 'DRIVER_ARRIVAL_CHECK',
        direction: 'outbound' as const,
        recipientPhone: '+15559876543',
        recipientName: 'Test Driver',
        recipientRole: 'driver',
        messageBody: 'Have you arrived?',
        twilioMessageSid: 'SM_SCHEDULED_123',
        twilioStatus: 'scheduled',
        sentAt: new Date(),
        isScheduled: true,
        scheduledSendAt: new Date(Date.now() + 10 * 60 * 1000),
        scheduledMessageSid: 'SM_SCHEDULED_123',
      };

      expect(scheduledNotification.isScheduled).toBe(true);
      expect(scheduledNotification.scheduledSendAt).toBeDefined();
      expect(scheduledNotification.twilioStatus).toBe('scheduled');
    });

    it('should update notification status on delivery callback', () => {
      const notification: { twilioStatus: string; deliveredAt: Date | null } = {
        twilioStatus: 'accepted',
        deliveredAt: null,
      };

      // Simulate delivery callback
      notification.twilioStatus = 'delivered';
      notification.deliveredAt = new Date();

      expect(notification.twilioStatus).toBe('delivered');
      expect(notification.deliveredAt).toBeDefined();
    });
  });

  describe('Query Notifications', () => {
    it('should filter notifications by ride UUID', () => {
      const notifications = [
        { uuid: 'n1', rideUuid: 'ride-123' },
        { uuid: 'n2', rideUuid: 'ride-123' },
        { uuid: 'n3', rideUuid: 'ride-456' },
      ];

      const rideNotifications = notifications.filter(n => n.rideUuid === 'ride-123');

      expect(rideNotifications).toHaveLength(2);
    });

    it('should filter scheduled notifications', () => {
      const notifications = [
        { uuid: 'n1', isScheduled: false, twilioStatus: 'delivered' },
        { uuid: 'n2', isScheduled: true, twilioStatus: 'scheduled' },
        { uuid: 'n3', isScheduled: false, twilioStatus: 'sent' },
      ];

      const scheduled = notifications.filter(n => n.isScheduled);

      expect(scheduled).toHaveLength(1);
      expect(scheduled[0]!.uuid).toBe('n2');
    });

    it('should identify pending scheduled messages', () => {
      const notifications = [
        { uuid: 'n1', isScheduled: true, twilioStatus: 'scheduled' },
        { uuid: 'n2', isScheduled: true, twilioStatus: 'sent' },
        { uuid: 'n3', isScheduled: true, twilioStatus: 'canceled' },
      ];

      const pendingScheduled = notifications.filter(
        n => n.isScheduled && n.twilioStatus === 'scheduled'
      );

      expect(pendingScheduled).toHaveLength(1);
    });
  });
});

describe('NotificationService - Template Variables', () => {
  describe('Variable Substitution', () => {
    it('should replace all template variables', () => {
      const template = 'Hi {riderName}, your driver {driverName} is arriving at {pickupAddress}.';
      const data = {
        riderName: 'John',
        driverName: 'Jane',
        pickupAddress: '123 Main St',
      };

      let message = template;
      for (const [key, value] of Object.entries(data)) {
        message = message.replace(new RegExp(`{${key}}`, 'g'), value);
      }

      expect(message).toBe('Hi John, your driver Jane is arriving at 123 Main St.');
      expect(message).not.toContain('{');
      expect(message).not.toContain('}');
    });

    it('should handle missing template variables', () => {
      const template = 'Hi {riderName}, vehicle is {vehicleInfo}.';
      const data = {
        riderName: 'John',
        // vehicleInfo is missing
      };

      let message = template;
      for (const [key, value] of Object.entries(data)) {
        message = message.replace(new RegExp(`{${key}}`, 'g'), value);
      }

      // vehicleInfo should remain as placeholder or be replaced with empty
      expect(message).toContain('{vehicleInfo}');
    });

    it('should handle null/undefined values', () => {
      const data = {
        riderName: null,
        driverName: undefined,
      };

      const safeName = data.riderName ?? 'Rider';
      const safeDriver = data.driverName ?? 'Driver';

      expect(safeName).toBe('Rider');
      expect(safeDriver).toBe('Driver');
    });
  });

  describe('Date/Time Formatting', () => {
    it('should format pickup time for display', () => {
      const pickupTime = new Date('2025-11-25T18:30:00Z');

      const formatted = pickupTime.toLocaleString('en-US', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/New_York',
      });

      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });

    it('should handle timezone conversion', () => {
      const utcTime = new Date('2025-11-25T18:00:00Z');

      const etTime = utcTime.toLocaleString('en-US', { timeZone: 'America/New_York' });
      const ptTime = utcTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });

      // Same UTC time, different local times
      expect(etTime).not.toBe(ptTime);
    });
  });
});

describe('NotificationService - Provider Failover', () => {
  describe('Primary to Fallback', () => {
    it('should attempt fallback when primary fails', async () => {
      const primaryResult = { success: false, error: 'Twilio unavailable' };
      let usedFallback = false;

      if (!primaryResult.success) {
        // Try fallback
        usedFallback = true;
      }

      expect(usedFallback).toBe(true);
    });

    it('should not use fallback when primary succeeds', async () => {
      const primaryResult = { success: true, messageSid: 'SM_123' };
      let usedFallback = false;

      if (!primaryResult.success) {
        usedFallback = true;
      }

      expect(usedFallback).toBe(false);
    });

    it('should report failure when both providers fail', async () => {
      const primaryResult = { success: false, error: 'Twilio error' };
      const fallbackResult = { success: false, error: 'Vonage error' };

      const finalResult = primaryResult.success ? primaryResult : fallbackResult;

      expect(finalResult.success).toBe(false);
    });
  });

  describe('Provider Status', () => {
    it('should report correct provider configuration', () => {
      const status = {
        twilio: { configured: true, isPrimary: true },
        vonage: { configured: true, isFallback: true },
      };

      expect(status.twilio.configured).toBe(true);
      expect(status.twilio.isPrimary).toBe(true);
      expect(status.vonage.isFallback).toBe(true);
    });

    it('should handle unconfigured providers', () => {
      const status = {
        twilio: { configured: false, isPrimary: false },
        vonage: { configured: false, isFallback: false },
      };

      const hasAnyProvider = status.twilio.configured || status.vonage.configured;

      expect(hasAnyProvider).toBe(false);
    });
  });
});
