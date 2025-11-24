# Development Guide

> **Complete guide for setting up and developing Rural Dispatch locally**

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
```bash
# Bun (v1.0.0 or higher)
bun --version  # Should be >= 1.0.0

# Git
git --version

# PostgreSQL (v14.0 or higher)
psql --version  # Should be >= 14.0
```

### Install Bun
```bash
# macOS, Linux, WSL
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Recommended Tools
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Prisma (official extension)
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
- **Postman** or **Insomnia** for API testing
- **Prisma Studio** (included with Prisma) or **pgAdmin** for database inspection
- **ngrok** for webhook testing

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/ride-request-mvp-johan.git
cd ride-request-mvp-johan
```

### 2. Install Dependencies

```bash
# Install all dependencies (uses workspaces)
bun install
```

### 3. Verify Installation

```bash
# Check Bun version
bun --version

# Check PostgreSQL connection
psql --version
```

---

## Environment Configuration

### 1. Create Environment Files

#### Root `.env` (Server Configuration)
```bash
cp .env.example .env
```

Edit `/ride-request-mvp-johan/.env`:

```bash
# PostgreSQL Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ride_request_app
# OR for hosted PostgreSQL (Railway, Render, Supabase, etc.):
# DATABASE_URL=postgresql://username:password@host:5432/database_name

# Server Configuration
NODE_ENV=development
PORT=5000

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# SMS Providers (Optional for development)
# Twilio Configuration (Primary)
TWILIO_MESSAGING_SERVICE_SID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WEBHOOK_URL=http://localhost:5000/api/notifications/webhook/twilio
TWILIO_STATUS_CALLBACK_URL=http://localhost:5000/api/notifications/status/twilio
# Set to 'true' to disable status callbacks during development
TWILIO_DISABLE_STATUS_CALLBACK=true

# Vonage Configuration (Fallback)
VONAGE_API_KEY=
VONAGE_API_SECRET=
VONAGE_FROM_NUMBER=
VONAGE_WEBHOOK_URL=http://localhost:5000/api/notifications/webhook/vonage

# Google Maps API Configuration
# Get your API key from: https://console.cloud.google.com/google/maps-apis
# Enable: Places API (New), Maps JavaScript API, Distance Matrix API
VITE_GOOGLE_MAPS_API_KEY=
```

### 2. Get API Keys

