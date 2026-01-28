# Rural Dispatch - Ride Request MVP

> A full-stack ride-sharing management application with React/TypeScript frontend, Node.js/Express backend, and PostgreSQL database with Prisma ORM.

## Features

- **Role-Based Access Control**: Admin, Dispatcher, Driver, and Case Manager roles
- **Ride Request Management**: Create, assign, and track ride requests
- **SMS Notifications**: Two-way SMS with Twilio integration
- **User Management**: Service users, drivers, and vehicles
- **Real-time Updates**: Live ride status tracking
- **TCPA Compliant**: SMS consent and opt-out handling

---

## Quick Start

### Prerequisites
- **Bun** v1.0.0 or higher
- **PostgreSQL** v14.0 or higher (local or hosted)
- **Git**

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/ride-request-mvp-johan.git
cd ride-request-mvp-johan

# Install all dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL DATABASE_URL and other credentials

# Run database migrations
bunx prisma migrate dev

# Seed demo data
bun run seed

# Start development server
bun run dev
```

### Access the Application

1. Open http://localhost:3001
2. **Portal Password**: `hackct25`
3. **Sign in** with demo credentials:

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| **Admin** | `admin` | `admin123` | Full system access |
| **Dispatch Staff** | `dispatcher` | `dispatch123` | Coordinate rides, assign drivers |
| **Case Manager** | `casemanager` | `case123` | Request rides for others |
| **Driver** | `gusedriver` | `gusedriver123` | View assigned rides |

---

## Development Setup

### Environment Configuration

Create `.env` in project root:

```bash
# PostgreSQL Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ride_request_app
# OR for hosted PostgreSQL (Railway, Render, Supabase):
# DATABASE_URL=postgresql://username:password@host:5432/database_name

# Server Configuration
NODE_ENV=development
PORT=5001
TZ=UTC

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Twilio SMS (Optional for development)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_MESSAGING_SERVICE_SID=
TWILIO_WEBHOOK_URL=http://localhost:5001/api/notifications/webhook/twilio
TWILIO_STATUS_CALLBACK_URL=http://localhost:5001/api/notifications/status/twilio
TWILIO_DISABLE_STATUS_CALLBACK=true

# Google Maps API (Optional)
VITE_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_SERVER_API_KEY=

# Client URL for CORS
CLIENT_URL=http://localhost:3001
```

### Database Setup

#### Option 1: Local PostgreSQL

```bash
# macOS (Homebrew)
brew install postgresql@16
brew services start postgresql@16

# Create database
psql postgres
CREATE DATABASE ride_request_app;
CREATE USER dev_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ride_request_app TO dev_user;
\q
```

#### Option 2: Hosted PostgreSQL (Railway/Render)

1. Sign up at [railway.app](https://railway.app) or [render.com](https://render.com)
2. Create PostgreSQL database
3. Copy `DATABASE_URL` from dashboard
4. Update `.env`

### Running Migrations & Seeds

```bash
# Generate Prisma Client
bunx prisma generate

# Run migrations
bunx prisma migrate dev

# Seed demo data
bun run seed

# Open database GUI
bunx prisma studio
```

### Development Workflow

```bash
# Run both client and server
bun run dev

# Run individually
bun run server   # Server only (port 5001)
bun run client   # Client only (port 3001)
```

---

## Seeding Database

### Quick Seed Commands

```bash
# Seed all demo data
bun run seed

