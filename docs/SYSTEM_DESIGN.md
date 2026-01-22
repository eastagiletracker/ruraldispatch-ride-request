# Rural Dispatch - System Design Document

> **Version**: 1.0  
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
│                              CLIENTS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │   Web Browser   │  │   SMS (Twilio)  │  │   SMS (Vonage/Backup)   │  │
│  │   React SPA     │  │   Inbound/Out   │  │   Fallback Provider     │  │
│  └────────┬────────┘  └────────┬────────┘  └────────────┬────────────┘  │
└───────────┼────────────────────┼────────────────────────┼───────────────┘
            │                    │                        │
            │ HTTPS              │ Webhooks               │ Webhooks
            ▼                    ▼                        ▼
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
│  │  (REST API)  │  │ (Auth/RBAC)  │  │ (SMS/Notif)  │  │  (Cron)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐        ┌─────────────────────────────────┐ │
│  │   Prisma ORM (v7)       │───────▶│   PostgreSQL Database           │ │
│  │   Type-safe queries     │        │   (Render/Railway/Supabase)     │ │
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
| **Zod** | 3.x | Schema validation |
| **Axios** | 1.x | HTTP client |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20.x LTS | Runtime environment |
| **Fastify** | 5.x | High-performance web framework |
| **TypeScript** | 5.x | Type safety |
| **Prisma** | 7.x | ORM with type-safe database access |
| **PostgreSQL** | 15.x+ | Relational database |
| **Zod** | 3.x | Request/response validation |
| **bcryptjs** | 2.x | Password hashing |
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
| **Twilio** | Primary SMS provider |
| **Vonage** | Fallback SMS provider |
| **Google Maps API** | Address autocomplete, geocoding, distance matrix |

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│    system_users     │       │       users         │
├─────────────────────┤       ├─────────────────────┤
│ uuid (PK)           │       │ uuid (PK)           │
│ username            │       │ fullName            │
│ password (hashed)   │       │ phone               │
│ role                │       │ email               │
│ isActive            │       │ address             │
│ createdAt           │       │ smsConsent          │
│ updatedAt           │       │ serviceUserRole[]   │
└─────────────────────┘       │ createdAt           │
                              │ updatedAt           │
                              └──────────┬──────────┘
                                         │
                                         │ 1:N
                                         ▼
┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│  service_providers  │       │       rides         │       │      vehicles       │
├─────────────────────┤       ├─────────────────────┤       ├─────────────────────┤
│ uuid (PK)           │       │ uuid (PK)           │       │ uuid (PK)           │
│ fullName            │       │ displayId           │       │ make                │
│ phone               │◀──────│ riderUuid (FK)      │──────▶│ model               │
│ email               │   N:1 │ driverUuid (FK)     │ N:1   │ year                │
│ organization        │       │ vehicleUuid (FK)    │       │ licensePlate        │
│ isActive            │       │ pickupAddress       │       │ accessibility[]     │
│ createdAt           │       │ dropOffAddress      │       │ isActive            │
└─────────────────────┘       │ pickupRequestedTime │       │ createdAt           │
                              │ rideStatus          │       └─────────────────────┘
                              │ rideRequestStatus   │
                              │ createdAt           │
                              └──────────┬──────────┘
                                         │
                                         │ 1:N
                                         ▼
                              ┌─────────────────────┐
                              │    notifications    │
                              ├─────────────────────┤
                              │ uuid (PK)           │
                              │ rideUuid (FK)       │
                              │ recipientPhone      │
                              │ message             │
                              │ messageType         │
                              │ provider            │
                              │ status              │
                              │ createdAt           │
                              └─────────────────────┘
```

### Key Tables

| Table | Records (Est.) | Purpose |
|-------|----------------|---------|
| `system_users` | ~50 | Admin, dispatcher, driver login accounts |
| `users` | ~500-5,000 | Riders, caregivers, case managers |
| `service_providers` | ~50-200 | Driver profiles |
| `vehicles` | ~20-100 | Fleet management |
| `rides` | ~1,000-50,000 | Ride history and active rides |
| `notifications` | ~10,000-500,000 | SMS history for compliance |

---

## API Design

### RESTful Endpoints

```
Authentication
  POST   /api/auth/login              # User authentication
  POST   /api/auth/register           # Create new user
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
  POST   /api/providers               # Create provider
  DELETE /api/providers/:uuid         # Delete provider

Vehicles
  GET    /api/vehicles                # List all vehicles
  POST   /api/vehicles                # Create vehicle
  DELETE /api/vehicles/:uuid          # Delete vehicle

Notifications
  GET    /api/notifications           # List notifications
  POST   /api/notifications/send      # Send SMS
  POST   /api/notifications/webhook/twilio   # Twilio inbound
  POST   /api/notifications/webhook/vonage   # Vonage inbound
  POST   /api/notifications/status/twilio    # Delivery status

Maps
  POST   /api/maps/calculate-travel-time     # Distance Matrix

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
│  ┌─────────────┐         ┌─────────────┐                    │
│  │   Twilio    │ Primary │   Vonage    │ Fallback           │
│  │   Provider  │────────▶│   Provider  │                    │
│  └──────┬──────┘         └──────┬──────┘                    │
│         │                       │                            │
│         ▼                       ▼                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Unified Message Queue                   │    │
│  │  • Automatic failover on provider errors             │    │
│  │  • Delivery status tracking                          │    │
│  │  • Message history for compliance                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Interactive SMS Flow

```
Driver Assignment
      │
      ▼
┌─────────────────┐    SMS: "You have been assigned to pick up
│  Send Initial   │          John at 123 Main St at 10:00 AM"
│  Notification   │
└────────┬────────┘
         │
         ▼ (1 hour before pickup)
┌─────────────────┐    SMS: "Reminder: Pickup in 1 hour"
│  1-Hour Reminder│
└────────┬────────┘
         │
         ▼ (at pickup time)
┌─────────────────┐    SMS: "Have you arrived? Reply:
│  Arrival Check  │          1=Yes, 2=Running Late"
└────────┬────────┘
         │
    ┌────┴────┐
    │  "1"    │         (Driver replies)
    ▼         ▼
┌─────────┐  ┌─────────┐
│ Notify  │  │  Wait   │
│ Rider   │  │  5 min  │
└────┬────┘  └────┬────┘
     │            │
     ▼            ▼
┌─────────────────┐    SMS: "Did you pick up the rider?
│  Pickup Check   │          1=Yes, 2=No Show"
└────────┬────────┘
         │
         ▼ (at drop-off time)
┌─────────────────┐    SMS: "Did you complete the drop-off?
│  Dropoff Check  │          1=Yes, 2=Issue"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Ride Complete  │
└─────────────────┘
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

- **Consent Tracking**: Explicit opt-in recorded per user
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
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm run start:prod
    
  - type: web
    name: ride-request-client
    runtime: static
    rootDir: client
    buildCommand: npm install && npm run build
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
# Backend:  http://localhost:5000
```

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
