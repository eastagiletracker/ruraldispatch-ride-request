require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Vonage } = require('@vonage/server-sdk');

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

module.exports = vonageConfig;
