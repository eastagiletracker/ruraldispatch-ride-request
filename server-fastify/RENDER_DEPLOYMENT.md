# Render Deployment Guide - Fastify Server

Complete guide for deploying the Fastify + PostgreSQL backend to Render in a monorepo setup.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Methods](#deployment-methods)
3. [Method 1: Blueprint (render.yaml)](#method-1-blueprint-renderyaml)
4. [Method 2: Dashboard Configuration](#method-2-dashboard-configuration)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [Post-Deployment](#post-deployment)
8. [Monitoring & Logs](#monitoring--logs)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **GitHub repository** with your monorepo pushed
- **Render account** (free tier available)
- **Environment variables** ready (see [.env.example](/.env.example))
- **SMS provider credentials** (Twilio and/or Vonage)
- **Google Maps API key** for geocoding

---

## Deployment Methods

Choose one of the following methods:

### **Method 1: Blueprint (render.yaml)** ✅ Recommended
- Infrastructure as code
- Automated deployment
- Easy to version control
- See root `render.yaml` for configuration

### **Method 2: Dashboard Configuration**
- Manual setup via Render web interface
- Good for testing
- Detailed steps below

---

## Method 1: Blueprint (render.yaml)

The root `render.yaml` file includes configuration for the Fastify server with **monorepo support**.

### Key Configuration

```yaml
services:
  - type: web
    name: ride-request-fastify
    runtime: node
    rootDir: server-fastify          # ← Monorepo Root Directory
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false                   # ← Set manually in Render dashboard
      # ... other environment variables
```

### Deployment Steps

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "feat: Add Fastify server with Render config"
   git push origin main
   ```

2. **Create New Blueprint in Render**
   - Go to https://dashboard.render.com/
   - Click **New** → **Blueprint**
   - Connect your GitHub repository
   - Select the repository with `render.yaml`
   - Click **Apply**

3. **Configure Environment Variables**
   - Render will create services defined in `render.yaml`
   - Go to the `ride-request-fastify` service
   - Navigate to **Environment** tab
   - Fill in all variables marked with `sync: false`

4. **Create PostgreSQL Database**
   - Render automatically creates the database from `render.yaml`
   - Copy the **Internal Database URL**
   - Set it as `DATABASE_URL` in your service

5. **Deploy**
   - Render automatically deploys after Blueprint creation
   - Monitor the deploy logs for any errors

---

## Method 2: Dashboard Configuration

If you prefer manual setup or testing without Blueprint:

### Step 1: Create PostgreSQL Database

1. Go to **Dashboard** → **New** → **PostgreSQL**
2. Configure:
   - **Name**: `rural-dispatch-postgres`
   - **Database**: `rural_dispatch`
   - **User**: `postgres`
   - **Region**: Choose closest to your users
   - **Plan**: Free (or paid for production)
3. Click **Create Database**
4. **Copy the Internal Database URL** (format: `postgresql://...`)

### Step 2: Create Web Service

1. Go to **Dashboard** → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure the service:

#### Basic Settings
- **Name**: `ride-request-fastify`
- **Runtime**: `Node`
- **Branch**: `main` (or your deployment branch)

#### Build & Deploy Settings

**Root Directory**: ⚠️ **IMPORTANT FOR MONOREPO**
```
server-fastify
```

**Build Command**:
```bash
npm install && npx prisma generate && npm run build
```

**Start Command**:
```bash
npm run start:prod
```

#### Environment Variables

Click **Advanced** → **Add Environment Variable** for each:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `5000` | Render will override with $PORT |
| `DATABASE_URL` | *Internal DB URL* | From Step 1 |
| `CLIENT_URL` | `https://yourdomain.com` | Your frontend URL |
| `JWT_SECRET` | *Generate random* | Click "Generate" |
| `TWILIO_ACCOUNT_SID` | *Your Twilio SID* | From Twilio dashboard |
| `TWILIO_AUTH_TOKEN` | *Your auth token* | From Twilio dashboard |
| `TWILIO_PHONE_NUMBER` | `+1234567890` | Your Twilio number |
| `TWILIO_MESSAGING_SERVICE_SID` | *Service SID* | Optional but recommended |
| `TWILIO_WEBHOOK_URL` | `https://your-service.onrender.com/api/notifications/webhook/twilio` | Update after deploy |
| `TWILIO_STATUS_CALLBACK_URL` | `https://your-service.onrender.com/api/notifications/status/twilio` | Update after deploy |
| `VONAGE_API_KEY` | *Your Vonage key* | Fallback provider |
| `VONAGE_API_SECRET` | *Your Vonage secret* | Fallback provider |
| `VONAGE_FROM_NUMBER` | `+1234567890` | Vonage number |
| `VONAGE_WEBHOOK_URL` | `https://your-service.onrender.com/api/notifications/webhook/vonage` | Update after deploy |
| `GOOGLE_MAPS_API_KEY` | *Your Google API key* | For geocoding |

#### Health Check Path
```
/health
```

#### Auto-Deploy
- ✅ Enable **Auto-Deploy** to deploy on every push to `main`

4. Click **Create Web Service**

---

## Environment Variables

### Critical Variables

These **must** be set for the server to start:

```bash
NODE_ENV=production          # Required
DATABASE_URL=postgresql://   # From Render PostgreSQL
PORT=5000                    # Render overrides this
CLIENT_URL=                  # Your frontend domain
```

### SMS Provider Variables

**Twilio (Primary)**:
```bash
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_MESSAGING_SERVICE_SID=    # Optional
TWILIO_WEBHOOK_URL=              # Set after first deploy
TWILIO_STATUS_CALLBACK_URL=      # Set after first deploy
```

**Vonage (Fallback)**:
```bash
VONAGE_API_KEY=
VONAGE_API_SECRET=
VONAGE_FROM_NUMBER=
VONAGE_WEBHOOK_URL=              # Set after first deploy
```

### Optional Variables

```bash
GOOGLE_MAPS_API_KEY=             # For address autocomplete
JWT_SECRET=                      # Auto-generate in Render
```

---

## Database Setup

### Automatic Migration on Deploy

The build command includes Prisma generation:
```bash
npm install && npx prisma generate && npm run build
```

### Manual Migration (if needed)

1. **Connect to Render Shell**:
   - Go to your service → **Shell** tab
   - Run:
     ```bash
     cd server-fastify
     npx prisma migrate deploy
     ```

2. **Seed Database** (optional):
   ```bash
   npm run db:seed
   ```

### Database Access

- **Internal URL**: Use this in `DATABASE_URL` (private network)
- **External URL**: For local client connections (e.g., TablePlus)
- **Connection Pooling**: Render PostgreSQL includes pgBouncer

---

## Post-Deployment

### 1. Verify Health Check

Visit your service URL:
```
https://your-service.onrender.com/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2025-11-21T12:00:00.000Z",
  "environment": "production"
}
```

### 2. Update Webhook URLs

After your service is deployed, update these environment variables with your actual Render URL:

```bash
TWILIO_WEBHOOK_URL=https://your-service.onrender.com/api/notifications/webhook/twilio
TWILIO_STATUS_CALLBACK_URL=https://your-service.onrender.com/api/notifications/status/twilio
VONAGE_WEBHOOK_URL=https://your-service.onrender.com/api/notifications/webhook/vonage
```

### 3. Configure Twilio Webhooks

In Twilio Console:
1. Go to **Messaging** → **Services** → Select your Messaging Service
2. Set **Inbound Settings**:
   - **Request URL**: `https://your-service.onrender.com/api/notifications/webhook/twilio`
   - **Method**: `POST`
3. Set **Status Callback URL**:
   - **URL**: `https://your-service.onrender.com/api/notifications/status/twilio`

### 4. Configure Vonage Webhooks

In Vonage Dashboard:
1. Go to **API Settings**
2. Set **Default SMS Webhook**:
   - **Inbound Messages**: `https://your-service.onrender.com/api/notifications/webhook/vonage`
   - **Method**: `POST`

### 5. Test SMS Flow

Send a test ride notification:
```bash
curl -X POST https://your-service.onrender.com/api/riderequests \
  -H "Content-Type: application/json" \
  -H "x-user-uuid: your-admin-uuid" \
  -H "x-user-role: admin" \
  -d '{...}'
```

---

## Monitoring & Logs

### View Logs

**Via Dashboard**:
- Go to your service → **Logs** tab
- Live tail: `tail -f`

**Via Render CLI**:
```bash
render logs -f ride-request-fastify
```

### Metrics

Render provides:
- **CPU Usage**
- **Memory Usage**
- **Request Count**
- **Response Time**

Access via **Metrics** tab in your service.

### Alerts

Set up alerts for:
- Service downtime
- High error rates
- Memory/CPU spikes

---

## Troubleshooting

### Build Failures

**Error**: `Cannot find module 'prisma'`
- **Fix**: Ensure `npx prisma generate` is in build command
- Check Prisma schema path is correct

**Error**: `rootDir not found`
- **Fix**: Verify `rootDir: server-fastify` is set correctly
- Check directory name matches exactly

### Runtime Errors

**Error**: `Cannot connect to database`
- **Fix**: Verify `DATABASE_URL` is set correctly
- Use **Internal Database URL** (not external)
- Check database is running

**Error**: `bcrypt.compare is not a function`
- **Fix**: Already resolved with default import
- Verify build succeeded with latest code

**Error**: `Port already in use`
- **Fix**: Render overrides `PORT` automatically
- Don't hardcode port in start command

### SMS Issues

**Error**: Webhooks not receiving messages
- **Fix**: Verify webhook URLs are publicly accessible
- Check Render service is not sleeping (free tier)
- Test with `curl` from external network

**Error**: Messages not sending
- **Fix**: Verify Twilio/Vonage credentials
- Check SMS provider account balance
- Review notification service logs

### Performance Issues

**Slow Response Times**:
- Upgrade from Free tier (spins down after inactivity)
- Enable connection pooling (Render PostgreSQL default)
- Review Pino logs for slow queries

**Memory Issues**:
- Check for memory leaks with `process.memoryUsage()`
- Upgrade instance size if needed
- Review scheduled tasks cleanup

---

## Production Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] `NODE_ENV=production` configured
- [ ] Database migrations applied
- [ ] Database seeded with system users
- [ ] Health check returning 200 OK
- [ ] Webhook URLs updated in SMS providers
- [ ] Test SMS sending and receiving
- [ ] Test interactive SMS responses (1=Yes, 2=No, 3=Cancel)
- [ ] Frontend `CLIENT_URL` matches production domain
- [ ] CORS configured for frontend domain
- [ ] Monitoring and alerts enabled
- [ ] Backup strategy for PostgreSQL database
- [ ] Review Pino logs for errors
- [ ] Load testing completed (optional)

---

## Additional Resources

- **Render Docs**: https://render.com/docs
- **Render Blueprints**: https://render.com/docs/infrastructure-as-code
- **Prisma on Render**: https://render.com/docs/deploy-prisma
- **Fastify Production**: https://fastify.dev/docs/latest/Guides/Getting-Started/#production-deployment
- **PostgreSQL Connection Pooling**: https://render.com/docs/databases#connection-pooling

---

## Support

- **Render Support**: https://render.com/support
- **Project Issues**: [GitHub Issues](https://github.com/yourusername/ride-request-mvp/issues)

---

**Status**: Ready for deployment ✅
**Last Updated**: 2025-11-21
