# Rural Dispatch - System Design Document

> **Version**: 1.1  
> **Last Updated**: January 2026  
> **Status**: Production Ready

---

## Executive Summary

**Rural Dispatch** is a full-stack ride-sharing management platform designed for rural and underserved communities. The application enables dispatchers, case managers, and caregivers to coordinate transportation for individuals who need assistance getting to medical appointments, social services, and other essential destinations.

### Key Value Proposition

- **Two-way SMS Integration**: Drivers and riders receive automated notifications and can respond via SMS without needing a smartphone app
- **Role-Based Access Control**: Granular permissions for Admins, Dispatchers, Drivers, and Case Managers
- **TCPA Compliant**: Built-in consent management and opt-out handling for SMS communications
- **Real-time Coordination**: Live ride status tracking with automated notifications at key milestones

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐  ┌───────────────────────────────────┐  │
│  │   Web Browser              │  │   SMS (Twilio)                    │  │
│  │   React SPA                │  │   Inbound/Out                     │  │
│  └───────────────────┬────────┘  └──────────────────────┬────────────┘  │
└───────────┼─────────────────────────────────────────────┼────────────────┘
            │                    │
            │ HTTPS              │ Webhooks
            ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                    │
│                     (Render/Railway + HTTPS)                            │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FASTIFY SERVER                                   │
│                      (Node.js + TypeScript)                             │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │    Routes    │  │  Middleware  │  │   Services   │  │  Scheduler  │  │
│  │  (REST API)  │  │ (Auth/RBAC)  │  │ (SMS/Notif)  │  │(In-Memory)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐        ┌─────────────────────────────────┐ │
│  │   Prisma ORM (v7)       │───────▶│   PostgreSQL Database          │ │
│  │   Type-safe queries     │        │   (Render/Railway/Flyio/VPS)    │ │
│  └─────────────────────────┘        └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Dispatcher │────▶│  Create Ride │────▶│ Assign Driver│────▶│  Send SMS    │
│   (Web UI)   │     │   Request    │     │  + Vehicle   │     │ Notification │
└──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                      │
                                                                      ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Complete   │◀────│ Update Status│◀────│ Driver Reply │◀────│   Driver     │
│    Ride      │     │  via Webhook │     │  (SMS: "1")  │     │ Receives SMS │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI framework with hooks |
| **TypeScript** | 5.x | Type safety |
| **Vite** | 5.x | Build tool and dev server |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **shadcn/ui** | Latest | Pre-built accessible components |
| **React Router** | 6.x | Client-side routing |
| **React Hook Form** | 7.x | Form state management |
| **Zod** | 4.x | Schema validation |
| **Axios** | 1.x | HTTP client |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20.x LTS | Runtime environment |
| **Fastify** | 5.x | High-performance web framework |
| **TypeScript** | 5.x | Type safety |
| **Prisma** | 7.x | ORM with type-safe database access |
| **PostgreSQL** | 15.x+ | Relational database |
| **Zod** | 4.x | Request/response validation |
| **bcryptjs** | 3.x | Password hashing |
| **Pino** | 9.x | High-performance logging |

### Infrastructure & DevOps

| Technology | Purpose |
|------------|---------|
| **Render** / **Railway** | Cloud hosting (PaaS) |
| **GitHub Actions** | CI/CD pipelines |
| **Bun** | Fast JavaScript runtime & package manager |

### External Services

| Service | Purpose |
|---------|---------|
| **Twilio** | SMS provider |
| **Google Maps API** | Distance Matrix, geocoding |

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│    system_users     │       │       users         │
├─────────────────────┤       ├─────────────────────┤
│ uuid (PK)           │       │ uuid (PK)           │
│ username            │       │ fullName            │
│ passwordHash        │       │ phone               │
│ role                │       │ email               │
│ fullName            │       │ address             │
│ isActive            │       │ role                │
│ createdAt           │       │ smsConsentGiven     │
│ updatedAt           │       │ smsConsentTimestamp │
└─────────────────────┘       │ smsConsentIpAddress │
                              │ createdAt           │
                              │ updatedAt           │
                              └──────────┬──────────┘
                                         │
                                         │ 1:N
                                         ▼
┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│  service_providers  │       │       rides         │       │      vehicles       │
├─────────────────────┤       ├─────────────────────┤       ├─────────────────────┤
│ uuid (PK)           │       │ uuid (PK)           │       │ uuid (PK)           │
│ fullName            │       │ displayId           │       │ displayName         │
│ phone               │◀──────│ riderUuid (FK)      │       │ fleetId             │
│ mobilePhone         │   N:1 │ driverUuid (FK)     │ N:1   │ model               │
│ title               │       │ vehicleUuid (FK)    │ N:1   │ year                │
│ organizationId (FK) │       │ pickupAddress       │       │ color               │
│ role                │       │ dropOffAddress      │       │ licensePlate        │
│ createdAt           │       │ pickupRequestedTime │       │ capacity            │
│ updatedAt           │       │ rideStatus          │       │ serviceArea         │
└─────────────────────┘       │ rideRequestStatus   │       │ walkerAccessible    │
                              │ roundTrip           │       │ wheelchairAccessible│
                              │ notes               │       │ serviceAnimalFriendly│
                              │ estimatedTravelTime │       │ oxygenTankAccessible│
                              │ createdAt           │       │ isActive            │
                              │ updatedAt           │       │ createdAt           │
                              └──────────┬──────────┘       └─────────────────────┘
                                         │
                                         │ 1:N
                                         ▼
                              ┌─────────────────────┐
                              │    notifications    │
                              ├─────────────────────┤
                              │ uuid (PK)           │
                              │ rideUuid (FK)       │
                              │ notificationType    │
                              │ direction           │
                              │ recipientPhone      │
                              │ recipientName       │
                              │ recipientRole       │
                              │ messageBody         │
                              │ twilioMessageSid    │
                              │ twilioStatus        │
                              │ scheduledMessageSid │
                              │ scheduledSendAt     │
                              │ isScheduled         │
                              │ sessionActive       │
                              │ sessionClosedAt     │
                              │ sentAt              │
                              │ createdAt           │
                              └─────────────────────┘

┌─────────────────────┐
│   organizations     │
├─────────────────────┤
│ id (PK)             │
│ name                │
│ description         │
│ contactEmail        │
│ contactPhone        │
│ address             │
│ createdAt           │
│ updatedAt           │
└─────────────────────┘
```

### Key Tables

| Table | Records (Est.) | Purpose |
|-------|----------------|---------|
| `system_users` | ~50 | Admin, dispatcher, driver login accounts |
| `users` | ~500-5,000 | Riders, caregivers, case managers |
| `service_providers` | ~50-200 | Driver profiles |
| `organizations` | ~10-50 | Organization grouping for providers |
| `vehicles` | ~20-100 | Fleet management |
| `rides` | ~1,000-50,000 | Ride history and active rides |
| `notifications` | ~10,000-500,000 | SMS history for compliance |

---

## API Design

### RESTful Endpoints

```
Authentication
  POST   /api/auth/login              # User authentication
  GET    /api/auth/me                 # Get current user

Users (Riders)
  GET    /api/users                   # List all users
  GET    /api/users/:uuid             # Get user by ID
  POST   /api/users                   # Create user
  PUT    /api/users/:uuid             # Update user
  DELETE /api/users/:uuid             # Delete user
  GET    /api/users/search?q=         # Fuzzy search

Ride Requests
  GET    /api/riderequests            # List all rides
  GET    /api/riderequests/:uuid      # Get ride details
  POST   /api/riderequests            # Create ride request
  PUT    /api/riderequests/:uuid      # Update ride/assign driver
  DELETE /api/riderequests/:uuid      # Cancel ride

Service Providers (Drivers)
  GET    /api/providers               # List all providers
  GET    /api/service-providers       # Alias for providers
  POST   /api/providers               # Create provider
  DELETE /api/providers/:uuid         # Delete provider

Vehicles
  GET    /api/vehicles                # List all vehicles
  POST   /api/vehicles                # Create vehicle
  DELETE /api/vehicles/:uuid          # Delete vehicle

Notifications
  GET    /api/notifications                    # List notifications
  POST   /api/notifications/send               # Send SMS
  POST   /api/notifications/webhook/twilio     # Twilio inbound webhook
  POST   /api/notifications/status/twilio      # Delivery status callback

Maps
  GET    /api/maps/autocomplete       # Address autocomplete (client-side)
  POST   /api/maps/calculate-travel-time  # Distance Matrix API

Health
  GET    /health                      # Health check
