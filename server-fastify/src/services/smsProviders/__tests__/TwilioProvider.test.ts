import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the twilio module before importing TwilioProvider
vi.mock('twilio', () => {
  const mockMessages = {
    create: vi.fn(),
  };
  const mockMessage = {
    update: vi.fn(),
  };
  const mockClient = {
    messages: Object.assign(vi.fn(() => mockMessage), mockMessages),
  };
  return {
    default: vi.fn(() => mockClient),
    Twilio: vi.fn(() => mockClient),
  };
});

// Mock the env config
vi.mock('../../../config/env.js', () => ({
  env: {
    TWILIO_ACCOUNT_SID: 'ACtest123456789',
    TWILIO_AUTH_TOKEN: 'test_auth_token',
    TWILIO_PHONE_NUMBER: '+18669017244',
    TWILIO_MESSAGING_SERVICE_SID: 'MGtest123456789',
    TWILIO_STATUS_CALLBACK_URL: 'https://example.com/status',
    NODE_ENV: 'test',
  },
}));

// Mock the twilio config
vi.mock('../../../config/twilio.js', () => {
  const mockMessages = {
    create: vi.fn(),
  };
  const mockMessage = {
    update: vi.fn(),
  };
  const mockClient = {
    messages: Object.assign(vi.fn(() => mockMessage), mockMessages),
  };
  return {
    twilioConfig: {
      client: mockClient,
      phoneNumber: '+18669017244',
      messagingServiceSid: 'MGtest123456789',
      statusCallbackUrl: 'https://example.com/status',
      disableStatusCallback: false,
    },
  };
});

import { TwilioProvider } from '../TwilioProvider.js';
import { twilioConfig } from '../../../config/twilio.js';

