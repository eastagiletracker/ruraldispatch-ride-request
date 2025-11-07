# SMS Provider Setup Guide

This application supports multiple SMS providers with automatic fallback:
- **Primary Provider**: Twilio
- **Fallback Provider**: Vonage

## Architecture

The system uses a provider abstraction layer that automatically:
1. Attempts to send SMS via Twilio (primary)
2. Falls back to Vonage if Twilio fails
3. Handles webhooks for both providers
4. Tracks delivery status from both providers

## Setup Instructions

### Option 1: Twilio + Vonage (Recommended)

Configure both providers for maximum reliability:

```bash
# Twilio Configuration (Primary)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid
TWILIO_WEBHOOK_URL=https://yourdomain.com/api/notifications/webhook/twilio

# Vonage Configuration (Fallback)
VONAGE_API_KEY=your_vonage_api_key
VONAGE_API_SECRET=your_vonage_api_secret
VONAGE_FROM_NUMBER=YourBrandName  # Can be alphanumeric (e.g., "RideApp")
VONAGE_WEBHOOK_URL=https://yourdomain.com/api/notifications/webhook/vonage
```

### Option 2: Twilio Only

Configure only Twilio (no fallback):

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid
TWILIO_WEBHOOK_URL=https://yourdomain.com/api/notifications/webhook/twilio
```

### Option 3: Vonage Only

Configure only Vonage (backward compatible):

```bash
# Vonage Configuration
VONAGE_API_KEY=your_vonage_api_key
VONAGE_API_SECRET=your_vonage_api_secret
VONAGE_FROM_NUMBER=YourBrandName
VONAGE_WEBHOOK_URL=https://yourdomain.com/api/notifications/webhook/vonage
```

## Getting Started

### 1. Twilio Setup

1. **Create Account**: Sign up at [Twilio Console](https://console.twilio.com/)
2. **Get Phone Number**:
   - Go to "Phone Numbers" → "Buy a Number"
   - Select a number with SMS capability
3. **Get Credentials**:
   - Account SID and Auth Token from dashboard
4. **Configure Webhooks**:
   - Go to your phone number settings
   - SMS Configuration:
     - Webhook URL: `https://yourdomain.com/api/notifications/webhook/twilio`
     - HTTP Method: POST

### 2. Vonage Setup (Optional Fallback)

1. **Create Account**: Sign up at [Vonage Dashboard](https://dashboard.nexmo.com/)
2. **Get API Credentials**:
   - Go to "Settings" → "API Settings"
   - Copy your API Key and API Secret
3. **Configure Sender ID**:
   - For most countries, you can use alphanumeric sender (e.g., "RideApp")
   - For US/Canada, you need to rent a long code/short code
4. **Set Up Webhooks**:
   - Go to "Settings" → "Default SMS Settings"
   - Inbound Messages URL: `https://yourdomain.com/api/notifications/webhook/vonage`
   - Delivery Receipts URL: `https://yourdomain.com/api/notifications/status/vonage`

## Webhook Endpoints

The application provides dedicated webhook endpoints for each provider:

### Vonage Webhooks
- Inbound SMS: `POST /api/notifications/webhook/vonage`
- Delivery Receipt: `POST /api/notifications/status/vonage`

### Twilio Webhooks
- Inbound SMS: `POST /api/notifications/webhook/twilio`
- Status Callback: `POST /api/notifications/status/twilio`

### Legacy Endpoints (Backward Compatible)
- Inbound SMS: `POST /api/notifications/webhook` (defaults to Twilio format)
- Status Callback: `POST /api/notifications/status` (defaults to Twilio format)

## API Endpoints

### Check Provider Status
```bash
GET /api/notifications/provider-status

Response:
{
  "success": true,
  "status": {
    "twilio": {
      "configured": true,
      "isPrimary": true
    },
    "vonage": {
      "configured": true,
      "isFallback": true
    }
  }
}
```

## How It Works

### Sending SMS

1. **Notification Service** calls `sendSMS(to, message)`
2. **SMS Provider Manager** attempts to send via Twilio (primary)
3. If Twilio fails, automatically falls back to Vonage
4. Returns result with provider information

```javascript
// Example result
{
  success: true,
  provider: 'twilio',
  messageSid: 'abc123',
  to: '+1234567890',
  body: 'Your ride has been accepted!',
  status: 'sent',
  timestamp: '2025-01-05T12:00:00Z'
}
```

### Receiving SMS

Both providers send incoming SMS to their respective webhook endpoints:
- Vonage: `/api/notifications/webhook/vonage`
- Twilio: `/api/notifications/webhook/twilio`

The system stores all incoming messages in the database for dispatcher review.

### Delivery Tracking

Both providers send delivery receipts to their respective status endpoints:
- Vonage: `/api/notifications/status/vonage`
- Twilio: `/api/notifications/status/twilio`

Status updates are stored in the database and linked to the original message.

## Testing

### Test Sending SMS

You can test the provider by triggering a ride status change that sends SMS notifications:

1. Create a ride request
2. Assign a driver
3. Update ride status to trigger notifications

Check the server logs to see which provider was used:
```
SMS Provider Configuration:
  Twilio: Configured
  Vonage: Configured
Primary SMS Provider: twilio
Fallback SMS Provider: vonage

Attempting to send SMS via twilio (primary)
SMS sent successfully via Twilio. SID: abc123
```

### Test Webhooks Locally

Use ngrok to expose your local server:

```bash
# Start ngrok
ngrok http 5000

# Update webhook URLs in provider dashboards
# Vonage: https://your-ngrok-url.ngrok.io/api/notifications/webhook/vonage
# Twilio: https://your-ngrok-url.ngrok.io/api/notifications/webhook/twilio
```

## Provider Comparison

| Feature | Twilio | Vonage |
|---------|--------|--------|
| Alphanumeric Sender ID | ❌ No (US/CA) | ✅ Yes (most countries) |
| Pricing | Higher | Generally lower |
| Global Coverage | Excellent | Excellent |
| API Complexity | More features | Simple |
| Delivery Rates | High | High |
| Reliability | Excellent | Good |

## Troubleshooting

### Vonage Issues

**Error: "Invalid API Key"**
- Check that `VONAGE_API_KEY` and `VONAGE_API_SECRET` are correct
- Ensure no extra spaces in environment variables

**SMS not sending**
- Verify phone number format (E.164: +1234567890)
- Check Vonage account balance
- Review sender ID restrictions for destination country

### Twilio Issues

**Error: "Invalid credentials"**
- Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
- Check if credentials are from the correct project

**SMS not sending**
- Ensure phone number or messaging service SID is configured
- Verify phone number is verified (for trial accounts)
- Check account balance

### General Issues

**No SMS sent at all**
- Check server logs for configuration status
- Verify at least one provider is configured
- Test provider status endpoint: `GET /api/notifications/provider-status`

**Webhooks not working**
- Ensure webhook URLs are publicly accessible (not localhost)
- Check that webhook endpoints return correct status codes
- Verify webhook URLs in provider dashboards are correct

## Security Notes

1. **Environment Variables**: Never commit actual credentials to git
2. **Webhook Validation**: Consider adding signature validation for webhooks
3. **Rate Limiting**: Implement rate limiting on SMS endpoints
4. **Phone Number Validation**: All phone numbers are validated before sending

## Support

- **Vonage Documentation**: https://developer.vonage.com/
- **Twilio Documentation**: https://www.twilio.com/docs/
- **Issues**: Report bugs in the project repository