```

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────┐
│                    TWO-LAYER AUTHENTICATION                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Portal Password                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  • Shared password for initial access                │    │
│  │  • 24-hour session stored in localStorage            │    │
│  │  • Prevents unauthorized browsing                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                           ▼                                  │
│  Layer 2: User Authentication                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  • Username/password with bcrypt hashing             │    │
│  │  • Role-based access control (RBAC)                  │    │
│  │  • Session stored in sessionStorage                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Role Permissions:
┌──────────────────┬───────┬────────────┬────────┬──────────────┐
│ Feature          │ Admin │ Dispatcher │ Driver │ Case Manager │
├──────────────────┼───────┼────────────┼────────┼──────────────┤
│ View all rides   │  ✓    │     ✓      │   -    │      -       │
│ View own rides   │  ✓    │     ✓      │   ✓    │      ✓       │
│ Create rides     │  ✓    │     ✓      │   -    │      ✓       │
│ Assign drivers   │  ✓    │     ✓      │   -    │      -       │
│ Manage users     │  ✓    │     ✓      │   -    │      -       │
│ System settings  │  ✓    │     -      │   -    │      -       │
└──────────────────┴───────┴────────────┴────────┴──────────────┘
```

---

## SMS Notification System

### Provider Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SMS SERVICE LAYER                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐                                            │
│  │   Twilio    │ SMS Provider                               │
│  │   Provider  │                                            │
│  └──────┬──────┘                                            │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Notification Service                    │    │
│  │  • Message templating                                │    │
│  │  • Delivery status tracking                          │    │
│  │  • Message history for compliance                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Interactive SMS Flow

```
Driver Assignment (Dispatcher assigns driver in dashboard)
      │
      ▼
┌─────────────────┐    SMS to Rider & Case Manager:
│  Ride Confirmed │    "Ride Confirmed!
│  Notification   │     Driver: [Name]
│                 │     Vehicle: [Name]
│                 │     [Date/Time]
│                 │     Pickup: [Address]
│                 │     Drop off: [Address]
└────────┬────────┘     To Cancel ride, type 3"
         │
         ▼ (1 hour before pickup)
┌─────────────────┐    SMS to Rider:
│  1-Hour Prior   │    "Your driver will arrive in 1 hour.
│    Reminder     │     Reply 1 to confirm ride.
│                 │     Reply 2 to cancel ride."
└────────┬────────┘
         │
    ┌────┴────┐
    │  "1"    │         (Rider replies)
    ▼         ▼
┌─────────┐  ┌─────────┐
│Confirm  │  │ Cancel  │
│  Ride   │  │  Ride   │
└────┬────┘  └────┬────┘
     │            │
     ▼            ▼
┌─────────────────┐
│Continue to      │
│Pickup Time      │
└────────┬────────┘
         │
         ▼ (at pickup time)
┌─────────────────┐    SMS to Driver:
│  Arrival Check  │    "Have you arrived at pick up location?
│                 │     Reply 1 for yes, 2 for no."
└────────┬────────┘
         │
    ┌────┴────┐
    │  "1"    │         (Driver replies)
    ▼         ▼
┌─────────┐  ┌─────────┐
│ Arrived │  │En Route │
└────┬────┘  └────┬────┘
     │            │
     ▼            ▼
┌─────────────────┐    SMS to Rider & Case Manager:
│Status: 200      │    "Driver has arrived"
│RIDE_STARTED     │
└────────┬────────┘
         │
         ▼ (immediately after arrival confirmation)
┌─────────────────┐    SMS to Driver:
│  Pickup Check   │    "Have you picked up the rider and
│                 │     started the ride? 1-yes, 2-no"
└────────┬────────┘
         │
    ┌────┴────┐
    │  "1"    │         (Driver replies)
    ▼         ▼
┌─────────┐  ┌─────────┐
│ Picked  │  │ Waiting │
│   Up    │  │         │
└────┬────┘  └────┬────┘
     │            │
     ▼            ▼
┌─────────────────┐    SMS to Rider & Case Manager:
│Status: 300      │    "Driver is waiting. Driver will wait up
│RIDER_PICKED_UP  │     to 5 minute before canceling ride.
│                 │     To cancel ride reply 2."
└────────┬────────┘
         │
         ▼ (at estimated dropoff time)
┌─────────────────┐    SMS to Driver:
│  Dropoff Check  │    "Have you dropped off rider? 1-yes, 2-no"
└────────┬────────┘
         │
    ┌────┴────┐
    │  "1"    │         (Driver replies)
    ▼         ▼
┌─────────┐  ┌─────────┐
│Dropped  │  │ Ask     │
│  Off    │  │ Again   │
│         │  │(5 min)  │
└────┬────┘  └────┬────┘
     │            │
     ▼            ▼
┌─────────────────┐    SMS to Rider & Case Manager:
│Status: 400      │    "You have been dropped off"
│RIDER_DROPPED_OFF│
└────────┬────────┘
         │
    ┌────┴────┐
    │Not      │         Roundtrip?
    │Roundtrip│    ┌─────────────────┐
    ▼         ▼    ▼                 │
┌─────────┐  ┌─────────────────┐     │
│ Status: │  │ Roundtrip       │     │
│  500    │  │ Return Check    │◀────┘
│COMPLETE │  │                 │
└─────────┘  │ SMS to Driver:  │
             │ "Have you picked│
             │  up the rider   │
             │  and started    │
             │  the return     │
             │  ride? 1-yes,   │
             │  2-no"          │
             └────────┬────────┘
                      │
                 ┌────┴────┐
                 │  "1"    │
                 ▼         ▼
            ┌────────┐  ┌────────┐
            │Return  │  │Waiting │
            │Started │  │        │
            └───┬────┘  └───┬────┘
                │           │
                ▼           ▼
        ┌─────────────────────────┐
        │ Status: 450             │
        │ ROUNDTRIP_RETURNING     │
        └───────────┬─────────────┘
                    │
                    ▼ (at return dropoff time)
            ┌─────────────────┐
            │ Return Dropoff  │
            │    Check        │
            │                 │
            │ SMS to Driver:  │
            │ "Have you       │
            │  dropped off    │
            │  rider? 1-yes,  │
            │  2-no"          │
            └────────┬────────┘
                     │
                ┌────┴────┐
                │  "1"    │
                ▼         ▼
           ┌────────┐  ┌────────┐
           │Complete│  │Interr. │
           │ Status:│  │ Status:│
           │  475   │  │  479   │
           └────────┘  └────────┘
```

