# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rural Dispatch is a ride-sharing management MVP with a React/TypeScript frontend, Node.js/Express backend, and PostgreSQL database with Prisma 7 ORM. The monorepo includes comprehensive features for managing ride requests, drivers, vehicles, and SMS notifications with role-based access control.

## Development Commands

### Setup & Installation
```bash
bun install                  # Install all dependencies (uses Bun, not npm)
cp .env.example .env         # Copy environment template
# Edit .env with your DATABASE_URL and credentials
bunx prisma migrate dev      # Run database migrations
bunx prisma generate         # Generate Prisma Client
bun run seed                 # Seed all demo data (users, providers, vehicles, rides)
```

### Running the Application
```bash
bun run dev                  # Run both client (port 3001) and server (port 5000) concurrently
bun run client               # Run client only (Vite dev server on port 3001)
bun run server               # Run server only (Bun with --watch flag on port 5000)
```

### Database Management
```bash
bunx prisma migrate dev      # Create and apply migrations
bunx prisma generate         # Generate Prisma Client (run after schema changes)
bunx prisma studio           # Open Prisma Studio (database GUI)
bunx prisma db push          # Push schema changes without migrations (dev only)
bun run db:migrate           # Alias for prisma migrate dev
bun run db:generate          # Alias for prisma generate
bun run db:studio            # Alias for prisma studio
```

### Database Seeding Scripts
```bash
bun run seed                 # Seed all demo data (default)
bun run seed:reset           # Clear database and reseed (prisma migrate reset --force)
bun run seed:prod            # Seed production environment
bun run seed:staging         # Seed staging environment
bun run seed:reset:prod      # Reset production database (DANGEROUS!)
bun run seed:reset:staging   # Reset staging database
```

### Building for Production
```bash
bun run build                # Build client for production
bun start                    # Start production server
```

## Architecture

### Monorepo Structure
- **`/client`** - React 18 + TypeScript + Vite frontend (7300+ LOC)
- **`/server`** - Express.js + Prisma 7 backend (ESM modules)
- **`/prisma`** - Prisma schema and generated client (`prisma/schema.prisma`)
- **`/shared`** - Zod validation schemas shared between client and server
- **`/docs`** - Documentation files

### Key Technologies
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Hook Form, Zod
- **Backend**: Node.js/Express (ESM), PostgreSQL, Prisma 7 ORM, bcryptjs, Helmet, CORS
- **Runtime**: Bun (development) - faster than Node.js for dev workflow
- **SMS**: Twilio (primary), Vonage (fallback)
- **Authentication**: Two-layer system (portal password + database-backed user auth)

### Database Tables (PostgreSQL via Prisma 7)
1. **users** - Service users (riders, caregivers, etc.) with indexes on `fullName` and `phone`
2. **rides** - Ride request records with status tracking (was `ride-requests` in MongoDB)
3. **service_providers** - Drivers with indexes and organization relationship
4. **vehicles** - Fleet vehicles with accessibility features
5. **notifications** - SMS message history and delivery tracking
6. **system_users** - Authentication (admin, dispatcher, driver, case_manager)
7. **organizations** - Optional organization grouping for service providers

**Key Architectural Changes from MongoDB:**
- UUIDs use Prisma's `uuid(7)` function (not MongoDB ObjectIDs)
- Foreign keys with `ON DELETE SET NULL` (rides preserve data when user/driver deleted)
- Generated `displayId` for human-readable ride IDs (e.g., RIDE-X7K9)
- Prisma Client generated at `prisma/generated/client/` (custom output path)
- Database API in `server/database/prismaApi.js` (replaces `api.js`)

## Authentication & Authorization

### Two-Layer Authentication System
1. **Portal Password**: `hackct25` (hardcoded in `PasswordProtection.tsx`)
   - 24-hour expiration stored in localStorage
   - Required before accessing any protected route

2. **User Sign-In**: Database-backed with bcrypt
   - Demo credentials in `docs/AUTHENTICATION.md`
   - Session stored in sessionStorage

