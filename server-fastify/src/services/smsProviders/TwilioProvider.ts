import type { Twilio } from 'twilio';
import { env } from '../../config/env.js';
import { twilioConfig } from '../../config/twilio.js';
import type { SMSResult } from '../../types/sms.types.js';

/**
 * Twilio SMS Provider
 * Implements SMS functionality using Twilio API
 */
export class TwilioProvider {
  private client: Twilio | null;
  private fromNumber: string | undefined;
  private messagingServiceSid: string | undefined;
  private statusCallbackUrl: string | undefined;
  private disableStatusCallback: boolean;

  constructor() {
    if (!twilioConfig) {
      console.warn('  Twilio is not configured');
      this.client = null;
      this.fromNumber = undefined;
      this.messagingServiceSid = undefined;
      this.statusCallbackUrl = undefined;
      this.disableStatusCallback = false;
      return;
    }

    this.client = twilioConfig.client;
    this.fromNumber = twilioConfig.phoneNumber;
    this.messagingServiceSid = twilioConfig.messagingServiceSid;
    this.statusCallbackUrl = twilioConfig.statusCallbackUrl;
    this.disableStatusCallback = twilioConfig.disableStatusCallback || false;
  }

  /**
   * Send SMS via Twilio
   */
  async sendSMS(to: string, message: string): Promise<SMSResult> {
    try {
      if (!this.client) {
        throw new Error('Twilio client is not configured');
      }

      // Validate phone number format
      if (!to || !to.match(/^\+?[1-9]\d{1,14}$/)) {
        throw new Error(`Invalid phone number format: ${to}`);
      }

      // Prepare message options
      const messageOptions: {
        body: string;
        to: string;
        from?: string;
        messagingServiceSid?: string;
        statusCallback?: string;
      } = {
        body: message,
        to,
      };

      // Use Messaging Service if configured, otherwise use phone number
      if (this.messagingServiceSid) {
        messageOptions.messagingServiceSid = this.messagingServiceSid;
        console.log(`Sending SMS via Twilio Messaging Service: ${this.messagingServiceSid}`);
      } else if (this.fromNumber) {
        messageOptions.from = this.fromNumber;
        console.log(`Sending SMS via Twilio from: ${this.fromNumber}`);
      } else {
        throw new Error(
          'Neither TWILIO_MESSAGING_SERVICE_SID nor TWILIO_PHONE_NUMBER is configured'
        );
      }

      // Add status callback if configured and not disabled
      if (this.statusCallbackUrl && !this.disableStatusCallback) {
        messageOptions.statusCallback = this.statusCallbackUrl;
        console.log(`= Status callback set to: ${this.statusCallbackUrl}`);
      } else if (this.disableStatusCallback) {
        console.log('  Status callback disabled via TWILIO_DISABLE_STATUS_CALLBACK');
      } else {
        console.log("  No status callback URL configured - delivery status won't be tracked");
      }

      const result = await this.client.messages.create(messageOptions);

      console.log(`SMS sent successfully via Twilio. SID: ${result.sid}`);

      return {
        success: true,
        provider: 'twilio',
        messageSid: result.sid,
        to,
        body: message,
        status: result.status,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to send SMS via Twilio to ${to}:`, errorMessage);

      return {
        success: false,
        provider: 'twilio',
        error: errorMessage,
        to,
        body: message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get provider name
   */
  getName(): string {
    return 'twilio';
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return (
      Boolean(env.TWILIO_ACCOUNT_SID) &&
      Boolean(env.TWILIO_AUTH_TOKEN) &&
      (Boolean(env.TWILIO_PHONE_NUMBER) || Boolean(env.TWILIO_MESSAGING_SERVICE_SID))
    );
  }
}
