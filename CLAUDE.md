# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rural Dispatch is a ride-sharing management MVP with a React/TypeScript frontend, Node.js/Express backend, and MongoDB database. The monorepo includes comprehensive features for managing ride requests, drivers, vehicles, and SMS notifications with role-based access control.

## Development Commands

### Setup & Installation
```bash
npm run install-all          # Install all dependencies (root, client, shared)
npm run seed:system-users    # Create demo users (admin, dispatcher, driver, case_manager)
npm run seed                 # Seed all demo data (users, providers, vehicles, rides)
```

### Running the Application
```bash
npm run dev                  # Run both client (port 3001) and server (port 5000) concurrently
npm run client               # Run client only (Vite dev server on port 3001)
npm run server               # Run server only (nodemon on port 5000)
```

### Building for Production
```bash
npm run build                # Build client for production
npm start                    # Start production server
```

### Database Seeding Scripts
```bash
npm run seed:all             # Run all seed scripts
npm run seed:users           # Seed service users
npm run seed:providers       # Seed service providers
npm run seed:vehicles        # Seed vehicles
npm run seed:rides           # Seed ride requests
```

## Architecture

### Monorepo Structure
- **`/client`** - React 18 + TypeScript + Vite frontend (7300+ LOC)
- **`/server`** - Express.js + MongoDB backend
- **`/shared`** - Zod validation schemas shared between client and server
- **`/docs`** - Documentation files

### Key Technologies
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Hook Form, Zod
- **Backend**: Express.js, MongoDB (native driver), bcryptjs, Helmet, CORS
- **SMS**: Twilio (primary), Vonage (fallback)
- **Authentication**: Two-layer system (portal password + database-backed user auth)

### Database Collections (MongoDB)
1. **users** - Service users (riders, caregivers, etc.) with text indexes on `fullName` and `phone`
2. **ride-requests** - Ride request records with status tracking
3. **service-providers** - Drivers with text indexes
4. **vehicles** - Fleet vehicles with text indexes
5. **notifications** - SMS message history and delivery tracking
6. **system-users** - Authentication (admin, dispatcher, driver, case_manager)
7. **locations** - Optional address information

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
- Two-way SMS conversations tracked per ride
- User consent tracking (TCPA compliance)
- Opt-out handling (reply STOP)
- Message history and delivery status tracking

## Key File Locations

### Backend Critical Files
- `server/routes/router.js` (915 lines) - All API endpoints
- `server/database/api.js` - API factory pattern
- `server/services/notificationService.js` - SMS orchestration with provider fallback
- `server/middleware/permissions.js` - RBAC middleware
- `server/models/*.js` - Mongoose schemas

### Frontend Critical Files
- `client/src/App.tsx` - Router with role-based protected routes
- `client/src/components/RideRequests.tsx` (1200+ lines) - Main ride list UI
- `client/src/components/RideRequestForm.tsx` - Comprehensive ride request form
- `client/src/components/AssignDriver.tsx` - Driver assignment interface
- `client/src/utils/permissions.ts` - Frontend permission checks

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

## Common Development Patterns

### Adding a New Form
1. Create Zod schema in `shared/schemas/` or `client/src/schemas/`
2. Use React Hook Form with `zodResolver`
3. Leverage shadcn/ui components from `client/src/components/ui/`
4. Follow existing form patterns in `RideRequestForm.tsx` or `UserForm.tsx`

### Adding a New API Endpoint
1. Add route in `server/routes/router.js`
2. Use permission middleware if needed: `checkPermission(['admin', 'dispatcher'])`
3. Follow RESTful conventions
4. Update `server/database/api.js` if adding new collection operations

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
# MongoDB
MONGODB_URI=mongodb+srv://...

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
```

## Testing Access

### Portal Access
- Password: `hackct25`
- Valid for 24 hours after first entry

### Demo User Credentials
- Admin: `admin` / `admin123`
- Dispatcher: `dispatcher` / `dispatch123`
- Driver: `driver` / `driver123`
- Case Manager: `casemanager` / `case123`

## Important Caveats

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
- `SEEDING.md` - Database seeding guide
- `DEPLOYMENT.md` - Production deployment
- `ZOD_VALIDATION.md` - Form validation patterns
- `UI_DESIGN_SYSTEM.md` - shadcn/ui component usage
- `TOLL_FREE_VERIFICATION.md` - SMS compliance

## Code Style Notes

- Uses **shadcn/ui** components extensively - avoid creating custom UI components
- Tailwind CSS for styling - use utility classes
- React Hook Form for new forms
- Zod for validation schemas
- Avoid prop drilling - use React Context for global state (see `AuthContext`)
- Keep TypeScript errors minimal but don't over-engineer types
