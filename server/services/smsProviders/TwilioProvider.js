const twilioConfig = require('../../config/twilio');

/**
 * Twilio SMS Provider
 * Implements SMS functionality using Twilio API
 */
class TwilioProvider {
  constructor() {
    this.client = twilioConfig.client;
    this.fromNumber = twilioConfig.phoneNumber;
    this.messagingServiceSid = twilioConfig.messagingServiceSid;
  }

  /**
   * Send SMS via Twilio
   * @param {string} to - Recipient phone number
   * @param {string} message - SMS message body
   * @returns {Promise<object>} Result object
   */
  async sendSMS(to, message) {
    try {
      // Validate phone number format
      if (!to || !to.match(/^\+?[1-9]\d{1,14}$/)) {
        throw new Error(`Invalid phone number format: ${to}`);
      }

      // Prepare message options
      const messageOptions = {
        body: message,
        to: to
      };

      // Use Messaging Service if configured, otherwise use phone number
      if (this.messagingServiceSid) {
        messageOptions.messagingServiceSid = this.messagingServiceSid;
        console.log(`Sending SMS via Twilio Messaging Service: ${this.messagingServiceSid}`);
      } else {
        messageOptions.from = this.fromNumber;
        console.log(`Sending SMS via Twilio from: ${this.fromNumber}`);
      }

      // Add status callback if webhook URL is configured
      // Note: For localhost development, use ngrok or similar tunnel service
      // to receive status callbacks from Twilio
      const statusCallbackUrl = process.env.TWILIO_STATUS_CALLBACK_URL ||
        (process.env.TWILIO_WEBHOOK_URL
          ? process.env.TWILIO_WEBHOOK_URL.replace('/webhook/twilio', '/status/twilio')
                                           .replace('/webhook', '/status/twilio')
          : null);

      if (statusCallbackUrl) {
        // Only skip callback if explicitly disabled
        const isCallbackDisabled = process.env.TWILIO_DISABLE_STATUS_CALLBACK === 'true';

        if (!isCallbackDisabled) {
          messageOptions.statusCallback = statusCallbackUrl;
          console.log(`📊 Status callback set to: ${statusCallbackUrl}`);
        } else {
          console.log(`⚠️  Status callback disabled via TWILIO_DISABLE_STATUS_CALLBACK`);
        }
      } else {
        console.log(`⚠️  No status callback URL configured - delivery status won't be tracked`);
      }

      const result = await this.client.messages.create(messageOptions);

      console.log(`SMS sent successfully via Twilio. SID: ${result.sid}`);

      return {
        success: true,
        provider: 'twilio',
        messageSid: result.sid,
        to: to,
        body: message,
        status: result.status,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Failed to send SMS via Twilio to ${to}:`, error.message);

      return {
        success: false,
        provider: 'twilio',
        error: error.message,
        to: to,
        body: message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get provider name
   */
  getName() {
    return 'twilio';
  }

  /**
   * Check if provider is configured
   */
  isConfigured() {
    return !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID)
    );
  }
}

module.exports = TwilioProvider;