# Or specific seeds
bun run seed:system-users    # Admin, dispatcher, driver, case manager accounts
bun run seed:users          # Riders and caregivers
bun run seed:providers      # Service providers (drivers)
bun run seed:vehicles       # Fleet vehicles
bun run seed:rides          # Demo ride requests
```

### Demo Data Created

| Collection | Count | Details |
|------------|-------|---------|
| **System Users** | 11 | admin, dispatcher, driver, case_manager accounts |
| **Service Users** | 5 | Riders and caregivers |
| **Service Providers** | 5 | Drivers and fleet manager profiles |
| **Vehicles** | 9 | Fleet vehicles with accessibility features |
| **Ride Requests** | 10 | Various statuses (unassigned, active, completed) |

**Total: 40 demo records**

### Demo Credentials

**System Users (Login Accounts):**
- `admin` / `admin123` - Full system access
- `dispatcher` / `dispatch123` - Coordinate rides
- `casemanager` / `case123` - Request rides for others
- `gusedriver` / `gusedriver123` - Driver login
- `driver-demo` / `driver123` - Legacy driver

**Note**: Drivers exist in TWO collections:
- `system_users` (role='driver') - For logging into the app
- `service_providers` - For being assigned to rides

---

## Understanding User Roles

### **Rider**
People who need transportation (clients, service users). Receives SMS updates about pickups, driver info, and ETAs.

### **Driver / Service Provider**
People providing transportation services. Accept ride requests, pick up riders, complete trips.

**Note**: Drivers exist in TWO places:
1. **Service Providers** (in System Manager) - Their profile, phone, assigned to rides
2. **Login Account** - Separate username/password for app access

### **Case Manager**
People managing rides for others (like elderly or disabled riders). Request rides on behalf of riders.

### **Dispatch Staff**
Team members coordinating rides:
- Request rides for users
- Assign drivers and vehicles
- Manage ride requests and statuses
- View **all rides** in the system

### **Admin**
System administrators with full access:
- Create all user account types
- Access System Manager (add/edit/delete data)
- Full dashboard with all management features

---

## Documentation

### 📚 Essential Guides
- **[System Design](./docs/SYSTEM_DESIGN.md)** - Architecture and technical overview
- **[API Reference](./docs/API_REFERENCE.md)** - Full API documentation
- **[Authentication Guide](./docs/AUTHENTICATION.md)** - Role-based access control
- **[SMS System Guide](./docs/SMS_SYSTEM_GUIDE.md)** - Automated SMS flow documentation

### 🔧 Configuration Guides
- **[SMS Setup](./docs/SMS_SETUP.md)** - Twilio configuration
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Deploy to Railway or Render
- **[Toll-Free Verification](./docs/TOLL_FREE_VERIFICATION.md)** - SMS compliance

### 📖 Reference
- **[CLAUDE.md](./CLAUDE.md)** - Project architecture overview
- **[SMS Flow Handout](./docs/SMS_FLOW_TEAM_HANDOUT.md)** - Quick SMS reference for team
- **[UI Design System](./docs/UI_DESIGN_SYSTEM.md)** - shadcn/ui components

---

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod validation
- React Router v6

### Backend
- Node.js + Fastify (TypeScript)
- PostgreSQL + Prisma ORM v7
- bcryptjs (authentication)
- SMS: Twilio

---

## Project Structure

```
ride-request-mvp-johan/
├── client/              # React frontend (Vite)
├── server-fastify/      # Fastify backend (TypeScript)
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── database/    # Prisma operations
│   └── prisma/          # Schema and migrations
├── shared/              # Shared Zod schemas
├── docs/                # Documentation
└── README.md            # This file
```

---

## Common Commands

```bash
# Development
bun run dev              # Run client + server concurrently
bun run client           # Run client only (port 3001)
bun run server           # Run server only (port 5001)

# Database
bunx prisma migrate dev  # Create and apply migrations
bunx prisma generate     # Generate Prisma Client
bunx prisma studio       # Open Prisma Studio (database GUI)
bun run seed             # Seed all demo data
bun run seed:reset       # Reset database and reseed

# Production
bun run build            # Build client for production
bun run start:prod       # Start production server
```

---

## Troubleshooting

### Port Already in Use
```bash
# Change server port in .env
PORT=5002
# Update client/vite.config.ts proxy target to match
```

### PostgreSQL Connection Failed
```bash
# Verify connection string in .env
DATABASE_URL=postgresql://username:password@localhost:5432/ride_request_app

# Test connection
psql $DATABASE_URL

# Check if PostgreSQL is running
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Linux
```

### TypeScript Errors
```bash
# Reinstall dependencies
bun install

# Regenerate Prisma Client
bunx prisma generate

# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Google Maps Not Loading
```bash
# Check VITE_GOOGLE_MAPS_API_KEY in .env
# Verify API key is valid in Google Cloud Console
# Enable required APIs:
#   - Places API (New)
#   - Maps JavaScript API
#   - Distance Matrix API
```

### SMS Not Sending
```bash
# Check provider status
curl http://localhost:5001/api/notifications/provider-status

# Verify Twilio credentials in .env
# Check account balance
# Verify phone number format (+1234567890)
```

---

## Testing

### Backend Tests (server-fastify)

```bash
cd server-fastify

# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage

# Run tests with UI
bun test:ui
```

### Test Structure

Tests are located in `__tests__/` directories:
- `server-fastify/src/services/__tests__/` - Unit tests for services
- `server-fastify/src/routes/__tests__/` - API endpoint tests
- `server-fastify/src/utils/__tests__/` - Utility function tests

### Writing Tests

Example unit test:
```typescript
import { describe, it, expect } from 'vitest';
import { parseResponse } from '../smsResponseHandler.js';

describe('parseResponse', () => {
  it('should parse "1" as yes', () => {
    expect(parseResponse('1')).toBe(1);
  });
});
```

---

## Contributing

1. Read the [System Design Guide](./docs/SYSTEM_DESIGN.md)
2. Check the [CLAUDE.md](./CLAUDE.md) for architecture details
3. Review existing documentation in `/docs`
4. Follow the established patterns and conventions

---

## License

This project is licensed under the **GNU General Public License v3.0**.

See the [LICENSE.md](./LICENSE.md) file for full license text and details.