### Status Code Reference

| Code | Status | Description |
|------|--------|-------------|
| 0 | Request in Progress | Just created |
| 100 | Ride Confirmed | Driver assigned, ride scheduled |
| 109 | Canceled by Rider | Rider/case mgr canceled |
| 200 | Ride Started | Driver confirmed arrival |
| 300 | Rider Picked Up | Driver confirmed pickup |
| 400 | Rider Dropped Off | Driver confirmed dropoff |
| 450 | Roundtrip Returning | Return trip started |
| 475 | Roundtrip Complete | Return trip completed |
| 479 | Roundtrip Interrupted | Return ride had issue |
| 500 | Ride Complete | Final status (non-roundtrip) |

### Scheduler Implementation

The scheduling system uses a **hybrid approach** combining two mechanisms:

1. **In-Memory Timeouts** (`TaskManager`)
   - Used for immediate/short-term scheduled actions
   - Manages ride status transitions and notifications
   - Auto-cleanup after task execution

2. **Twilio Scheduled Messages**
   - Used for SMS delivery at specific times
   - Messages scheduled via Twilio's API
   - Stored in database with `scheduledMessageSid`

```javascript
// Example: Scheduling a driver arrival check
scheduler.scheduleDriverArrivalCheck(ride, driver);
// This schedules a Twilio message + in-memory timeout
```

---

## Infrastructure Requirements

### Minimum Production Requirements

| Component | Specification | Monthly Cost (Est.) |
|-----------|---------------|---------------------|
| **Frontend Hosting** | Static site, CDN | $0-7 |
| **Backend Server** | 512MB RAM, 0.5 vCPU | $7-25 |
| **PostgreSQL Database** | 256MB RAM, 1GB storage | $0-7 |
| **SMS Provider** | Pay-per-message | Variable |
| **Domain + SSL** | Included with hosting | $0 |

**Total Estimated Monthly Cost**: $15-50 (low traffic)

### Scaling Considerations

| Traffic Level | Users | Rides/Day | Recommended Setup |
|---------------|-------|-----------|-------------------|
| **Starter** | 1-50 | 10-50 | Render Free Tier |
| **Growth** | 50-500 | 50-200 | Render Starter ($7/service) |
| **Scale** | 500-5,000 | 200-1,000 | Render Pro + Connection Pooling |
| **Enterprise** | 5,000+ | 1,000+ | Dedicated infrastructure |

### Performance Benchmarks

