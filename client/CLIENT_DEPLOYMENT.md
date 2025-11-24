# Client Deployment Guide - React Frontend

Guide for deploying the React + Vite frontend to Render with the Fastify backend.

## Overview

The client is a React 18 + TypeScript + Vite application with:
- **shadcn/ui** components
- **React Router** for SPA navigation
- **Axios** for API calls
- **Google Maps** integration

## Current Issue: API Calls in Production

⚠️ **Important**: The client currently uses relative URLs (`/api/...`) which work in development via Vite proxy but **will not work in production** when frontend and backend are on different domains.

### Development Setup (Current)
```typescript
// Works in development - Vite proxy forwards to localhost:5000
axios.get('/api/auth/login')
```

### Production Requirement
```typescript
// Must use full backend URL in production
axios.get('https://ride-request-fastify.onrender.com/api/auth/login')
```

## Solution: API Base URL Utility

A utility file has been created at `src/lib/api.ts` to handle this automatically.

### Option 1: Configure Axios BaseURL (Recommended)

Update your axios configuration to use the environment variable:

**Create or update `src/lib/axios.ts`:**

```typescript
import axios from 'axios';

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

**Then update all API calls to use the configured instance:**

```typescript
// Before:
import axios from 'axios';
axios.get('/api/auth/login');

// After:
import api from '@/lib/axios';
api.get('/api/auth/login');
```

### Option 2: Use the getApiUrl Utility

Use the provided `getApiUrl()` function:

```typescript
import { getApiUrl } from '@/lib/api';

// Automatically adds base URL in production
axios.get(getApiUrl('/api/auth/login'));
```

## Files That Need Updating

Run this command to find all API calls:

```bash
grep -r "axios\.\(get\|post\|put\|delete\|patch\)" client/src/
grep -r "fetch('/api" client/src/
```

**Known files with API calls:**
1. `src/contexts/AuthContext.tsx` - Login, register, profile
2. `src/utils/database.ts` - Fuzzy search, CRUD operations
3. `src/pages/SMSOptOut.tsx` - SMS opt-out
4. Any component making direct API calls

## Environment Variables

### Development (.env.local)
```bash
# Leave empty - uses Vite proxy to localhost:5000
VITE_API_URL=

# Or explicitly set to empty
# VITE_API_URL=

VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

### Production (Render)
```bash
# Set to your Fastify backend URL
VITE_API_URL=https://ride-request-fastify.onrender.com

VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

## Render Deployment Configuration

The `render.yaml` is already configured for monorepo deployment:

```yaml
services:
  - type: web
    name: ride-request-client
    runtime: static
    rootDir: client  # Monorepo support
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_GOOGLE_MAPS_API_KEY
        sync: false
      - key: VITE_API_URL
        sync: false  # Set to your Fastify backend URL
    routes:
      - type: rewrite
        source: /*
        destination: /index.html  # React Router SPA support
```

## Deployment Steps

### 1. Update API Calls (Choose one approach)

**Recommended: Axios BaseURL**

Create `src/lib/axios.ts` with configured instance and update all imports.

### 2. Test Locally with Production-like Setup

```bash
# In client directory
export VITE_API_URL=http://localhost:5000
npm run build
npm run preview
```

This tests the production build with explicit API URL.

### 3. Deploy to Render

#### Using Blueprint (Automated):

```bash
git add .
git commit -m "feat: Configure client for production API calls"
git push origin main
```

Then in Render Dashboard:
1. **New** → **Blueprint**
2. Connect GitHub repository
3. Render creates services from `render.yaml`
4. Set environment variables:
   - `VITE_API_URL` → Backend URL (e.g., `https://ride-request-fastify.onrender.com`)
   - `VITE_GOOGLE_MAPS_API_KEY` → Your Google Maps key

#### Using Dashboard (Manual):

1. **New** → **Static Site**
2. Connect GitHub repository
3. Configure:
   - **Name**: `ride-request-client`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add environment variables
5. Deploy

### 4. Update Backend CORS

After deploying the client, update the backend `CLIENT_URL` environment variable:

```bash
# In Render dashboard for ride-request-fastify
CLIENT_URL=https://ride-request-client.onrender.com
```

This allows the backend to accept requests from your frontend domain.

### 5. Test Production

Visit your frontend URL and verify:
- ✅ Login works
- ✅ API calls succeed (check Network tab)
- ✅ React Router navigation works
- ✅ Google Maps autocomplete works

## React Router SPA Support

The `render.yaml` includes a rewrite rule for React Router:

```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

This ensures all routes (e.g., `/dashboard`, `/rides/123`) are handled by React Router instead of returning 404.

## Troubleshooting

### Issue: API calls fail with CORS error

**Solution**: Update backend `CLIENT_URL` to match your frontend domain.

```bash
# In server-fastify on Render
CLIENT_URL=https://ride-request-client.onrender.com
```

### Issue: API calls return 404

**Solution**: Verify `VITE_API_URL` is set correctly and doesn't have trailing slash:

```bash
# Correct
VITE_API_URL=https://ride-request-fastify.onrender.com

# Incorrect (trailing slash)
VITE_API_URL=https://ride-request-fastify.onrender.com/
```

### Issue: React Router routes return 404

**Solution**: Verify the rewrite rule is in `render.yaml`:

```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

### Issue: Environment variables not working

**Vite requires restart**: Changes to `.env` files require restarting the dev server.

**Variable naming**: Must start with `VITE_` prefix:
```bash
# Works
VITE_API_URL=...

# Doesn't work (not exposed to browser)
API_URL=...
```

## Migration Checklist

Before deploying:

- [ ] Choose API configuration approach (axios baseURL or getApiUrl utility)
- [ ] Update all API calls to use configured approach
- [ ] Create `.env.local` for local testing
- [ ] Test locally with `VITE_API_URL` set
- [ ] Verify build succeeds: `npm run build`
- [ ] Check `dist/` output looks correct
- [ ] Review `render.yaml` configuration
- [ ] Deploy backend first
- [ ] Deploy frontend with backend URL
- [ ] Update backend `CLIENT_URL` with frontend URL
- [ ] Test all functionality in production

## Next Steps

1. **Update API calls** - Choose axios baseURL or getApiUrl approach
2. **Test locally** - Build and preview with production-like config
3. **Deploy backend** - Get Fastify service URL
4. **Deploy frontend** - Set `VITE_API_URL` to backend URL
5. **Update CORS** - Set backend `CLIENT_URL` to frontend URL
6. **Verify** - Test all features in production

---

**Need Help?**

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Render Static Sites](https://render.com/docs/static-sites)
- [Render Blueprints](https://render.com/docs/infrastructure-as-code)
