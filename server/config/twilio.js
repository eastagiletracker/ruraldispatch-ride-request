const twilio = require('twilio');

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const twilioConfig = {
  client: twilioClient,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  webhookUrl: process.env.TWILIO_WEBHOOK_URL
};

module.exports = twilioConfig;