### User Roles & Permissions
- **Admin**: Full system access (all features)
- **Dispatcher**: Ride management, resource creation, driver assignment
- **Driver**: View assigned rides only, update ride status
- **Case Manager**: Create rides for existing users (cannot add new users)

### Important Permission Checks
- Frontend: `client/src/utils/permissions.ts` - Check user roles
- Backend: `server/middleware/permissions.js` - RBAC middleware
- Routes protected by role in `client/src/App.tsx`

## Critical Ride Status Management

### Ride Status Constants (`server/constants/rideStatuses.js`)
**Normal Flow**:
```
REQUEST_IN_PROGRESS (0)
  → RIDE_CONFIRMED (100)
  → RIDE_STARTED (200)
  → RIDER_PICKED_UP (300)
  → RIDER_DROPPED_OFF (400)
  → [ROUNDTRIP_RETURNING (450) - optional]
  → RIDE_COMPLETE (500)
```

**Error States**: `RIDE_CANCELED_BY_RIDER`, `RIDE_INTERRUPTED`, `RIDER_NOT_PICKED_UP`, `RIDER_NOT_DROPPED_OFF`, `RIDE_INCOMPLETE`

### Ride Request Status Constants (`server/constants/rideRequestStatuses.js`)
```
REQUEST_OPEN (100)
  → DRIVER_NEEDED (200)
  → VEHICLE_NEEDED (300)
  → CONFIRMATION_NEEDED (400)
  → BROKER_NOTIFIED (500)
  → FLEET_MANAGER_NOTIFIED (600)
  → STAFF_NOTIFIED (700)
  → READY_TO_RIDE (1000)
  → CLOSED (1100)
```

**When updating ride status, always use these constants - never hardcode status numbers.**

## SMS Notification System

### Provider Architecture
- **Primary**: Twilio with Message Service SID
- **Fallback**: Vonage API
- **Auto-failover**: Implemented in `server/services/notificationService.js`

