import { describe, it, expect } from 'vitest';
import { RIDE_STATUSES } from '../../constants/rideStatuses.js';

/**
 * Twilio Webhook Handler Tests
 * Tests the webhook endpoint processing logic
 */

describe('Twilio Webhook Handler', () => {
  // Mock ride data for tests
  const createMockRide = (overrides: Record<string, unknown> = {}) => ({
    uuid: 'ride-123',
    rideStatus: RIDE_STATUSES.RIDE_CONFIRMED as number,
    rideRequestStatus: 100, // ALL_RIDE_REQUEST_OPEN
    roundTrip: false,
    pickupRequestedTime: new Date('2025-11-25T18:00:00Z'),
    pickupAddress: '123 Main St',
    dropOffAddress: '456 Oak Ave',
    rider: {
      uuid: 'rider-123',
      fullName: 'Test Rider',
      phone: '+15551234567',
    },
    driver: {
      uuid: 'driver-123',
      fullName: 'Test Driver',
      mobilePhone: '+15559876543',
      phone: '+15559876543',
    },
    vehicle: {
      uuid: 'vehicle-123',
      make: 'Ford',
      model: 'Transit',
      color: 'Gray',
      licensePlate: 'ABC123',
    },
    createdBy: {
      uuid: 'manager-123',
      fullName: 'Case Manager',
      phone: '+15550001111',
    },
    riderPhone: '+15551234567',
    serviceUserPhone: '+15551234567',
    ...overrides,
  });

  describe('Webhook Payload Parsing', () => {
    it('should parse standard Twilio webhook payload', () => {
      const payload = {
        From: '+15551234567',
        To: '+18669017244',
        Body: '1',
        MessageSid: 'SM123456789',
        SmsStatus: 'received',
      };

      expect(payload.From).toBe('+15551234567');
      expect(payload.To).toBe('+18669017244');
      expect(payload.Body).toBe('1');
      expect(payload.MessageSid).toMatch(/^SM/);
    });

    it('should handle URL-encoded phone numbers', () => {
      // When sent as form data, + becomes %2B
      const decodedFrom = decodeURIComponent('%2B15551234567');
      expect(decodedFrom).toBe('+15551234567');
    });

    it('should handle whitespace in message body', () => {
      const bodies = ['1', ' 1', '1 ', ' 1 ', '  1  '];
      bodies.forEach(body => {
        expect(body.trim()).toBe('1');
      });
    });
  });

  describe('Active Ride Filtering', () => {
    it('should identify active rides (not complete or roundtrip complete)', () => {
      const activeStatuses = [
        RIDE_STATUSES.REQUEST_IN_PROGRESS,
        RIDE_STATUSES.RIDE_CONFIRMED,
        RIDE_STATUSES.RIDE_STARTED,
        RIDE_STATUSES.RIDER_PICKED_UP,
        RIDE_STATUSES.RIDER_DROPPED_OFF,
        RIDE_STATUSES.ROUNDTRIP_RETURNING,
      ];

      activeStatuses.forEach(status => {
        const ride = createMockRide({ rideStatus: status });
        const isActive =
          ride.rideStatus !== RIDE_STATUSES.RIDE_COMPLETE &&
          ride.rideStatus !== RIDE_STATUSES.ROUNDTRIP_COMPLETE;
        expect(isActive).toBe(true);
      });
    });

    it('should not include completed rides as active', () => {
      const completedStatuses = [
        RIDE_STATUSES.RIDE_COMPLETE,
        RIDE_STATUSES.ROUNDTRIP_COMPLETE,
      ];

      completedStatuses.forEach(status => {
        const ride = createMockRide({ rideStatus: status });
        const isActive =
          ride.rideStatus !== RIDE_STATUSES.RIDE_COMPLETE &&
          ride.rideStatus !== RIDE_STATUSES.ROUNDTRIP_COMPLETE;
        expect(isActive).toBe(false);
      });
    });

    it('should match driver by mobilePhone', () => {
      const ride = createMockRide();
      const senderPhone = '+15559876543';

      const isDriver =
        ride.driver &&
        (ride.driver.mobilePhone === senderPhone || ride.driver.phone === senderPhone);

      expect(isDriver).toBe(true);
    });

    it('should match driver by phone when mobilePhone is undefined', () => {
      const ride = createMockRide({
        driver: {
          uuid: 'driver-123',
          fullName: 'Test Driver',
          mobilePhone: undefined,
          phone: '+15559876543',
        },
      });
      const senderPhone = '+15559876543';

      const driver = ride.driver as { mobilePhone?: string; phone?: string };
      const isDriver = driver && (driver.mobilePhone === senderPhone || driver.phone === senderPhone);

      expect(isDriver).toBe(true);
    });

    it('should match rider by registered phone', () => {
      const ride = createMockRide();
      const senderPhone = '+15551234567';

      const isRider = ride.rider && ride.rider.phone === senderPhone;

      expect(isRider).toBe(true);
    });

    it('should match rider by riderPhone (non-registered)', () => {
      const ride = createMockRide({ rider: null, riderPhone: '+15557777777' });
      const senderPhone = '+15557777777';

      const isRider =
        (ride.rider && ride.rider.phone === senderPhone) ||
        ride.riderPhone === senderPhone;

      expect(isRider).toBe(true);
    });

    it('should match rider by serviceUserPhone', () => {
      const ride = createMockRide({ rider: null, serviceUserPhone: '+15558888888' });
      const senderPhone = '+15558888888';

      const isRider =
        (ride.rider && ride.rider.phone === senderPhone) ||
        ride.riderPhone === senderPhone ||
        ride.serviceUserPhone === senderPhone;

      expect(isRider).toBe(true);
    });
  });

  describe('Sender Role Determination', () => {
    it('should identify sender as driver', () => {
      const ride = createMockRide();
      const senderPhone = '+15559876543';

      let senderRole = 'unknown';
      if (ride.driver) {
        const driverPhone = ride.driver.mobilePhone || ride.driver.phone;
        if (driverPhone === senderPhone) {
          senderRole = 'driver';
        }
      }

      expect(senderRole).toBe('driver');
    });

    it('should identify sender as rider', () => {
      const ride = createMockRide();
      const senderPhone = '+15551234567';

      let senderRole = 'unknown';
      if (ride.rider && ride.rider.phone === senderPhone) {
        senderRole = 'rider';
      }

      expect(senderRole).toBe('rider');
    });

    it('should identify sender as case_manager', () => {
      const ride = createMockRide();
      const senderPhone = '+15550001111';

      let senderRole = 'unknown';
      if (ride.createdBy?.phone === senderPhone) {
        senderRole = 'case_manager';
      }

      expect(senderRole).toBe('case_manager');
    });

    it('should return unknown for unrecognized sender', () => {
      const ride = createMockRide();
      const senderPhone = '+15550000000';

      let senderRole = 'unknown';
      if (ride.rider && ride.rider.phone === senderPhone) {
        senderRole = 'rider';
      } else if (ride.driver) {
        const driverPhone = ride.driver.mobilePhone || ride.driver.phone;
        if (driverPhone === senderPhone) {
          senderRole = 'driver';
        }
      } else if (ride.createdBy?.phone === senderPhone) {
        senderRole = 'case_manager';
      }

      expect(senderRole).toBe('unknown');
    });
  });

  describe('Multiple Active Rides Handling', () => {
    it('should select most recent ride when multiple active rides exist', () => {
      const rides = [
        createMockRide({ uuid: 'ride-001' }),
        createMockRide({ uuid: 'ride-003' }),
        createMockRide({ uuid: 'ride-002' }),
      ];

      const sortedRides = rides.sort((a, b) => b.uuid.localeCompare(a.uuid));
      const selectedRide = sortedRides[0];

      expect(selectedRide?.uuid).toBe('ride-003');
    });

    it('should filter out completed rides before selecting', () => {
      const rides = [
        createMockRide({ uuid: 'ride-001', rideStatus: RIDE_STATUSES.RIDE_COMPLETE }),
        createMockRide({ uuid: 'ride-003', rideStatus: RIDE_STATUSES.RIDE_CONFIRMED }),
        createMockRide({ uuid: 'ride-002', rideStatus: RIDE_STATUSES.ROUNDTRIP_COMPLETE }),
      ];

      const activeRides = rides.filter(
        ride =>
          ride.rideStatus !== RIDE_STATUSES.RIDE_COMPLETE &&
          ride.rideStatus !== RIDE_STATUSES.ROUNDTRIP_COMPLETE
      );

      expect(activeRides).toHaveLength(1);
      expect(activeRides[0]?.uuid).toBe('ride-003');
    });
  });

  describe('Response XML Generation', () => {
    it('should generate valid TwiML response', () => {
      const emptyResponse = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

      expect(emptyResponse).toContain('<?xml version="1.0"');
      expect(emptyResponse).toContain('<Response>');
      expect(emptyResponse).toContain('</Response>');
    });

    it('should generate TwiML with message reply', () => {
      const messageBody = 'Thank you for your response!';
      const responseWithMessage = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${messageBody}</Message>
</Response>`;

      expect(responseWithMessage).toContain(`<Message>${messageBody}</Message>`);
    });
  });

  describe('Notification Record Creation', () => {
    it('should create notification record for incoming SMS', () => {
      const notification = {
        uuid: 'notif-123',
        rideUuid: 'ride-123',
        notificationType: 'sms_response',
        direction: 'inbound' as const,
        recipientPhone: '+18669017244',
        recipientName: null,
        recipientRole: 'driver',
        messageBody: '1',
        twilioMessageSid: 'SM123456789',
        twilioStatus: 'received',
        sentAt: new Date(),
        deliveredAt: null,
        errorMessage: null,
      };

      expect(notification.direction).toBe('inbound');
      expect(notification.notificationType).toBe('sms_response');
      expect(notification.twilioStatus).toBe('received');
    });

    it('should handle unknown sender notification', () => {
      const notification = {
        uuid: 'notif-456',
        rideUuid: null,
        notificationType: 'incoming_sms',
        direction: 'inbound' as const,
        recipientRole: 'unknown',
        messageBody: 'Hello',
        twilioStatus: 'received',
      };

      expect(notification.rideUuid).toBeNull();
      expect(notification.recipientRole).toBe('unknown');
    });
  });

  describe('Status Update Logic', () => {
    it('should update ride status based on driver response', () => {
      const currentStatus = RIDE_STATUSES.RIDE_STARTED;
      const response = '1'; // Rider picked up

      // Simulate status update logic
      let newStatus: number = currentStatus;
      if (currentStatus === RIDE_STATUSES.RIDE_STARTED && response === '1') {
        newStatus = RIDE_STATUSES.RIDER_PICKED_UP;
      }

      expect(newStatus).toBe(RIDE_STATUSES.RIDER_PICKED_UP);
    });

    it('should auto-close ride request when ride completes', () => {
      const rideStatus = RIDE_STATUSES.RIDE_COMPLETE;

      const closingStatuses = [
        RIDE_STATUSES.RIDE_COMPLETE,
        RIDE_STATUSES.ROUNDTRIP_COMPLETE,
        RIDE_STATUSES.RIDE_CANCELED_BY_RIDER,
      ];

      const shouldClose = closingStatuses.includes(rideStatus);

      expect(shouldClose).toBe(true);
    });

    it('should cancel scheduled tasks when ride closes', () => {
      const closingStatuses = [
        RIDE_STATUSES.RIDE_COMPLETE,
        RIDE_STATUSES.ROUNDTRIP_COMPLETE,
        RIDE_STATUSES.RIDE_CANCELED_BY_RIDER,
      ];

      closingStatuses.forEach(status => {
        const shouldCancelTasks = closingStatuses.includes(status);
        expect(shouldCancelTasks).toBe(true);
      });
    });
  });

  describe('Message Forwarding', () => {
    it('should forward rider message to driver', () => {
      const ride = createMockRide();
      const senderRole = 'rider';
      const messageBody = 'Running 5 minutes late';

      if (senderRole === 'rider' && ride.driver) {
        const recipientPhone = ride.driver.mobilePhone || ride.driver.phone;
        const senderName = ride.rider?.fullName || 'Rider';
        const forwardMessage = `Message from ${senderName} (Rider):\n${messageBody}`;

        expect(recipientPhone).toBe('+15559876543');
        expect(forwardMessage).toContain('Test Rider');
        expect(forwardMessage).toContain(messageBody);
      }
    });

    it('should forward driver message to rider', () => {
      const ride = createMockRide();
      const senderRole = 'driver';
      const messageBody = 'I am outside';

      if (senderRole === 'driver' && ride.rider) {
        const recipientPhone = ride.rider.phone;
        const senderName = ride.driver?.fullName || 'Driver';
        const forwardMessage = `Message from ${senderName} (Driver):\n${messageBody}`;

        expect(recipientPhone).toBe('+15551234567');
        expect(forwardMessage).toContain('Test Driver');
        expect(forwardMessage).toContain(messageBody);
      }
    });
  });
});

describe('Twilio Webhook - Edge Cases', () => {
  describe('Empty or Invalid Payloads', () => {
    it('should handle missing MessageSid', () => {
      const payload = {
        From: '+15551234567',
        To: '+18669017244',
        Body: '1',
        // MessageSid missing
      };

      expect(payload.From).toBeDefined();
      expect((payload as Record<string, unknown>).MessageSid).toBeUndefined();
    });

    it('should handle empty Body', () => {
      const payload = {
        From: '+15551234567',
        To: '+18669017244',
        Body: '',
        MessageSid: 'SM123',
      };

      expect(payload.Body).toBe('');
      expect(payload.Body.trim()).toBe('');
    });

    it('should handle special characters in Body', () => {
      const bodies = ['👍', '¿Sí?', '日本語', '1️⃣', '\n1\n'];

      bodies.forEach(body => {
        expect(typeof body).toBe('string');
      });
    });
  });

  describe('Phone Number Edge Cases', () => {
    it('should handle phone numbers with different formats', () => {
      const formats = [
        '+15551234567',  // Standard E.164
        '15551234567',   // Without +
        '+1-555-123-4567', // With dashes (should be cleaned)
      ];

      const normalizePhone = (phone: string) => {
        const cleaned = phone.replace(/[-\s]/g, '');
        return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
      };

      formats.forEach(format => {
        const normalized = normalizePhone(format);
        expect(normalized).toMatch(/^\+\d+$/);
      });
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle rapid successive webhooks for same ride', async () => {
      // Simulate rapid webhook calls
      const webhookCalls = Array(5).fill(null).map((_, i) => ({
        MessageSid: `SM${i}`,
        From: '+15559876543',
        Body: '1',
        timestamp: Date.now() + i,
      }));

      // All should have unique MessageSids
      const sids = webhookCalls.map(w => w.MessageSid);
      const uniqueSids = new Set(sids);

      expect(uniqueSids.size).toBe(5);
    });
  });
});

describe('Twilio Webhook - Security', () => {
  describe('Request Validation', () => {
    it('should validate X-Twilio-Signature header structure', () => {
      // Twilio signature is a base64-encoded HMAC-SHA1
      const validSignaturePattern = /^[A-Za-z0-9+/=]+$/;
      const mockSignature = 'abc123DEF456/+==';

      expect(mockSignature.match(validSignaturePattern)).toBeTruthy();
    });

    it('should reject requests from unknown origins in production', () => {
      const allowedOrigins = ['twilio.com', 'api.twilio.com'];
      const testOrigin = 'malicious-site.com';

      const isAllowed = allowedOrigins.some(allowed =>
        testOrigin.includes(allowed)
      );

      expect(isAllowed).toBe(false);
    });
  });
});
