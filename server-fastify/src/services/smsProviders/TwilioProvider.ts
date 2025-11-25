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
   * Schedule SMS to be sent at a specific time (Twilio Messaging Service only)
   * @param to - Recipient phone number
   * @param message - Message body
   * @param sendAt - ISO 8601 datetime when message should be sent (must be within 7 days)
   * @returns SMS result with scheduled message SID
   */
  async scheduleScheduledSMS(to: string, message: string, sendAt: string): Promise<SMSResult> {
    console.log('\n📅 ===== SCHEDULING SMS VIA TWILIO =====');
    console.log(`📱 To: ${to}`);
    console.log(`📝 Message: ${message.substring(0, 50)}...`);
    console.log(`⏰ Send at (ISO): ${sendAt}`);

    try {
      if (!this.client) {
        throw new Error('Twilio client is not configured');
      }

      if (!this.messagingServiceSid) {
        throw new Error('Twilio Messaging Service SID is required for scheduling messages');
      }

      // Validate phone number format
      if (!to || !to.match(/^\+?[1-9]\d{1,14}$/)) {
        throw new Error(`Invalid phone number format: ${to}`);
      }

      // Validate sendAt is in the future and within 7 days
      const sendAtDate = new Date(sendAt);
      const now = new Date();
      const maxScheduleDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      console.log(`⏰ Current time: ${now.toISOString()}`);
      console.log(`⏰ Scheduled time: ${sendAtDate.toISOString()}`);
      console.log(`⏰ Max allowed: ${maxScheduleDate.toISOString()}`);
      console.log(`⏰ Minutes until send: ${Math.round((sendAtDate.getTime() - now.getTime()) / 60000)}`);

      if (sendAtDate <= now) {
        throw new Error('sendAt must be in the future');
      }

      if (sendAtDate > maxScheduleDate) {
        throw new Error('sendAt must be within 7 days from now');
      }

      // Prepare scheduled message options
      const messageOptions: {
        body: string;
        to: string;
        messagingServiceSid: string;
        scheduleType: 'fixed';
        sendAt: Date;
        statusCallback?: string;
      } = {
        body: message,
        to,
        messagingServiceSid: this.messagingServiceSid,
        scheduleType: 'fixed',
        sendAt: sendAtDate,
      };

      // Add status callback if configured and not disabled
      if (this.statusCallbackUrl && !this.disableStatusCallback) {
        messageOptions.statusCallback = this.statusCallbackUrl;
        console.log(`📞 Status callback set to: ${this.statusCallbackUrl}`);
      } else {
        console.log('⚠️  No status callback configured');
      }

      console.log('\n📤 Calling Twilio API to schedule message...');
      console.log('📋 Message options:', JSON.stringify({
        to: messageOptions.to,
        messagingServiceSid: messageOptions.messagingServiceSid,
        scheduleType: messageOptions.scheduleType,
        sendAt: messageOptions.sendAt.toISOString(),
        hasStatusCallback: !!messageOptions.statusCallback,
      }, null, 2));

      const result = await this.client.messages.create(messageOptions);

      console.log('\n✅ SMS SCHEDULED SUCCESSFULLY!');
      console.log(`📋 Message SID: ${result.sid}`);
      console.log(`📊 Status: ${result.status}`);
      console.log(`⏰ Scheduled for: ${sendAtDate.toISOString()}`);
      console.log(`🔗 Twilio Console: https://console.twilio.com/us1/monitor/logs/sms/${result.sid}`);

      return {
        success: true,
        provider: 'twilio',
        messageSid: result.sid,
        to,
        body: message,
        status: result.status, // Should be 'scheduled' or 'accepted'
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to schedule SMS via Twilio to ${to}:`, errorMessage);

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
   * Cancel a scheduled message
   * @param messageSid - The SID of the scheduled message to cancel
   * @returns Success status
   */
  async cancelScheduledSMS(messageSid: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.client) {
        throw new Error('Twilio client is not configured');
      }

      // Update message status to 'canceled'
      await this.client.messages(messageSid).update({ status: 'canceled' });

      console.log(`🚫 Successfully canceled scheduled message: ${messageSid}`);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to cancel scheduled message ${messageSid}:`, errorMessage);

      return {
        success: false,
        error: errorMessage,
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
