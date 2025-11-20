import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { Vonage } from '@vonage/server-sdk';

// Initialize Vonage client
const vonageClient = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET
});

const vonageConfig = {
  client: vonageClient,
  fromNumber: process.env.VONAGE_FROM_NUMBER,
  webhookUrl: process.env.VONAGE_WEBHOOK_URL
};

export default vonageConfig;
