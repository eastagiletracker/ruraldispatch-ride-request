import twilio, { Twilio } from 'twilio';
import { env, smsConfig } from './env.js';

export interface TwilioConfig {
  client: Twilio;
  phoneNumber?: string;
  messagingServiceSid?: string;
  webhookUrl?: string;
  statusCallbackUrl?: string;
  disableStatusCallback?: boolean;
}

/**
 * Initialize Twilio client and configuration
 * Returns null if Twilio credentials are not configured
 */
export function createTwilioConfig(): TwilioConfig | null {
  if (!smsConfig.hasTwilio) {
    console.warn('⚠️  Twilio is not configured (missing ACCOUNT_SID or AUTH_TOKEN)');
    return null;
  }

  const client = twilio(env.TWILIO_ACCOUNT_SID!, env.TWILIO_AUTH_TOKEN!);

  return {
    client,
    phoneNumber: env.TWILIO_PHONE_NUMBER,
    messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
    webhookUrl: env.TWILIO_WEBHOOK_URL,
    statusCallbackUrl: env.TWILIO_STATUS_CALLBACK_URL,
    disableStatusCallback: env.TWILIO_DISABLE_STATUS_CALLBACK === 'true',
  };
}

/**
 * Singleton Twilio configuration
 */
export const twilioConfig = createTwilioConfig();
