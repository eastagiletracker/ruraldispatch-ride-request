require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const twilio = require('twilio');

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const twilioConfig = {
  client: twilioClient,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  webhookUrl: process.env.TWILIO_WEBHOOK_URL
};

module.exports = twilioConfig;
