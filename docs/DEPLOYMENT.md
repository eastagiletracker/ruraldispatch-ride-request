# Deployment Guide

Complete guide for deploying Rural Dispatch to production. Choose between Railway or Render platforms.

## 📋 Table of Contents

- [Overview](#overview)
- [Option 1: Deploy to Railway](#option-1-deploy-to-railway)
- [Option 2: Deploy to Render](#option-2-deploy-to-render)
- [Render Blueprint (Staging + Production)](#render-blueprint-staging--production)
- [Client Deployment](#client-deployment)
- [Database Setup](#database-setup)
- [Environment Variables Reference](#environment-variables-reference)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Troubleshooting](#troubleshooting)

---

## Overview

The application consists of:
- **Frontend**: React + Vite static site
- **Backend**: Fastify + TypeScript server
- **Database**: PostgreSQL with Prisma ORM

### Monorepo Structure
```
ruraldispatch-ride-request/
├── client/           # React frontend (rootDir for static site)
├── server-fastify/   # Fastify backend (rootDir for web service)
├── shared/           # Shared Zod schemas
└── prisma/           # Database schema and migrations
```

---

## Option 1: Deploy to Railway

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
     ```bash
     NODE_ENV=production
     JWT_SECRET=your-super-secret-jwt-key-change-this
     
     # Twilio Configuration (Primary SMS Provider)
     TWILIO_ACCOUNT_SID=your-twilio-sid
     TWILIO_AUTH_TOKEN=your-twilio-token
     TWILIO_PHONE_NUMBER=your-twilio-number
     TWILIO_MESSAGING_SERVICE_SID=your-messaging-service-sid
     TWILIO_WEBHOOK_URL=https://your-app.up.railway.app/api/notifications/webhook/twilio
     
     # Vonage Configuration (Fallback SMS Provider)
     VONAGE_API_KEY=your-vonage-api-key
     VONAGE_API_SECRET=your-vonage-api-secret
     VONAGE_FROM_NUMBER=your-vonage-number
     VONAGE_WEBHOOK_URL=https://your-app.up.railway.app/api/notifications/webhook/vonage
     
     # Google Maps API Configuration
     VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
     ```

5. **Deploy**
   - Railway auto-deploys on push to main
   - Or use GitHub Actions workflow if configured

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

### Quick Setup (Dashboard):

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service (Backend)**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `ride-request-fastify`
     - **Root Directory**: `server-fastify` ⚠️ Important for monorepo
     - **Environment**: Node
- **Build Command**: `bun install && npx prisma generate && npm run build`
    - **Start Command**: `bun run start:prod`

3. **Create Static Site (Frontend)**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `ride-request-client`
     - **Root Directory**: `client`
     - **Build Command**: `bun install && bun run build`
     - **Publish Directory**: `dist`

4. **Add PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - Get "Internal Database URL" and set as `DATABASE_URL` in backend

---

## Render Blueprint (Staging + Production)

The `render.yaml` Blueprint configures both staging and production environments automatically.

### Environments

**Staging Environment** (`feat/move_relational_db` branch):
- Frontend: `stage-ride-request-client`
- Backend: `stage-ride-request-fastify`
- Database: `stage-rural-dispatch-postgres`

**Production Environment** (`main` branch):
- Frontend: `prod-ride-request-client`
- Backend: `prod-ride-request-fastify`
- Database: `prod-rural-dispatch-postgres`

### Blueprint Deployment Steps

1. **Prepare Your Repository**
   ```bash
   git add .
   git commit -m "feat: Configure Render Blueprint"
   git push origin main
   ```

2. **Deploy Using Blueprint**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click **New** → **Blueprint**
   - Connect GitHub repository
   - Select branch: `main` or `feat/move_relational_db`
   - Click **Apply**

3. **Configure Environment Variables**
   After Render creates the services, set these in each service's Environment tab.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│ Production (main branch)                            │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────────┐   ┌──────────────────┐   │
│  │ prod-ride-request-   │   │ prod-ride-       │   │
│  │ client (static)      │──>│ request-fastify  │   │
│  │ port: 443 (HTTPS)    │   │ port: 5000       │   │
│  └──────────────────────┘   └────────┬─────────┘   │
│                                      │              │
│                              ┌───────▼──────────┐   │
│                              │ prod-rural-      │   │
│                              │ dispatch-postgres│   │
│                              └──────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Client Deployment

### Important: API Base URL Configuration

The client uses relative URLs (`/api/...`) which work in development via Vite proxy but **require configuration in production**.

#### Solution: Set VITE_API_URL

**Development (.env.local)**:
```bash
# Leave empty - uses Vite proxy to localhost:5001
VITE_API_URL=
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

**Production (Render)**:
```bash
# Set to your Fastify backend URL
VITE_API_URL=https://prod-ride-request-fastify.onrender.com
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

### React Router SPA Support

The `render.yaml` includes a rewrite rule for React Router:

```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

This ensures all routes (e.g., `/dashboard`, `/rides/123`) are handled by React Router.

---

## Database Setup

### Automatic Migration on Deploy

The build command includes Prisma generation:
```bash
bun install && npx prisma generate && npm run build
```

### Manual Migration (if needed)

```bash
# Connect to Render Shell (go to service → Shell tab)
cd server-fastify
npx prisma migrate deploy

# Optional: Seed database
bun run seed
```

### Database Access

- **Internal URL**: Use this in `DATABASE_URL` (private network, faster)
- **External URL**: For local client connections (e.g., Prisma Studio, TablePlus)

---

## Environment Variables Reference

### Required for Backend

| Variable | Example | Notes |
|----------|---------|-------|
| `NODE_ENV` | `production` | Auto-set |
| `PORT` | `5000` | Render overrides |
| `DATABASE_URL` | `postgresql://...` | Auto-set from database |
| `CLIENT_URL` | `https://...onrender.com` | Frontend URL for CORS |
| `JWT_SECRET` | Auto-generated | Use generateValue |

### SMS Providers

| Variable | Notes |
|----------|-------|
| `TWILIO_ACCOUNT_SID` | From Twilio dashboard |
| `TWILIO_AUTH_TOKEN` | From Twilio dashboard |
| `TWILIO_PHONE_NUMBER` | Format: `+1234567890` |
| `TWILIO_MESSAGING_SERVICE_SID` | Optional but recommended |
| `TWILIO_WEBHOOK_URL` | Set after deploy: `https://.../api/notifications/webhook/twilio` |
| `TWILIO_STATUS_CALLBACK_URL` | Set after deploy: `https://.../api/notifications/status/twilio` |
| `VONAGE_API_KEY` | Fallback provider |
| `VONAGE_API_SECRET` | Fallback provider |
| `VONAGE_FROM_NUMBER` | Vonage number |
| `VONAGE_WEBHOOK_URL` | Set after deploy |

### Frontend Only

| Variable | Notes |
|----------|-------|
| `VITE_API_URL` | Backend URL (e.g., `https://prod-ride-request-fastify.onrender.com`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Client-side key |

---

## Post-Deployment Checklist

### Staging Checklist

- [ ] All services deployed successfully
- [ ] Environment variables configured
- [ ] Database migrated (`npx prisma migrate deploy`)
- [ ] Health check returns 200: `/health`
- [ ] Frontend loads correctly
- [ ] Login works with demo credentials
- [ ] API calls succeed (check Network tab)
- [ ] Google Maps autocomplete works
- [ ] SMS webhooks configured in Twilio/Vonage

### Production Checklist

- [ ] Staging tested thoroughly
- [ ] Merge to main branch
- [ ] Production services deployed
- [ ] Production environment variables set
- [ ] Production database migrated
- [ ] Production webhook URLs configured
- [ ] SSL/HTTPS working
- [ ] Custom domain configured (optional)

---

## Troubleshooting

### Build Failures

**Error**: `Cannot find module 'prisma'`
- **Fix**: Ensure `npx prisma generate` is in build command

**Error**: `rootDir not found`
- **Fix**: Verify `rootDir: server-fastify` or `rootDir: client` is set correctly

### Runtime Errors

**Error**: `Cannot connect to database`
- **Fix**: Verify `DATABASE_URL` is set correctly
- Use **Internal Database URL** (not external)

**Error**: `CORS error`
- **Fix**: Update backend `CLIENT_URL` to match frontend domain

### Frontend Issues

**Error**: API calls return 404
- **Fix**: Verify `VITE_API_URL` is set correctly (no trailing slash)

**Error**: React Router routes return 404
- **Fix**: Ensure rewrite rule exists in render.yaml

### SMS Issues

**Error**: Webhooks not receiving messages
- **Fix**: Verify webhook URLs are publicly accessible
- Check Render service is not sleeping (free tier spins down)

---

## Recommendations

**Choose Railway if:**
- You want the simplest setup
- You need quick deployments
- You're okay with usage-based pricing

**Choose Render if:**
- You want a generous free tier
- You need staging + production environments
- You prefer Blueprint infrastructure-as-code

Both platforms offer:
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ Auto-deploy from GitHub
- ✅ Environment variable management
- ✅ Easy scaling options

---

## Additional Resources

- **Render Docs**: https://render.com/docs
- **Render Blueprints**: https://render.com/docs/infrastructure-as-code
- **Railway Docs**: https://railway.app/docs
- **Prisma Deployment**: https://www.prisma.io/docs/guides/deployment
- **Fastify Production**: https://fastify.dev/docs/latest/Guides/Getting-Started/#production-deployment
