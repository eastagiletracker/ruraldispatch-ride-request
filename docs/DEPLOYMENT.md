# Deployment Guide

This application can be deployed using either Railway or Render. Choose the platform that best suits your needs.

## Option 1: Deploy to Railway (Recommended for simplicity)

Railway offers the easiest deployment with automatic environment detection.

### Setup Steps:

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add PostgreSQL Database**
   - In your Railway project, click "New"
   - Select "Database" → "Add PostgreSQL"
   - Railway will automatically set the `DATABASE_URL` environment variable

4. **Set Environment Variables**
   - Go to your service → Variables
   - Add the following:
     ```
     NODE_ENV=production
     JWT_SECRET=your-super-secret-jwt-key-change-this
     
     # Twilio Configuration (Primary SMS Provider)
     TWILIO_ACCOUNT_SID=your-twilio-sid
     TWILIO_AUTH_TOKEN=your-twilio-token
     TWILIO_PHONE_NUMBER=your-twilio-number
     TWILIO_MESSAGING_SERVICE_SID=your-messaging-service-sid (optional)
     TWILIO_WEBHOOK_URL=https://your-app.up.railway.app/api/notifications/webhook
     
     # Vonage Configuration (Fallback SMS Provider)
     VONAGE_API_KEY=your-vonage-api-key
     VONAGE_API_SECRET=your-vonage-api-secret
     VONAGE_FROM_NUMBER=your-vonage-number
     VONAGE_WEBHOOK_URL=https://your-app.up.railway.app/api/notifications/webhook/vonage
     
     # Google Maps API Configuration
     VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
     ```

5. **Configure GitHub Actions (Optional)**
   - Get your Railway token: Settings → Tokens → Create Token
   - Add to GitHub Secrets:
     - `RAILWAY_TOKEN`: Your Railway token
     - `RAILWAY_SERVICE_NAME`: Your service name (optional)

6. **Deploy**
   - Railway auto-deploys on push to main
   - Or use GitHub Actions workflow: `.github/workflows/deploy-railway.yml`

### Railway CLI (Alternative)

```bash
# Install Railway CLI
bun add -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway up
```

---

## Option 2: Deploy to Render

Render provides excellent free tier options and good PostgreSQL support.

### Setup Steps:

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: ride-request-app
     - **Environment**: Node
     - **Build Command**: `bun install && bun run build && bunx prisma generate && bunx prisma migrate deploy`
     - **Start Command**: `bun start`
     - **Plan**: Free (or paid for better performance)

3. **Add PostgreSQL Database**
   - In Render dashboard, click "New +" → "PostgreSQL"
   - Choose Free tier or paid plan
   - Get "Internal Database URL" from database dashboard

4. **Set Environment Variables**
   - In Render dashboard → Environment
   - Add:
     ```
     NODE_ENV=production
     DATABASE_URL=your-postgresql-connection-string
     JWT_SECRET=your-super-secret-jwt-key-change-this
     
     # Twilio Configuration (Primary SMS Provider)
     TWILIO_ACCOUNT_SID=your-twilio-sid
     TWILIO_AUTH_TOKEN=your-twilio-token
     TWILIO_PHONE_NUMBER=your-twilio-number
     TWILIO_MESSAGING_SERVICE_SID=your-messaging-service-sid (optional)
     TWILIO_WEBHOOK_URL=https://your-app.onrender.com/api/notifications/webhook
     
     # Vonage Configuration (Fallback SMS Provider)
     VONAGE_API_KEY=your-vonage-api-key
     VONAGE_API_SECRET=your-vonage-api-secret
     VONAGE_FROM_NUMBER=your-vonage-number
     VONAGE_WEBHOOK_URL=https://your-app.onrender.com/api/notifications/webhook/vonage
     
     # Google Maps API Configuration
     VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
     ```

5. **Configure GitHub Actions (Optional)**
   - Get Deploy Hook URL: Settings → Deploy Hook
   - Add to GitHub Secrets:
     - `RENDER_DEPLOY_HOOK_URL`: Your deploy hook URL

6. **Deploy**
   - Render auto-deploys on push to main
   - Or manually trigger from dashboard
   - Or use GitHub Actions: `.github/workflows/deploy-render.yml`

---

## Environment Variables Reference

Required for both platforms:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT tokens | Generate with: `openssl rand -base64 32` |
| `PORT` | Server port (auto-set on most platforms) | `5000` |

### Twilio Configuration (Primary SMS Provider):

| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | From Twilio dashboard |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | From Twilio dashboard |
| `TWILIO_PHONE_NUMBER` | Twilio Phone Number | Format: `+1234567890` |
| `TWILIO_MESSAGING_SERVICE_SID` | Twilio Messaging Service SID (optional) | Alternative to phone number |
| `TWILIO_WEBHOOK_URL` | Webhook URL for inbound SMS | `https://your-app.com/api/notifications/webhook` |

### Vonage Configuration (Fallback SMS Provider):

| Variable | Description | Example |
|----------|-------------|---------|
| `VONAGE_API_KEY` | Vonage API Key | From Vonage dashboard |
| `VONAGE_API_SECRET` | Vonage API Secret | From Vonage dashboard |
| `VONAGE_FROM_NUMBER` | Vonage Sender ID | Format: `+1234567890` or alphanumeric |
| `VONAGE_WEBHOOK_URL` | Webhook URL for inbound SMS | `https://your-app.com/api/notifications/webhook/vonage` |

### Google Maps Configuration:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API Key | Get from [Google Cloud Console](https://console.cloud.google.com/google/maps-apis) |

**Note**: Enable the following APIs in Google Cloud Console:
- Places API (New)
- Maps JavaScript API
- Distance Matrix API (for future use)

**Note**: Configure both SMS providers for automatic fallback capability. If only one is configured, the system will use only that provider.

---

## GitHub Secrets Setup

For automated deployments via GitHub Actions:

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add the appropriate secrets based on your platform choice

### For Railway:
- `RAILWAY_TOKEN`

### For Render:
- `RENDER_DEPLOY_HOOK_URL`

---

## Local Development

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your local values

# Run database migrations
bunx prisma migrate dev

# Seed database
bun run seed

# Run development server
bun run dev

# Build for production
bun run build

# Run production server
bun start
```

---

## Troubleshooting

### Railway Issues:
- Check build logs in Railway dashboard
- Ensure all environment variables are set
- Verify DATABASE_URL connection string
- Ensure Prisma migrations run: `bunx prisma migrate deploy`

### Render Issues:
- Check deploy logs
- Free tier services sleep after 15 min of inactivity (first request may be slow)
- Ensure build command includes `bunx prisma migrate deploy`
- Verify Bun is available in build environment

### Database Connection:
- Ensure PostgreSQL database is accessible from deployment platform
- Verify DATABASE_URL connection string format
- Check database user permissions
- Run migrations: `bunx prisma migrate deploy`
- For production, use connection pooling if needed

---

## Recommendations

**Choose Railway if:**
- You want the simplest setup
- You need quick deployments
- You're okay with usage-based pricing after free tier

**Choose Render if:**
- You want a generous free tier
- You need persistent storage
- You prefer predictable pricing

Both platforms offer:
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ Auto-deploy from GitHub
- ✅ Environment variable management
- ✅ Easy scaling options