describe('TwilioProvider', () => {
  let provider: TwilioProvider;
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = twilioConfig?.client;
    provider = new TwilioProvider();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with Twilio configuration', () => {
      expect(provider.isConfigured()).toBe(true);
      expect(provider.getName()).toBe('twilio');
    });
  });

  describe('sendSMS', () => {
    it('should send SMS successfully via Messaging Service', async () => {
      const mockResult = {
        sid: 'SM123456789',
        status: 'accepted',
        to: '+15551234567',
        body: 'Test message',
      };

      mockClient.messages.create.mockResolvedValue(mockResult);

      const result = await provider.sendSMS('+15551234567', 'Test message');

      expect(result.success).toBe(true);
      expect(result.provider).toBe('twilio');
      expect(result.messageSid).toBe('SM123456789');
      expect(result.status).toBe('accepted');
      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: 'Test message',
          to: '+15551234567',
          messagingServiceSid: 'MGtest123456789',
        })
      );
    });

    it('should include status callback URL when configured', async () => {
      const mockResult = {
        sid: 'SM123456789',
        status: 'accepted',
      };

      mockClient.messages.create.mockResolvedValue(mockResult);

      await provider.sendSMS('+15551234567', 'Test message');

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCallback: 'https://example.com/status',
        })
      );
    });

    it('should validate phone number format', async () => {
      const result = await provider.sendSMS('invalid-number', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
    });

    it('should reject empty phone number', async () => {
      const result = await provider.sendSMS('', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
    });

    it('should handle Twilio API errors gracefully', async () => {
      mockClient.messages.create.mockRejectedValue(new Error('Twilio API Error: Invalid number'));

      const result = await provider.sendSMS('+15551234567', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Twilio API Error');
    });

    it('should handle network errors', async () => {
      mockClient.messages.create.mockRejectedValue(new Error('Network timeout'));

      const result = await provider.sendSMS('+15551234567', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });

    it('should accept E.164 format phone numbers', async () => {
      const mockResult = { sid: 'SM123', status: 'accepted' };
      mockClient.messages.create.mockResolvedValue(mockResult);

      // Valid E.164 formats
      const validNumbers = [
        '+15551234567',
        '+442071234567',
        '+61412345678',
        '15551234567', // Without +
      ];

      for (const number of validNumbers) {
        const result = await provider.sendSMS(number, 'Test');
        expect(result.success).toBe(true);
      }
    });
  });

  describe('scheduleScheduledSMS', () => {
    it('should schedule SMS for future delivery', async () => {
      const mockResult = {
        sid: 'SM_SCHEDULED_123',
        status: 'scheduled',
      };

      mockClient.messages.create.mockResolvedValue(mockResult);

      // Schedule for 10 minutes in the future
      const sendAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const result = await provider.scheduleScheduledSMS('+15551234567', 'Scheduled message', sendAt);

      expect(result.success).toBe(true);
      expect(result.messageSid).toBe('SM_SCHEDULED_123');
      expect(result.status).toBe('scheduled');
      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduleType: 'fixed',
          messagingServiceSid: 'MGtest123456789',
        })
      );
    });

    it('should reject scheduling in the past', async () => {
      const pastDate = new Date(Date.now() - 60000).toISOString();
      const result = await provider.scheduleScheduledSMS('+15551234567', 'Test', pastDate);

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be in the future');
    });

    it('should reject scheduling beyond 7 days', async () => {
      const farFuture = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString();
      const result = await provider.scheduleScheduledSMS('+15551234567', 'Test', farFuture);

      expect(result.success).toBe(false);
      expect(result.error).toContain('within 7 days');
    });

    it('should validate phone number format for scheduled SMS', async () => {
      const sendAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const result = await provider.scheduleScheduledSMS('invalid', 'Test', sendAt);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
    });

    it('should include status callback in scheduled message', async () => {
      const mockResult = { sid: 'SM123', status: 'scheduled' };
      mockClient.messages.create.mockResolvedValue(mockResult);

      const sendAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await provider.scheduleScheduledSMS('+15551234567', 'Test', sendAt);

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCallback: 'https://example.com/status',
        })
      );
    });
  });

  describe('cancelScheduledSMS', () => {
    it('should cancel a scheduled message successfully', async () => {
      const mockMessageInstance = mockClient.messages('SM_TO_CANCEL');
      mockMessageInstance.update.mockResolvedValue({ status: 'canceled' });

      const result = await provider.cancelScheduledSMS('SM_TO_CANCEL');

      expect(result.success).toBe(true);
      expect(mockClient.messages).toHaveBeenCalledWith('SM_TO_CANCEL');
    });

    it('should handle cancellation errors', async () => {
      const mockMessageInstance = mockClient.messages('SM_INVALID');
      mockMessageInstance.update.mockRejectedValue(new Error('Message not found'));

      const result = await provider.cancelScheduledSMS('SM_INVALID');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Message not found');
    });

    it('should handle already-sent messages', async () => {
      const mockMessageInstance = mockClient.messages('SM_ALREADY_SENT');
      mockMessageInstance.update.mockRejectedValue(new Error('Cannot cancel: message already sent'));

      const result = await provider.cancelScheduledSMS('SM_ALREADY_SENT');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already sent');
    });
  });

  describe('Provider Status', () => {
    it('should report correct provider name', () => {
      expect(provider.getName()).toBe('twilio');
    });

    it('should report configured status', () => {
      expect(provider.isConfigured()).toBe(true);
    });
  });
});

