import type { SMSProvider, SMSResult } from '../../types/sms.types.js';
import { TwilioProvider } from './TwilioProvider.js';
import { VonageProvider } from './VonageProvider.js';

interface ProviderStatus {
  configured: boolean;
  isPrimary?: boolean;
  isFallback?: boolean;
}

/**
 * SMS Provider Manager
 * Manages multiple SMS providers with fallback support
 * Primary: Twilio, Fallback: Vonage
 */
export class SMSProviderManager {
  private vonageProvider: VonageProvider;
  private twilioProvider: TwilioProvider;
  private vonageConfigured: boolean;
  private twilioConfigured: boolean;
  private primaryProvider: TwilioProvider | VonageProvider | null;
  private fallbackProvider: VonageProvider | TwilioProvider | null;

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
      console.warn('  No SMS providers are configured!');
    }
  }

  /**
   * Send SMS with automatic fallback
   * Tries primary provider first, falls back to secondary if it fails
   */
  async sendSMS(to: string, message: string): Promise<SMSResult> {
    // Check if any provider is configured
    if (!this.primaryProvider && !this.fallbackProvider) {
      console.error('No SMS providers configured');
      return {
        success: false,
        provider: 'twilio',
        error: 'No SMS providers configured',
        to,
        body: message,
        timestamp: new Date(),
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
          return {
            ...fallbackResult,
            // Add fallback metadata (non-standard fields)
            fallbackUsed: true,
            primaryError: result.error,
          } as SMSResult & { fallbackUsed: boolean; primaryError?: string };
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
      provider: 'twilio',
      error: 'No SMS provider available',
      to,
      body: message,
      timestamp: new Date(),
    };
  }

  /**
   * Get current provider status
   */
  getStatus(): { twilio: ProviderStatus; vonage: ProviderStatus } {
    return {
      twilio: {
        configured: this.twilioConfigured,
        isPrimary: this.primaryProvider?.getName() === 'twilio',
      },
      vonage: {
        configured: this.vonageConfigured,
        isFallback: this.fallbackProvider?.getName() === 'vonage',
      },
    };
  }

  /**
   * Force send via specific provider (for testing)
   */
  async sendViaProvider(
    providerName: SMSProvider,
    to: string,
    message: string
  ): Promise<SMSResult> {
    const provider = providerName === 'vonage' ? this.vonageProvider : this.twilioProvider;

    if (!provider.isConfigured()) {
      return {
        success: false,
        provider: providerName,
        error: `${providerName} is not configured`,
        to,
        body: message,
        timestamp: new Date(),
      };
    }

    return await provider.sendSMS(to, message);
  }
}
