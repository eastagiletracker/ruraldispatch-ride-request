import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod/v4';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory (shared with Express server)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Environment Variable Schema
 * Validates all required environment variables at startup
 */
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'staging', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default(5000),
  TZ: z.string().default('UTC'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),

  // JWT (optional for future use)
  JWT_SECRET: z.string().min(1).optional(),

  // Twilio SMS Provider (Primary)
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),
  TWILIO_WEBHOOK_URL: z.string().url().optional(),
  TWILIO_STATUS_CALLBACK_URL: z.string().url().optional(),
  TWILIO_DISABLE_STATUS_CALLBACK: z.string().optional(),

  // Vonage SMS Provider (Fallback)
  VONAGE_API_KEY: z.string().optional(),
  VONAGE_API_SECRET: z.string().optional(),
  VONAGE_FROM_NUMBER: z.string().optional(),
  VONAGE_WEBHOOK_URL: z.string().url().optional(),

  // Google Maps API
  GOOGLE_MAPS_SERVER_API_KEY: z.string().optional(),
  VITE_GOOGLE_MAPS_API_KEY: z.string().optional(),

  // Client URL for CORS
  CLIENT_URL: z.string().default('http://localhost:3000'),
});

/**
 * Validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * Throws error if validation fails
 */
function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Environment validation failed');
  }

  return result.data;
}

/**
 * Validated environment configuration
 */
export const env = parseEnv();

/**
 * Check if SMS providers are configured
 */
export const smsConfig = {
  hasTwilio: Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN),
  hasVonage: Boolean(env.VONAGE_API_KEY && env.VONAGE_API_SECRET),
  hasGoogleMaps: Boolean(env.GOOGLE_MAPS_SERVER_API_KEY || env.VITE_GOOGLE_MAPS_API_KEY),
};

/**
 * Validate timezone is UTC (critical for scheduler)
 */
if (env.TZ !== 'UTC') {
  console.warn('⚠️  WARNING: Server timezone is not UTC!');
  console.warn(`   Current: ${env.TZ}`);
  console.warn('   This may cause scheduling issues!');
  console.warn('   Set TZ=UTC in .env file');
}

// Log configuration status on startup
if (env.NODE_ENV === 'development') {
  console.log('🔧 Environment Configuration:');
  console.log(`   NODE_ENV: ${env.NODE_ENV}`);
  console.log(`   PORT: ${env.PORT}`);
  console.log(`   TZ: ${env.TZ}`);
  console.log(`   DATABASE_URL: ${env.DATABASE_URL ? '✅ configured' : '❌ missing'}`);
  console.log(`   Twilio: ${smsConfig.hasTwilio ? '✅ configured' : '⚠️  not configured'}`);
  console.log(`   Vonage: ${smsConfig.hasVonage ? '✅ configured' : '⚠️  not configured'}`);
  console.log(`   Google Maps: ${smsConfig.hasGoogleMaps ? '✅ configured' : '⚠️  not configured'}`);
}