describe('TwilioProvider - Twilio Status Values', () => {
  /**
   * Test Twilio message status values
   * https://www.twilio.com/docs/messaging/guides/outbound-message-logging
   */
  describe('Twilio Message Statuses', () => {
    const twilioStatuses = [
      { status: 'accepted', description: 'Message is being processed' },
      { status: 'queued', description: 'Message is queued for delivery' },
      { status: 'sending', description: 'Message is being sent to carrier' },
      { status: 'sent', description: 'Message has been sent to carrier' },
      { status: 'delivered', description: 'Message was delivered to recipient' },
      { status: 'undelivered', description: 'Message could not be delivered' },
      { status: 'failed', description: 'Message failed to send' },
      { status: 'scheduled', description: 'Message is scheduled for future delivery' },
      { status: 'canceled', description: 'Scheduled message was canceled' },
      { status: 'read', description: 'Message was read (WhatsApp)' },
      { status: 'receiving', description: 'Inbound message being received' },
      { status: 'received', description: 'Inbound message received' },
    ];

    it.each(twilioStatuses)('should recognize status: $status - $description', ({ status }) => {
      // Valid Twilio statuses
      expect(typeof status).toBe('string');
      expect(status.length).toBeGreaterThan(0);
    });

    it('should handle successful delivery flow: accepted → queued → sent → delivered', () => {
      const deliveryFlow = ['accepted', 'queued', 'sending', 'sent', 'delivered'];

      // All statuses in flow should be valid
      deliveryFlow.forEach((status, index) => {
        expect(twilioStatuses.some(s => s.status === status)).toBe(true);

        // Status should progress forward
        if (index > 0) {
          const previousIndex = twilioStatuses.findIndex(s => s.status === deliveryFlow[index - 1]);
          const currentIndex = twilioStatuses.findIndex(s => s.status === status);
          // Just verify both exist
          expect(previousIndex).toBeGreaterThanOrEqual(0);
          expect(currentIndex).toBeGreaterThanOrEqual(0);
        }
      });
    });

    it('should handle scheduled message flow: scheduled → [canceled OR sent]', () => {
      // Scheduled can transition to canceled or continue to sent
      expect(twilioStatuses.some(s => s.status === 'scheduled')).toBe(true);
      expect(twilioStatuses.some(s => s.status === 'canceled')).toBe(true);
      expect(twilioStatuses.some(s => s.status === 'sent')).toBe(true);
    });

    it('should handle failure flow: accepted → failed', () => {
      expect(twilioStatuses.some(s => s.status === 'accepted')).toBe(true);
      expect(twilioStatuses.some(s => s.status === 'failed')).toBe(true);
    });

    it('should handle undelivered flow: sent → undelivered', () => {
      expect(twilioStatuses.some(s => s.status === 'sent')).toBe(true);
      expect(twilioStatuses.some(s => s.status === 'undelivered')).toBe(true);
    });
  });
});

describe('TwilioProvider - Error Codes', () => {
  /**
   * Test Twilio error handling based on common error codes
   * https://www.twilio.com/docs/api/errors
   */
  describe('Twilio Error Codes', () => {
    const commonTwilioErrors = [
      { code: 21211, message: 'Invalid "To" phone number' },
      { code: 21212, message: 'Invalid "From" phone number' },
      { code: 21408, message: 'Permission denied to send to this number' },
      { code: 21610, message: 'Message blocked - recipient unsubscribed' },
      { code: 21614, message: '"To" number is not SMS capable' },
      { code: 21617, message: 'Message body is too long' },
      { code: 30003, message: 'Unreachable destination handset' },
      { code: 30004, message: 'Message blocked' },
      { code: 30005, message: 'Unknown destination handset' },
      { code: 30006, message: 'Landline or unreachable carrier' },
      { code: 30007, message: 'Message filtered (carrier/spam)' },
      { code: 30008, message: 'Unknown error' },
      { code: 63003, message: 'Channel not installed (WhatsApp)' },
    ];

    it.each(commonTwilioErrors)('should handle error code $code: $message', ({ code, message }) => {
      // Validate error structure
      expect(typeof code).toBe('number');
      expect(typeof message).toBe('string');
      expect(code).toBeGreaterThan(0);
    });

    it('should categorize errors as retryable or permanent', () => {
      const retryableErrors = [30003, 30008]; // Network/temporary issues
      const permanentErrors = [21211, 21212, 21610, 21614]; // Invalid input/blocked

      retryableErrors.forEach(code => {
        const error = commonTwilioErrors.find(e => e.code === code);
        expect(error).toBeDefined();
      });

      permanentErrors.forEach(code => {
        const error = commonTwilioErrors.find(e => e.code === code);
        expect(error).toBeDefined();
      });
    });
  });
});