| Metric | Target | Achieved |
|--------|--------|----------|
| API Response Time (p95) | <200ms | ~80ms |
| Time to First Byte | <500ms | ~200ms |
| Database Queries (avg) | <50ms | ~15ms |
| SMS Delivery | <5s | ~2-3s |
| Concurrent Users | 100+ | Tested 100 |

---

## Security Considerations

### Data Protection

- **Passwords**: bcrypt hashing with salt rounds
- **Transport**: HTTPS/TLS 1.3 enforced
- **Database**: Connection via encrypted internal network
- **Environment Variables**: Secrets managed via platform (never in code)

### TCPA Compliance (SMS)

- **Consent Tracking**: Explicit opt-in recorded per user (`smsConsentGiven`, `smsConsentTimestamp`, `smsConsentIpAddress`)
- **Opt-Out Handling**: STOP keyword processed automatically
- **Message History**: All SMS logged for compliance audits
- **Terms of Service**: Required acceptance before SMS enrollment

### Access Control

- **RBAC**: Role-based permissions on all endpoints
- **Session Management**: Automatic expiration
- **Input Validation**: Zod schemas on all inputs
- **Rate Limiting**: Configurable per endpoint

---

## Deployment Options

### Option 1: Render (Recommended)

```yaml
# render.yaml Blueprint
services:
  - type: web
    name: ride-request-fastify
    runtime: node
    rootDir: server-fastify
    buildCommand: bun install && npx prisma generate && npm run build
    startCommand: bun run start:prod
    
  - type: web
    name: ride-request-client
    runtime: static
    rootDir: client
    buildCommand: bun install && bun run build
    staticPublishPath: ./dist

databases:
  - name: rural-dispatch-postgres
    plan: free
```

### Option 2: Railway

- One-click deployment from GitHub
- Automatic PostgreSQL provisioning
- Usage-based pricing

### Option 3: Self-Hosted

**Requirements:**
- Linux server (Ubuntu 22.04 recommended)
- Node.js 20.x LTS
- PostgreSQL 15.x+
- Nginx (reverse proxy)
- Let's Encrypt (SSL)

---

## Development Setup

### Prerequisites

```bash
# Required
- Bun v1.0+ (or Node.js 20.x + npm)
- PostgreSQL 14+ (local or hosted)
- Git

# Optional
- VS Code with extensions (Prisma, TypeScript, Tailwind)
- Postman/Insomnia (API testing)
- ngrok (webhook testing)
```

### Quick Start

```bash
# Clone repository
git clone https://github.com/swarmnyc/ruraldispatch-ride-request.git
cd ruraldispatch-ride-request

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and API keys

# Setup database
bunx prisma migrate dev
bun run seed

# Start development
bun run dev

# Access application
# Frontend: http://localhost:3001
# Backend:  http://localhost:5001
```

---

## Key Design Decisions

### Display ID Format

Rides use a human-readable format `RIDE-XXXX` (e.g., `RIDE-X7K9`) stored in the `displayId` field. This provides:
- Easy reference for dispatchers and drivers
- Case-insensitive alphanumeric format
- Unique constraint in database

### UUID Strategy

All primary keys use Prisma's `uuid(7)` function:
- 7-character time-sortable UUIDs
- Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Better than auto-increment for distributed systems

### Timezone Handling

**Backend**: Always runs in UTC
- Server validates UTC timezone on startup
- All database timestamps stored in UTC
- All API responses use ISO 8601 UTC format

**Frontend**: Displays in user's local timezone
- Conversion happens in the browser
- `dateUtils.ts` utilities handle timezone math

---

## Roadmap & Future Enhancements

### Phase 1: Core Platform ✅
- [x] User management
- [x] Ride request workflow
- [x] Driver assignment
- [x] Two-way SMS notifications
- [x] Role-based access control

### Phase 2: Enhanced Features (Planned)
- [ ] Real-time GPS tracking
- [ ] Route optimization
- [ ] Mobile app (React Native)
- [ ] Recurring ride scheduling
- [ ] Payment integration

### Phase 3: Enterprise Features (Future)
- [ ] Multi-tenant architecture
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations
- [ ] White-label solution

---

## Contact & Support

- **Repository**: [GitHub](https://github.com/swarmnyc/ruraldispatch-ride-request)
- **Documentation**: See `/docs` folder in repository
- **License**: GNU General Public License v3.0

---

*This document is maintained as part of the Rural Dispatch project. For the latest version, see the repository.*
