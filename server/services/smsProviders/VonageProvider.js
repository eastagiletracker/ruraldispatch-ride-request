const vonageConfig = require('../../config/vonage');

/**
 * Vonage SMS Provider
 * Implements SMS functionality using Vonage API
 */
class VonageProvider {
  constructor() {
    this.client = vonageConfig.client;
    this.fromNumber = vonageConfig.fromNumber;
  }

  /**
   * Send SMS via Vonage
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

      // Validate from number
      if (!this.fromNumber) {
        throw new Error('VONAGE_FROM_NUMBER is not configured');
      }

      const from = this.fromNumber;
      const text = message;

      console.log(`📤 Sending SMS via Vonage from ${from} to ${to}`);

      // Send SMS using Vonage SDK (v3+ uses promises directly)
      const response = await this.client.sms.send({ to, from, text });

      console.log('📥 Vonage response received:', JSON.stringify(response, null, 2));

      // Check if message was sent successfully
      if (response.messages && response.messages[0]) {
        const msg = response.messages[0];

        if (msg.status === '0') {
          console.log(`✅ SMS sent successfully via Vonage to ${to}. Message ID: ${msg['message-id']}`);

          return {
            success: true,
            provider: 'vonage',
            messageSid: msg['message-id'],
            to: to,
            body: message,
            status: 'sent',
            timestamp: new Date()
          };
        } else {
          console.error(`❌ Vonage message status not 0: ${msg.status} - ${msg['error-text']}`);
          throw new Error(`Vonage error: ${msg['error-text']}`);
        }
      }

      console.error('❌ Invalid response structure from Vonage:', response);
      throw new Error('Invalid response from Vonage');
    } catch (error) {
      console.error(`Failed to send SMS via Vonage to ${to}:`, error.message);

      return {
        success: false,
        provider: 'vonage',
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
    return 'vonage';
  }

  /**
   * Check if provider is configured
   */
  isConfigured() {
    return !!(
      process.env.VONAGE_API_KEY &&
      process.env.VONAGE_API_SECRET &&
      process.env.VONAGE_FROM_NUMBER
    );
  }
}

module.exports = VonageProvider;
