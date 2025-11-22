import type { Vonage } from '@vonage/server-sdk';
import { env } from '../../config/env.js';
import { vonageConfig } from '../../config/vonage.js';
import type { SMSResult } from '../../types/sms.types.js';

/**
 * Vonage SMS Provider
 * Implements SMS functionality using Vonage API
 */
export class VonageProvider {
  private client: Vonage | null;
  private fromNumber: string | undefined;

  constructor() {
    if (!vonageConfig) {
      console.warn('�  Vonage is not configured');
      this.client = null;
      this.fromNumber = undefined;
      return;
    }

    this.client = vonageConfig.client;
    this.fromNumber = vonageConfig.fromNumber;
  }

  /**
   * Send SMS via Vonage
   */
  async sendSMS(to: string, message: string): Promise<SMSResult> {
    try {
      if (!this.client) {
        throw new Error('Vonage client is not configured');
      }

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

      console.log(`=� Sending SMS via Vonage from ${from} to ${to}`);

      // Send SMS using Vonage SDK (v3+ uses promises directly)
      const response = await this.client.sms.send({ to, from, text });

      console.log('=� Vonage response received:', JSON.stringify(response, null, 2));

      // Check if message was sent successfully
      if (response.messages && response.messages[0]) {
        const msg = response.messages[0];

        if (msg.status === '0') {
          console.log(
            ` SMS sent successfully via Vonage to ${to}. Message ID: ${msg['message-id']}`
          );

          return {
            success: true,
            provider: 'vonage',
            messageSid: msg['message-id'],
            messageId: msg['message-id'],
            to,
            body: message,
            status: 'sent',
            timestamp: new Date(),
          };
        }

        const errorText = (msg as any).errorText || (msg as any)['error-text'] || 'Unknown error';
        console.error(`❌ Vonage message status not 0: ${msg.status} - ${errorText}`);
        throw new Error(`Vonage error: ${errorText}`);
      }

      console.error('L Invalid response structure from Vonage:', response);
      throw new Error('Invalid response from Vonage');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to send SMS via Vonage to ${to}:`, errorMessage);

      return {
        success: false,
        provider: 'vonage',
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
    return 'vonage';
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return (
      Boolean(env.VONAGE_API_KEY) &&
      Boolean(env.VONAGE_API_SECRET) &&
      Boolean(env.VONAGE_FROM_NUMBER)
    );
  }
}
