# Deployment Guide - Staging & Production

Complete guide for deploying Rural Dispatch with Render Blueprint (staging + production environments).

## 📋 Overview

The `render.yaml` Blueprint configures:

**Staging Environment** (`feat/move_relational_db` branch)
- Frontend: `stage-ride-request-client`
- Backend: `stage-ride-request-fastify`
- Database: `stage-rural-dispatch-postgres`

**Production Environment** (`main` branch)
- Frontend: `prod-ride-request-client`
- Backend: `prod-ride-request-fastify`
- Database: `prod-rural-dispatch-postgres`

## 🔑 Key Features

✅ **Monorepo Support**: `rootDir: client` and `rootDir: server-fastify`
✅ **Auto-Deploy**: Commits trigger deployments automatically
✅ **Environment Separation**: Staging and production isolated
✅ **PostgreSQL**: Separate databases per environment
✅ **React Router**: SPA rewrite rules configured
✅ **Region**: Ohio (all services)

## 🚀 Deployment Steps

### 1. Prepare Your Repository

Ensure your code is pushed to GitHub:

```bash
# Make sure you're on the right branch
git checkout feat/move_relational_db

# Commit all changes
git add .
git commit -m "feat: Configure Render Blueprint with staging and production"
git push origin feat/move_relational_db
```

### 2. Deploy Staging Environment

#### Using Blueprint (Recommended):

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Blueprint**
3. Connect GitHub repository: `swarmnyc/ruraldispatch-ride-request`
4. Select branch: `feat/move_relational_db`
5. Click **Apply**

Render will create:
- `stage-ride-request-client` (static site)
- `stage-ride-request-fastify` (web service)
- `stage-rural-dispatch-postgres` (database)

#### Configure Environment Variables:

**For `stage-ride-request-client`:**
```bash
VITE_API_URL=https://stage-ride-request-fastify.onrender.com
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**For `stage-ride-request-fastify`:**
```bash
DATABASE_URL=postgresql://... # Auto-set from database
CLIENT_URL=https://stage-ride-request-client.onrender.com
JWT_SECRET=auto_generated

# SMS Providers
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid
TWILIO_WEBHOOK_URL=https://stage-ride-request-fastify.onrender.com/api/notifications/webhook/twilio
TWILIO_STATUS_CALLBACK_URL=https://stage-ride-request-fastify.onrender.com/api/notifications/status/twilio

VONAGE_API_KEY=your_vonage_key
VONAGE_API_SECRET=your_vonage_secret
VONAGE_FROM_NUMBER=+1234567890
VONAGE_WEBHOOK_URL=https://stage-ride-request-fastify.onrender.com/api/notifications/webhook/vonage

GOOGLE_MAPS_API_KEY=your_google_maps_server_key
```

### 3. Test Staging

Visit staging frontend: `https://stage-ride-request-client.onrender.com`

**Verify:**
- ✅ Frontend loads
- ✅ Can log in
- ✅ API calls work (check Network tab)
- ✅ Google Maps autocomplete works
- ✅ SMS sending works (if configured)

### 4. Deploy Production

Once staging is stable:

```bash
# Merge to main branch
git checkout main
git merge feat/move_relational_db
git push origin main
```

Render automatically deploys production services from `main` branch.

#### Configure Production Environment Variables:

Same as staging but with production credentials and URLs:

**For `prod-ride-request-client`:**
```bash
VITE_API_URL=https://prod-ride-request-fastify.onrender.com
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**For `prod-ride-request-fastify`:**
```bash
DATABASE_URL=postgresql://... # Auto-set from database
CLIENT_URL=https://prod-ride-request-client.onrender.com
# ... (same structure as staging with production values)
```

### 5. Database Migrations

#### Staging Database:

```bash
# Option 1: Via Render Shell
# Go to stage-ride-request-fastify → Shell tab
cd server-fastify
npx prisma migrate deploy
npm run db:seed  # Optional: seed demo data

# Option 2: Via local connection
# Get external database URL from Render
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

#### Production Database:

```bash
# Same process with production database URL
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

## 📊 Service Architecture

### Staging Environment

```
┌─────────────────────────────────────────────────────┐
│ Staging (feat/move_relational_db branch)           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────┐   ┌──────────────────┐  │
│  │ stage-ride-request-  │   │ stage-ride-      │  │
│  │ client (static)      │──>│ request-fastify  │  │
│  │ port: 443 (HTTPS)    │   │ port: 5000       │  │
│  └──────────────────────┘   └────────┬─────────┘  │
│                                      │              │
│                              ┌───────▼──────────┐  │
│                              │ stage-rural-     │  │
│                              │ dispatch-postgres│  │
│                              └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Production Environment