### SMS System Components
1. **notificationService.js** - Provider abstraction (Twilio/Vonage), bulk sending, delivery tracking
2. **smsTemplates.js** - All message templates with dynamic content insertion
3. **smsResponseHandler.js** - Parses incoming SMS responses (1=Yes, 2=No, 3=Cancel), determines context
4. **scheduler/** - Modular time-based notifications with auto-cleanup (refactored architecture):
   - **RideScheduler.js** - High-level orchestration (public API, singleton export)
   - **NotificationScheduler.js** - Individual notification scheduling methods
   - **TaskManager.js** - Task storage, lifecycle, status tracking
   - **TimeCalculator.js** - All time calculations (1-hour prior, pickup, dropoff, roundtrip)
   - Features: 1 hour prior reminders, pickup/dropoff checks, roundtrip returns, delayed status changes

### Configuration Required
Set these in `.env`:
```bash
TWILIO_MESSAGING_SERVICE_SID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WEBHOOK_URL=
TWILIO_STATUS_CALLBACK_URL=

VONAGE_API_KEY=
VONAGE_API_SECRET=
VONAGE_FROM_NUMBER=
VONAGE_WEBHOOK_URL=
```

### SMS Webhooks
- **Incoming Messages**: `/api/notifications/webhook/twilio` and `/api/notifications/webhook/vonage`
- **Delivery Status**: `/api/notifications/status/twilio` and `/api/notifications/status/vonage`
- Both providers supported with automatic provider detection

### Important SMS Features
- **Interactive responses**: Users reply with 1=Yes, 2=No, 3=Cancel (or text equivalents)
- **Two-way SMS**: Conversations tracked per ride with automatic context detection
- **Scheduled notifications**: Time-based reminders and status checks
- **User consent tracking**: TCPA compliance
- **Opt-out handling**: Reply STOP to unsubscribe
- **Message history**: Delivery status tracking in notifications collection
- **Auto-cleanup**: Scheduled tasks automatically removed after execution

## Key File Locations

### Backend Critical Files
- `server/index.js` - Main Express app initialization (ESM entry point)
- `server/routes/router.js` - Main router composition (imports modular route files)
- `server/routes/*Routes.js` - Modular route files (rideRequestRoutes, userRoutes, etc.)
- **`server/database/prismaApi.js`** - **Prisma-based database API** (replaces MongoDB `api.js`)
- `prisma/schema.prisma` - Database schema definition (source of truth)
- `prisma/generated/client/` - Generated Prisma Client (DO NOT edit manually)
- `server/services/notificationService.js` - SMS orchestration with provider fallback
- `server/services/scheduler/` - **Refactored scheduler module** (modular architecture):
  - `RideScheduler.js` - Main orchestrator (public API)
  - `NotificationScheduler.js` - Individual notification scheduling
  - `TaskManager.js` - Task lifecycle management
  - `TimeCalculator.js` - Time calculations
- `server/services/scheduler.js` - Backwards compatibility wrapper (re-exports RideScheduler)
- `server/services/smsResponseHandler.js` - Interactive SMS response processing
- `server/services/smsTemplates.js` - SMS message templates
- `server/middleware/permissions.js` - RBAC middleware
- `server/constants/rideStatuses.js` - Ride status constants (use these, not numbers!)
- `server/constants/rideRequestStatuses.js` - Ride request status constants
- `server/utils/displayId.js` - Human-readable ID generation (RIDE-XXXX format)

### Frontend Critical Files
- `client/src/App.tsx` - Router with role-based protected routes
- `client/src/components/RideRequests.tsx` - Main ride list UI with filtering and status updates
- `client/src/components/RideRequestForm.tsx` - Comprehensive ride request form
- `client/src/components/AssignDriver.tsx` - Driver assignment interface
- `client/src/components/ui/google-maps-autocomplete.tsx` - Google Maps place autocomplete
- `client/src/utils/permissions.ts` - Frontend permission checks
- `client/src/contexts/AuthContext.tsx` - Authentication state management

## TypeScript Configuration Notes

### Relaxed TypeScript Settings
The project uses **relaxed strict mode** for gradual migration (`client/tsconfig.json`):
- `strict: false`
- `noImplicitAny: false`
- `strictNullChecks: false`

**When adding new code**: Try to use proper types, but don't force strict compliance. The codebase is being gradually migrated to stricter TypeScript.

### Path Aliases
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

## Working with Prisma 7

### Schema-First Development
The database schema in `prisma/schema.prisma` is the **single source of truth**. All database changes start here.

**Workflow for Schema Changes:**
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration and apply to database
bunx prisma migrate dev --name descriptive_migration_name

# 3. Generate Prisma Client (happens automatically with migrate dev)
bunx prisma generate

# 4. Update prismaApi.js if adding new operations
```

### Important Prisma Patterns in This Codebase

**Custom Prisma Client Path:**
- Generated client is at `prisma/generated/client/` (not default `node_modules/.prisma/client`)
- Import: `import { PrismaClient } from '../../prisma/generated/client/client.ts'`

**Database Adapter Pattern:**
- Uses `@prisma/adapter-pg` with native `pg` driver for better performance
- Connection pool managed by `pg.Pool`

**Backward Compatibility Layer:**
- `prismaApi.js` maintains MongoDB-style API surface for existing code
- Returns objects with MongoDB-style field names (e.g., `serviceUserUuid`, `assignedDriverUuid`)
- Includes relations as arrays (e.g., `rider: [user]`) to match old structure

**UUID Generation:**
- Uses Prisma's `uuid(7)` function for all primary keys
- Format: 7-character UUID v7 (time-sortable)
- Human-readable display IDs generated separately (e.g., RIDE-X7K9)

### Common Prisma Operations

**Include Relations:**
```javascript
const ride = await prisma.ride.findUnique({
  where: { uuid },
  include: {
    rider: true,
    driver: true,
    vehicle: true,
    notifications: true
  }
});
```

**Filtering and Ordering:**
```javascript
const rides = await prisma.ride.findMany({
  where: {
    rideStatus: { gte: 100 },
    riderUuid: { not: null }
  },
  orderBy: { createdAt: 'desc' },
  take: 50
});
```

**Foreign Key Cascade Behavior:**
- `ON DELETE SET NULL` - Deleting a user/driver/vehicle sets FK to null (preserves ride history)
- `ON DELETE CASCADE` - Deleting a ride deletes all its notifications

### Prisma Studio (Database GUI)
```bash
bunx prisma studio
# Opens at http://localhost:5555
# Browse/edit data in visual interface
```

## Common Development Patterns

### Adding a New Form
1. Create Zod schema in `shared/schemas/` or `client/src/schemas/`
2. Use React Hook Form with `zodResolver`
3. Leverage shadcn/ui components from `client/src/components/ui/`
4. Follow existing form patterns in `RideRequestForm.tsx` or `UserForm.tsx`

### Adding a New API Endpoint
1. Add route in appropriate `server/routes/*Routes.js` file (or create new one)
2. Import new route file in `server/routes/router.js` and compose with main router
3. Use permission middleware if needed: `checkPermission(['admin', 'dispatcher'])`
4. Follow RESTful conventions
5. Update `server/database/prismaApi.js` if adding new database operations
6. If adding new models, update `prisma/schema.prisma` and run `bunx prisma migrate dev`

### Adding a New Role Permission
1. Update `server/middleware/permissions.js` - Backend validation
2. Update `client/src/utils/permissions.ts` - Frontend checks
3. Update routes in `client/src/App.tsx` with role requirements
4. Update navigation in `Navbar.tsx` for menu visibility

### SMS Notification Pattern
When sending SMS:
```javascript
const notificationService = require('../services/notificationService');

await notificationService.sendSMS({
  to: phoneNumber,
  message: messageText,
  rideUuid: rideId,  // Optional: for tracking
  messageType: 'ride_update'  // Optional: for categorization
});
```

### Scheduling Time-Based SMS
The scheduler has been refactored into a modular architecture for better maintainability:

```javascript
const scheduler = require('../services/scheduler'); // or scheduler/RideScheduler

// Schedule all tasks for a ride (must provide api update function)
scheduler.scheduleAllTasks(ride, rider, driver, async (updates) => {
  return await api.updateRideRequest(ride.uuid, updates);
});

// Cancel all scheduled tasks for a ride
scheduler.cancelAllTasks(ride.uuid);

// Individual scheduling methods (if needed)
scheduler.scheduleOneHourPrior(ride, rider, apiUpdateFn);
scheduler.scheduleDriverArrivalCheck(ride, driver);
scheduler.schedulePickupTasks(ride, driver, apiUpdateFn);
scheduler.scheduleDropoffTasks(ride, driver);
```

**Scheduler Module Structure:**
- **TaskManager** - Manages task storage (Map), add/remove/cancel operations
- **TimeCalculator** - Pure time calculation functions (no side effects)
- **NotificationScheduler** - Individual scheduling methods (uses TaskManager + TimeCalculator)
- **RideScheduler** - Public API, orchestrates high-level operations

### Processing Incoming SMS Responses
When handling webhook responses:
```javascript
const smsResponseHandler = require('../services/smsResponseHandler');

// Parse and process SMS response
const result = await smsResponseHandler.processResponse({
  from: phoneNumber,
  body: messageBody,
  api: databaseApi
});

if (result.action === 'UPDATE_RIDE_STATUS') {
  // Update ride with result.updates
}

## Vite Configuration

### Development Proxy
API requests to `/api/*` are proxied to `http://localhost:5000` (configured in `client/vite.config.ts`)

### Port Troubleshooting
If port 5000 is in use:
1. Add `PORT=5001` to `.env`
2. Update `target` in `client/vite.config.ts` to match new port
3. **Don't commit this change**

## Environment Variables

### Required for Development
```bash
# Timezone (CRITICAL - always UTC for backend)
TZ=UTC

# PostgreSQL + Prisma
DATABASE_URL=postgresql://username:password@localhost:5432/ride_request_app
# OR for Prisma Postgres Cloud:
# DATABASE_URL=postgresql://[KEY]:[SECRET]@db.prisma.io:5432/postgres?sslmode=require

# Server
NODE_ENV=development
PORT=5000

# JWT (for future implementation)
JWT_SECRET=your-secret-key

# SMS Providers (both required for full functionality)
TWILIO_MESSAGING_SERVICE_SID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WEBHOOK_URL=
TWILIO_STATUS_CALLBACK_URL=

VONAGE_API_KEY=
VONAGE_API_SECRET=
VONAGE_FROM_NUMBER=
VONAGE_WEBHOOK_URL=

# Google Maps (for address autocomplete and distance calculations)
VITE_GOOGLE_MAPS_API_KEY=         # Client-side key (HTTP referrer restrictions)
GOOGLE_MAPS_SERVER_API_KEY=       # Server-side key (IP restrictions)
```

**IMPORTANT**:
- Copy `.env.example` to `.env` and fill in your credentials
- Never commit `.env` to version control
- `DATABASE_URL` is required for Prisma to connect to PostgreSQL

## Testing Access

### Portal Access
- Password: `hackct25`
- Valid for 24 hours after first entry

### Demo User Credentials
- Admin: `admin` / `admin123`
- Dispatcher: `dispatcher` / `dispatch123`
- Driver: `driver` / `driver123`
- Case Manager: `casemanager` / `case123`

## Migration Status: MongoDB → PostgreSQL + Prisma 7

**✅ COMPLETED**: This codebase has been fully migrated from MongoDB to PostgreSQL with Prisma 7.

**What Changed:**
- Database layer completely rewritten (`server/database/prismaApi.js` replaces `api.js`)
- All routes updated to work with Prisma Client
- Schema redesigned for relational database patterns
- UUIDs use Prisma's `uuid(7)` instead of MongoDB ObjectIDs
- Foreign keys with cascade behavior replace document embedding
- Seeding scripts updated for Prisma (`prisma/seed.ts`)

**Legacy References:**
- Old `server/database/api.js` may still exist but is unused (imports now point to `prismaApi.js`)
- Some comments may reference "MongoDB" - these are outdated
- Environment variable `MONGODB_URI` is no longer used (replaced by `DATABASE_URL`)

**If You See Import Errors:**
- Run `bunx prisma generate` to regenerate Prisma Client
- Ensure `prisma/generated/client/` directory exists
- Check that `DATABASE_URL` is set in `.env`

## Important Caveats

### SMS Scheduler Auto-Cleanup
The scheduler service (v2.0) automatically cleans up scheduled tasks after execution. When a ride is updated or canceled:
- **Always call** `scheduler.cancelAllTasks(rideUuid)` before rescheduling
- Tasks are automatically removed after execution (prevents memory leaks)
- On ride assignment: cancel existing tasks, then call `scheduleAllTasks()`
- Task types: 1-hour prior, driver arrival, dropoff check, roundtrip return, delayed status changes

### Timezone Handling
**IMPORTANT**: The application uses a UTC-based timezone strategy:

**Architecture:**
- **Backend**: Always runs in UTC (do NOT set `TZ` environment variable)
- **Database**: Stores all times in UTC (ISO 8601 format with 'Z' suffix)
- **API**: Exchanges times in UTC ISO strings
- **Frontend**: Displays times in user's local timezone
- **Scheduler**: All calculations in UTC

**Utilities Available:**
- **Frontend**: `client/src/utils/dateUtils.ts`
  - `formatLocalDateTime()` - Display UTC in user's timezone
  - `utcToDateTimeLocal()` / `dateTimeLocalToUTC()` - Convert for datetime-local inputs
  - `formatLocalDate()`, `formatLocalTime()`, `getRelativeTime()`
- **Backend**: `server/utils/dateUtils.js`
  - `getCurrentUTC()`, `addMinutes()`, `addHours()`
  - `validateServerTimezone()` - Check if server is UTC
  - `formatForLogging()` - UTC-aware console logging

**See**: `docs/TIMEZONE_FIX_GUIDE.md` for complete implementation details

### Google Maps Autocomplete Integration
The codebase recently added Google Maps autocomplete for address inputs:
- Uses `google.maps.places.Autocomplete` (legacy, but still supported)
- Component: `client/src/components/ui/google-maps-autocomplete.tsx`
- Requires `VITE_GOOGLE_MAPS_API_KEY` in `client/.env`
- Place IDs stored for future Distance Matrix API integration

### Form Validation
Two validation approaches coexist:
1. **React Hook Form + Zod** (newer, preferred) - Used in newer forms
2. **Manual validation** (legacy) - Used in older forms

When working with forms, prefer React Hook Form + Zod patterns.

### SMS Compliance
The app includes TCPA compliance features:
- SMS consent tracking
- Opt-out handling (STOP keyword)
- Terms and privacy pages
- See `docs/TOLL_FREE_VERIFICATION.md` for details

## Documentation Resources

Comprehensive docs in `/docs`:
- `AUTHENTICATION.md` - Auth system details and role permissions
- `SMS_SETUP.md` - SMS provider configuration
- `SMS_SYSTEM_GUIDE.md` - Complete SMS flow documentation with interactive responses
- `SMS_FLOW_PRESENTATION_GUIDE.md` - SMS flow presentation materials
- `TIMEZONE_FIX_GUIDE.md` - **Timezone handling strategy and implementation** (UTC backend, local frontend)
- `SEEDING.md` - Database seeding guide
- `DEPLOYMENT.md` - Production deployment
- `DEVELOPMENT_GUIDE.md` - Complete local setup and workflow
- `API_REFERENCE.md` - Full API documentation with examples
- `ZOD_VALIDATION.md` - Form validation patterns
- `UI_DESIGN_SYSTEM.md` - shadcn/ui component usage
- `TOLL_FREE_VERIFICATION.md` - SMS compliance
- `SHARED_SCHEMAS.md` - Zod validation schemas

## Code Style Notes

- Uses **shadcn/ui** components extensively - avoid creating custom UI components
- Tailwind CSS for styling - use utility classes
- React Hook Form for new forms
- Zod for validation schemas
- Avoid prop drilling - use React Context for global state (see `AuthContext`)
- Keep TypeScript errors minimal but don't over-engineer types

## Critical Implementation Notes

### When Modifying Ride Assignment Logic
If you're working with `server/routes/router.js` ride assignment endpoints:
1. Always validate driver and vehicle are assigned before setting `rideRequestStatus >= 400`
2. Cancel existing scheduled tasks before rescheduling: `scheduler.cancelAllTasks(rideUuid)`
3. Schedule new tasks after assignment: `scheduler.scheduleAllTasks(ride, rider, driver, apiUpdateFn)`
4. Use status constants from `server/constants/` - never hardcode numbers

### When Working with SMS Features
If you're modifying `server/services/scheduler.js` or `server/services/smsResponseHandler.js`:
1. The scheduler auto-cleans up tasks after execution (v2.0 feature)
2. SMS responses support both numeric (1, 2, 3) and text formats ("yes", "no", "cancel")
3. Context detection is automatic based on current ride status
4. Always test scheduled tasks with near-future times during development
5. Check `SMS_SYSTEM_GUIDE.md` for complete flow documentation

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://username:password@host:5432/database

# Test connection with Prisma
bunx prisma db pull

# Verify PostgreSQL is running (if local)
psql -U username -d ride_request_app -c "\dt"
```

### Prisma Client Generation Errors
```bash
# Regenerate client from scratch
rm -rf prisma/generated/client
bunx prisma generate

# If using custom output path, verify prisma/schema.prisma has:
# generator client {
#   provider = "prisma-client"
#   output   = "./generated/client"
# }
```

### Migration Issues
```bash
# View migration status
bunx prisma migrate status

# Reset database (DESTROYS ALL DATA)
bunx prisma migrate reset --force

# Create migration from schema changes
bunx prisma migrate dev --name descriptive_name

# Apply pending migrations
bunx prisma migrate deploy
```

### "Cannot find module '@prisma/client'" Error
```bash
# Ensure Prisma Client is generated
bunx prisma generate

# Verify import path matches custom output
# Should be: prisma/generated/client/client.ts
# NOT: @prisma/client or node_modules/.prisma/client
```

### Bun vs Node.js
- **Development**: Use `bun run dev` (faster, recommended)
- **Production**: Works with both Bun and Node.js
- If Bun issues occur, fallback: `node server/index.js`
