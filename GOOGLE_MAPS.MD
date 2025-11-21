The issue is that your current API key has HTTP referrer restrictions which only work in browsers. The Distance Matrix API needs to be called from the server, which requires either:

No restrictions (not recommended for production)
IP address restrictions (recommended for server-side APIs)
Quick Fix Options:
Option 1: Remove Restrictions Temporarily (for testing)
Go to Google Cloud Credentials
Click on your API key
Under "API restrictions", select "Don't restrict key"
Click Save
Wait 5 minutes for changes to propagate
Restart your server: bun run dev
Option 2: Create a Separate Server-Side API Key (recommended)
Go to Google Cloud Credentials
Click "+ CREATE CREDENTIALS" → "API key"
Click "RESTRICT KEY"
Under "Application restrictions":
Select "IP addresses"
Add your server IP (or 0.0.0.0/0 for development)
Under "API restrictions":
Select "Restrict key"
Check: Distance Matrix API, Directions API
Click Save
Copy the new key
Update .env: GOOGLE_MAPS_SERVER_API_KEY='your-new-key'
Restart server: bun run dev
The server code is already updated to use GOOGLE_MAPS_SERVER_API_KEY first, falling back to the client key.