#### Twilio Setup (Optional)
1. Sign up at [Twilio Console](https://console.twilio.com/)
2. Get Account SID and Auth Token from dashboard
3. Buy a phone number with SMS capability
4. Copy credentials to `.env`

#### Vonage Setup (Optional)
1. Sign up at [Vonage Dashboard](https://dashboard.nexmo.com/)
2. Get API Key and Secret from Settings
3. Copy credentials to `.env`

#### Google Maps API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. Create a new project or select existing one
3. Enable the following APIs:
   - **Places API (New)** - For address autocomplete
   - **Maps JavaScript API** - For map display
   - **Distance Matrix API** - For future route calculations
4. Create credentials:
   - APIs & Services → Credentials → Create Credentials → API Key
5. (Optional) Restrict the API key:
   - Application restrictions: HTTP referrers
   - Add: `http://localhost:3001/*` (development)
   - API restrictions: Select the 3 APIs listed above
6. Copy the API key to `.env` as `VITE_GOOGLE_MAPS_API_KEY`

---

## Database Setup

### Option 1: Local PostgreSQL

#### Install PostgreSQL
```bash
# macOS (Homebrew)
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

#### Create Database
```bash
# Connect to PostgreSQL
psql postgres

# In psql shell:
CREATE DATABASE ride_request_app;
CREATE USER dev_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ride_request_app TO dev_user;

# Exit psql
\q
```

#### Update .env with connection string
```bash
DATABASE_URL=postgresql://dev_user:your_password@localhost:5432/ride_request_app
```

### Option 2: Hosted PostgreSQL (Railway, Render, Supabase)

#### Railway (Recommended)
1. Sign up at [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy `DATABASE_URL` from Variables tab
4. Update `.env` with connection string

#### Render
1. Sign up at [render.com](https://render.com)
2. Create new PostgreSQL database
3. Copy Internal Database URL
4. Update `.env` with connection string

#### Supabase
1. Sign up at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database → Connection String
4. Copy and update `.env`

### Run Migrations and Seed Database

```bash
# Generate Prisma Client
bunx prisma generate

# Run database migrations
bunx prisma migrate dev

# Seed all demo data (system users, riders, drivers, vehicles, rides)
bun run seed

# Open Prisma Studio (database GUI)
bunx prisma studio
```

### Verify Data

```bash
# Using psql
psql $DATABASE_URL

# In psql:
\dt                    # List all tables
SELECT * FROM "system_users";
SELECT * FROM "users" LIMIT 5;
SELECT * FROM "service_providers";

# Using Prisma Studio (recommended)
bunx prisma studio
# Opens at http://localhost:5555
```

---

## Running the Application

### Development Mode (Recommended)

```bash
# From root directory - runs both client and server
bun run dev

# This starts:
# - Server on http://localhost:5000
# - Client on http://localhost:3001
```

### Run Individually

```bash
# Terminal 1: Server only
bun run server

# Terminal 2: Client only
bun run client
```

### Access the Application

1. **Open Browser**: http://localhost:3001
2. **Portal Password**: `hackct25`
3. **Sign In** with demo credentials:
   - Admin: `admin` / `admin123`
   - Dispatcher: `dispatcher` / `dispatch123`
   - Driver: `driver` / `driver123`
   - Case Manager: `casemanager` / `case123`

---

## Development Workflow

### Project Structure
```
ride-request-mvp-johan/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   ├── utils/       # Utility functions
│   │   ├── types/       # TypeScript types
│   │   └── schemas/     # Zod schemas
│   └── vite.config.ts
├── server/              # Express backend (ESM)
│   ├── database/        # Prisma operations
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   └── constants/       # Status constants
├── prisma/              # Prisma schema and migrations
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Migration files
│   ├── seeds/           # Modular seed files
│   └── seed.ts          # Main seed orchestrator
├── shared/              # Shared validation schemas
│   └── schemas/
└── docs/                # Documentation
```

### Hot Reloading

Both client and server support hot reloading:
- **Client**: Vite HMR - instant updates
- **Server**: Nodemon - auto-restarts on file changes

### Making Changes

#### Frontend Changes
1. Edit files in `client/src/`
2. Browser auto-refreshes
3. Check browser console for errors
4. Use React DevTools for debugging

#### Backend Changes
1. Edit files in `server/`
2. Server auto-restarts
3. Check terminal for errors
4. Test API with Postman

#### Shared Schema Changes
1. Edit files in `shared/schemas/`
2. Both client and server auto-reload
3. Test form validation

### Code Style

```bash
# Format code (if Prettier is configured)
bun run format

# Lint code (if ESLint is configured)
bun run lint

# TypeScript type checking
cd client && bunx tsc --noEmit

# Generate Prisma Client after schema changes
bunx prisma generate
```

---

## Testing

### Manual Testing Checklist

#### Authentication Flow
```bash
# 1. Test portal access
- Navigate to http://localhost:3001
- Enter password: hackct25
- Should redirect to sign-in

# 2. Test user sign-in
- Try each role (admin, dispatcher, driver, case_manager)
- Verify role-based navigation
- Check user badge in navbar

# 3. Test logout
- Click logout button
- Should redirect to sign-in (not portal)
- Verify session cleared
```

#### Ride Request Creation
```bash
# 1. Create new user
- Click "Add a User" (admin/dispatcher only)
- Fill in all required fields
- Verify user created in database

# 2. Create ride request
- Search for user
- Fill in ride details
- Test Google Maps autocomplete
- Submit form
- Verify ride request in dashboard

# 3. Assign driver
- Open ride request
- Click "Assign Driver"
- Search and select driver
- Verify assignment
```

#### SMS Testing (if configured)
```bash
# 1. Update ride status
- Change ride status to trigger SMS
- Check server logs for SMS sent
- Verify SMS received on phone

# 2. Test opt-out
- Reply "STOP" to SMS
- Check user opt-out status in database
- Verify no more SMS sent

# 3. Test two-way SMS
- Send SMS from phone
- Check incoming SMS in dashboard
- Reply from dashboard
```

### API Testing with curl

```bash
# Health check
curl http://localhost:5000/health

# Get all users
curl http://localhost:5000/api/users | jq

# Get ride requests
curl http://localhost:5000/api/riderequests | jq

# Create ride request
curl -X POST http://localhost:5000/api/riderequests \
  -H "Content-Type: application/json" \
  -d '{
    "serviceUserUuid": "test-user-uuid",
    "pickupAddress": "123 Main St",
    "dropOffAddress": "456 Oak Ave",
    "pickupRequestedTime": "2025-01-15T10:00:00Z",
    "dropOffRequestedTime": "2025-01-15T11:00:00Z"
  }' | jq
```

### Database Testing

```bash
# Open Prisma Studio (GUI - recommended)
bunx prisma studio
# Opens at http://localhost:5555

# Or use PostgreSQL shell
psql $DATABASE_URL

# Useful queries (in psql)
SELECT * FROM system_users;
SELECT COUNT(*) FROM users;
SELECT * FROM rides ORDER BY "createdAt" DESC LIMIT 5;
SELECT * FROM notifications WHERE "rideUuid" = 'your-ride-uuid';

# Clear specific table (careful!)
TRUNCATE TABLE rides RESTART IDENTITY CASCADE;

# Reset database (re-run migrations and seeds)
bunx prisma migrate reset
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Error: EADDRINUSE: address already in use :::5000
# Solution: Change port in .env
PORT=5001

# Also update client/vite.config.ts proxy target
```

#### PostgreSQL Connection Failed
```bash
# Error: P1001: Can't reach database server
# Solutions:
1. Check DATABASE_URL in .env
2. Verify username/password
3. Ensure PostgreSQL is running locally
4. Check firewall settings for hosted databases

# Test connection
psql $DATABASE_URL

# Check if PostgreSQL is running
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Linux
```

#### Google Maps Not Loading
```bash
# Error: Google Maps API key missing
# Solutions:
1. Check VITE_GOOGLE_MAPS_API_KEY in root .env file
2. Verify API key is valid
3. Check API restrictions in Google Cloud Console
4. Enable required APIs:
   - Places API (New)
   - Maps JavaScript API
   - Distance Matrix API (for future use)
5. Restart dev server after adding key
```

#### SMS Not Sending
```bash
# Check provider status
curl http://localhost:5000/api/notifications/provider-status | jq

# Solutions:
1. Verify SMS provider credentials in .env
2. Check account balance (Twilio/Vonage)
3. Verify phone number format (+1234567890)
4. Check server logs for errors
5. Test with test credentials first
```

#### TypeScript Errors
```bash
# Error: Cannot find module '@prisma/client'
# Solution: Generate Prisma Client
bunx prisma generate

# Run type checking
cd client && bunx tsc --noEmit

# If errors persist:
1. Restart VS Code TypeScript server
2. Delete node_modules and reinstall with `bun install`
3. Check tsconfig.json paths
4. Regenerate Prisma Client
```

#### Hot Reload Not Working
```bash
# Client not refreshing
1. Check browser console for errors
2. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
3. Restart Vite dev server

# Server not restarting
1. Check nodemon is installed
2. Verify server/nodemon.json configuration
3. Check for syntax errors
```

### Debug Mode

#### Enable Verbose Logging
```javascript
// In server/index.js (temporarily)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

#### Check Environment Variables
```bash
# Server
node -e "console.log(process.env.DATABASE_URL)"

# Client (Vite)
# In client/src/main.tsx
console.log('API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

# Verify Prisma can read DATABASE_URL
bunx prisma db pull --preview-feature
```

### Getting Help

1. **Check Logs**:
   - Server: Terminal where `bun run dev` is running
   - Client: Browser DevTools Console
   - Database: PostgreSQL logs or Prisma Studio

2. **Documentation**:
   - `/docs` folder for detailed guides
   - `CLAUDE.md` for project overview
   - API docs in `/docs/API_REFERENCE.md` (if exists)

3. **Common Commands**:
   ```bash
   bun run dev                 # Start everything
   bunx prisma studio          # Open database GUI
   bunx prisma migrate reset   # Reset database and reseed
   bun install                 # Reinstall dependencies
   ```

---

## Next Steps

1. **Read Documentation**: Check `/docs` for specific guides
2. **Explore Codebase**: Start with `CLAUDE.md` for architecture overview
3. **Try Features**: Test all user roles and features
4. **Make Changes**: Follow development workflow above
5. **Check Tests**: Run manual testing checklist before commits

## Additional Resources

- [Authentication Guide](./AUTHENTICATION.md)
- [SMS Setup Guide](./SMS_SETUP.md)
- [Seeding Guide](./SEEDING.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Toll-Free Verification](./TOLL_FREE_VERIFICATION.md)
