const VonageProvider = require('./VonageProvider');
const TwilioProvider = require('./TwilioProvider');

/**
 * SMS Provider Manager
 * Manages multiple SMS providers with fallback support
 * Primary: Twilio, Fallback: Vonage
 */
class SMSProviderManager {
  constructor() {
    this.vonageProvider = new VonageProvider();
    this.twilioProvider = new TwilioProvider();

    // Determine which providers are configured
    this.vonageConfigured = this.vonageProvider.isConfigured();
    this.twilioConfigured = this.twilioProvider.isConfigured();

    console.log('SMS Provider Configuration:');
    console.log(`  Twilio: ${this.twilioConfigured ? 'Configured' : 'Not Configured'}`);
    console.log(`  Vonage: ${this.vonageConfigured ? 'Configured' : 'Not Configured'}`);

    // Set primary and fallback providers
    this.primaryProvider = this.twilioConfigured ? this.twilioProvider : null;
    this.fallbackProvider = this.vonageConfigured ? this.vonageProvider : null;

    if (this.primaryProvider) {
      console.log(`Primary SMS Provider: ${this.primaryProvider.getName()}`);
    }
    if (this.fallbackProvider && this.primaryProvider) {
      console.log(`Fallback SMS Provider: ${this.fallbackProvider.getName()}`);
    }

    if (!this.primaryProvider && !this.fallbackProvider) {
      console.warn('⚠️  No SMS providers are configured!');
    }
  }

  /**
   * Send SMS with automatic fallback
   * Tries primary provider first, falls back to secondary if it fails
   * @param {string} to - Recipient phone number
   * @param {string} message - SMS message body
   * @returns {Promise<object>} Result object
   */
  async sendSMS(to, message) {
    // Check if any provider is configured
    if (!this.primaryProvider && !this.fallbackProvider) {
      console.error('No SMS providers configured');
      return {
        success: false,
        error: 'No SMS providers configured',
        to: to,
        body: message,
        timestamp: new Date()
      };
    }

    // Try primary provider (Twilio)
    if (this.primaryProvider) {
      console.log(`Attempting to send SMS via ${this.primaryProvider.getName()} (primary)`);
      const result = await this.primaryProvider.sendSMS(to, message);

      if (result.success) {
        return result;
      }

      console.warn(`Primary provider ${this.primaryProvider.getName()} failed: ${result.error}`);

      // If primary fails and we have a fallback, try it
      if (this.fallbackProvider) {
        console.log(`Falling back to ${this.fallbackProvider.getName()}`);
        const fallbackResult = await this.fallbackProvider.sendSMS(to, message);

        if (fallbackResult.success) {
          fallbackResult.fallbackUsed = true;
          fallbackResult.primaryError = result.error;
        }

        return fallbackResult;
      }

      // No fallback available
      return result;
    }

    // If no primary provider, use fallback as primary
    if (this.fallbackProvider) {
      console.log(`Using ${this.fallbackProvider.getName()} (no primary configured)`);
      return await this.fallbackProvider.sendSMS(to, message);
    }

    // Should never reach here
    return {
      success: false,
      error: 'No SMS provider available',
      to: to,
      body: message,
      timestamp: new Date()
    };
  }

  /**
   * Get current provider status
   */
  getStatus() {
    return {
      twilio: {
        configured: this.twilioConfigured,
        isPrimary: this.primaryProvider?.getName() === 'twilio'
      },
      vonage: {
        configured: this.vonageConfigured,
        isFallback: this.fallbackProvider?.getName() === 'vonage'
      }
    };
  }

  /**
   * Force send via specific provider (for testing)
   * @param {string} providerName - 'vonage' or 'twilio'
   * @param {string} to - Recipient phone number
   * @param {string} message - SMS message body
   */
  async sendViaProvider(providerName, to, message) {
    const provider = providerName === 'vonage' ? this.vonageProvider : this.twilioProvider;

    if (!provider.isConfigured()) {
      return {
        success: false,
        error: `${providerName} is not configured`,
        to: to,
        body: message,
        timestamp: new Date()
      };
    }

    return await provider.sendSMS(to, message);
  }
}

module.exports = SMSProviderManager;
