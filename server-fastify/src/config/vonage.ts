import { Vonage } from '@vonage/server-sdk';
import { env, smsConfig } from './env.js';

export interface VonageConfig {
  client: Vonage;
  fromNumber?: string;
  webhookUrl?: string;
}

/**
 * Initialize Vonage client and configuration
 * Returns null if Vonage credentials are not configured
 */
export function createVonageConfig(): VonageConfig | null {
  if (!smsConfig.hasVonage) {
    console.warn('⚠️  Vonage is not configured (missing API_KEY or API_SECRET)');
    return null;
  }

  const client = new Vonage({
    apiKey: env.VONAGE_API_KEY!,
    apiSecret: env.VONAGE_API_SECRET!,
  });

  return {
    client,
    fromNumber: env.VONAGE_FROM_NUMBER,
    webhookUrl: env.VONAGE_WEBHOOK_URL,
  };
}

/**
 * Singleton Vonage configuration
 */
export const vonageConfig = createVonageConfig();