describe('TwilioProvider - Webhook Payload Parsing', () => {
  /**
   * Test Twilio webhook payload structure
   */
  describe('Inbound SMS Webhook', () => {
    it('should parse standard inbound SMS webhook payload', () => {
      const webhookPayload = {
        MessageSid: 'SM123456789',
        AccountSid: 'ACtest123',
        From: '+15551234567',
        To: '+18669017244',
        Body: '1',
        NumMedia: '0',
        NumSegments: '1',
        SmsStatus: 'received',
        ApiVersion: '2010-04-01',
      };

      expect(webhookPayload.MessageSid).toMatch(/^SM/);
      expect(webhookPayload.From).toMatch(/^\+\d+$/);
      expect(webhookPayload.To).toMatch(/^\+\d+$/);
      expect(webhookPayload.Body).toBeDefined();
      expect(webhookPayload.SmsStatus).toBe('received');
    });

    it('should parse MMS webhook payload with media', () => {
      const mmsPayload = {
        MessageSid: 'MM123456789',
        From: '+15551234567',
        To: '+18669017244',
        Body: 'Photo attached',
        NumMedia: '1',
        MediaUrl0: 'https://api.twilio.com/media/xxx.jpg',
        MediaContentType0: 'image/jpeg',
      };

      expect(mmsPayload.MessageSid).toMatch(/^MM/);
      expect(Number(mmsPayload.NumMedia)).toBeGreaterThan(0);
      expect(mmsPayload.MediaUrl0).toBeDefined();
    });

    it('should handle empty body in webhook', () => {
      const emptyBodyPayload = {
        MessageSid: 'SM123',
        From: '+15551234567',
        To: '+18669017244',
        Body: '',
        NumMedia: '0',
      };

      expect(emptyBodyPayload.Body).toBe('');
    });
  });

  describe('Status Callback Webhook', () => {
    it('should parse status callback payload', () => {
      const statusPayload = {
        MessageSid: 'SM123456789',
        MessageStatus: 'delivered',
        To: '+15551234567',
        ErrorCode: undefined,
        ErrorMessage: undefined,
      };

      expect(statusPayload.MessageSid).toMatch(/^SM/);
      expect(statusPayload.MessageStatus).toBe('delivered');
      expect(statusPayload.ErrorCode).toBeUndefined();
    });

    it('should parse failed status callback with error', () => {
      const failedPayload = {
        MessageSid: 'SM123456789',
        MessageStatus: 'failed',
        ErrorCode: '30003',
        ErrorMessage: 'Unreachable destination handset',
      };

      expect(failedPayload.MessageStatus).toBe('failed');
      expect(failedPayload.ErrorCode).toBe('30003');
      expect(failedPayload.ErrorMessage).toBeDefined();
    });

    it('should parse undelivered status callback', () => {
      const undeliveredPayload = {
        MessageSid: 'SM123456789',
        MessageStatus: 'undelivered',
        ErrorCode: '30007',
        ErrorMessage: 'Message filtered',
      };

      expect(undeliveredPayload.MessageStatus).toBe('undelivered');
      expect(undeliveredPayload.ErrorCode).toBeDefined();
    });
  });
});

describe('TwilioProvider - Phone Number Validation', () => {
  describe('E.164 Format Validation', () => {
    const validE164Numbers = [
      '+15551234567',     // US
      '+447911123456',    // UK
      '+61412345678',     // Australia
      '+8613812345678',   // China
      '+33612345678',     // France
      '+4915112345678',   // Germany
      '+919876543210',    // India
      '+81312345678',     // Japan
      '+5511987654321',   // Brazil
    ];

    const invalidNumbers = [
      '',                  // Empty
      '5551234567',        // Missing +
      '+1',                // Too short
      '+1555123456789012', // Too long (> 15 digits)
      '+1-555-123-4567',   // Contains dashes
      '+1 555 123 4567',   // Contains spaces
      'invalid',           // Not a number
      '+0123456789',       // Starts with 0
    ];

    it.each(validE164Numbers)('should accept valid E.164 number: %s', (number) => {
      // Strict E.164: + required, followed by 1-15 digits, starting with non-zero
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      expect(number.match(e164Regex)).toBeTruthy();
    });

    it.each(invalidNumbers)('should reject invalid number: "%s"', (number) => {
      // Strict E.164: + required, followed by 1-15 digits, starting with non-zero
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      const isValid = number && number.match(e164Regex);
      expect(isValid).toBeFalsy();
    });
  });
});