```
┌─────────────────────────────────────────────────────┐
│ Production (main branch)                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────┐   ┌──────────────────┐  │
│  │ prod-ride-request-   │   │ prod-ride-       │  │
│  │ client (static)      │──>│ request-fastify  │  │
│  │ port: 443 (HTTPS)    │   │ port: 5000       │  │
│  └──────────────────────┘   └────────┬─────────┘  │
│                                      │              │
│                              ┌───────▼──────────┐  │
│                              │ prod-rural-      │  │
│                              │ dispatch-postgres│  │
│                              └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 🔄 Deployment Workflow

### Feature Development
```bash
# Work on feature branch
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "feat: Add new feature"
git push origin feature/new-feature

# Merge to staging branch
git checkout feat/move_relational_db
git merge feature/new-feature
git push origin feat/move_relational_db
# → Triggers staging deployment
```

### Production Release
```bash
# After testing in staging
git checkout main
git merge feat/move_relational_db
git push origin main
# → Triggers production deployment
```

## 🔧 Environment Variables Reference

### Required for Backend

| Variable | Example | Notes |
|----------|---------|-------|
| `NODE_ENV` | `production` | Auto-set |
| `PORT` | `5000` | Render overrides |
| `DATABASE_URL` | `postgresql://...` | Auto-set from database |
| `CLIENT_URL` | `https://...onrender.com` | Frontend URL for CORS |
| `JWT_SECRET` | Auto-generated | Use generateValue |

### SMS Providers

| Variable | Example | Notes |
|----------|---------|-------|
| `TWILIO_ACCOUNT_SID` | `AC...` | From Twilio dashboard |
| `TWILIO_AUTH_TOKEN` | `...` | From Twilio dashboard |
| `TWILIO_PHONE_NUMBER` | `+1234567890` | Your Twilio number |
| `TWILIO_MESSAGING_SERVICE_SID` | `MG...` | Optional but recommended |
| `TWILIO_WEBHOOK_URL` | `https://.../api/notifications/webhook/twilio` | Set after deploy |
| `TWILIO_STATUS_CALLBACK_URL` | `https://.../api/notifications/status/twilio` | Set after deploy |
| `VONAGE_API_KEY` | `...` | Fallback provider |
| `VONAGE_API_SECRET` | `...` | Fallback provider |

### Frontend Only

| Variable | Example | Notes |
|----------|---------|-------|
| `VITE_API_URL` | `https://...onrender.com` | Backend URL |
| `VITE_GOOGLE_MAPS_API_KEY` | `AIza...` | Client-side key |

## 📝 Post-Deployment Checklist

### Staging Checklist

- [ ] All services deployed successfully
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] Health check returns 200: `/health`
- [ ] Frontend loads
- [ ] Login works
- [ ] API calls succeed
- [ ] Google Maps autocomplete works
- [ ] SMS sending works (test)
- [ ] SMS webhooks configured in Twilio/Vonage

### Production Checklist

- [ ] Merge staging to main
- [ ] Production services deployed
- [ ] Production environment variables configured
- [ ] Production database migrated
- [ ] Production webhook URLs configured
- [ ] Load testing completed
- [ ] Monitoring enabled
- [ ] Backup strategy configured
- [ ] SSL/HTTPS working
- [ ] Custom domain configured (optional)

## 🐛 Troubleshooting

### Issue: Build fails with "Cannot find module prisma"

**Solution**: Verify `npx prisma generate` is in build command:
```yaml
buildCommand: npm install && npx prisma generate && npm run build
```

### Issue: Frontend can't reach backend (CORS error)

**Solution**: Update backend `CLIENT_URL` to match frontend domain.

### Issue: Database connection fails

**Solution**: Check `DATABASE_URL` is set from the database service (internal URL).

### Issue: Staging branch not deploying

**Solution**: Verify `branch: feat/move_relational_db` matches your branch name.

### Issue: React Router routes return 404

**Solution**: Verify rewrite rule in render.yaml:
```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

## 📚 Additional Resources

- **Render Blueprints**: https://render.com/docs/infrastructure-as-code
- **Monorepo Support**: https://render.com/docs/monorepo-support
- **Environment Variables**: https://render.com/docs/configure-environment-variables
- **PostgreSQL**: https://render.com/docs/databases

## 🔐 Security Notes

1. **Never commit secrets** to render.yaml (use `sync: false`)
2. **Use generateValue** for JWT_SECRET
3. **Rotate credentials** regularly
4. **Enable 2FA** on Render account
5. **Review permissions** for GitHub integration

## 🚦 Status URLs

### Staging
- Frontend: `https://stage-ride-request-client.onrender.com`
- Backend: `https://stage-ride-request-fastify.onrender.com`
- Health: `https://stage-ride-request-fastify.onrender.com/health`

### Production
- Frontend: `https://prod-ride-request-client.onrender.com`
- Backend: `https://prod-ride-request-fastify.onrender.com`
- Health: `https://prod-ride-request-fastify.onrender.com/health`

---

**Ready to deploy?** Follow the steps above and monitor your Render dashboard for deployment progress!
