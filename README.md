# Rural Dispatch - Ride Request MVP

> A full-stack ride-sharing management application with React/TypeScript frontend, Node.js/Express backend, and PostgreSQL database with Prisma ORM.

## Features

- **Role-Based Access Control**: Admin, Dispatcher, Driver, and Case Manager roles
- **Ride Request Management**: Create, assign, and track ride requests
- **SMS Notifications**: Two-way SMS with Twilio/Vonage integration
- **User Management**: Service users, drivers, and vehicles
- **Real-time Updates**: Live ride status tracking
- **TCPA Compliant**: SMS consent and opt-out handling

---

## Quick Start

### Prerequisites
- **Bun** v1.0.0 or higher
- **PostgreSQL** v14.0 or higher (local or hosted)

### Installation

```bash
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

## Documentation

For detailed setup, development, and deployment instructions:

### 📚 Essential Guides
- **[Development Guide](./docs/DEVELOPMENT_GUIDE.md)** - Complete local setup and workflow
- **[API Reference](./docs/API_REFERENCE.md)** - Full API documentation with examples
- **[Authentication Guide](./docs/AUTHENTICATION.md)** - Role-based access control details

### 🔧 Configuration Guides
- **[SMS Setup](./docs/SMS_SETUP.md)** - Twilio and Vonage configuration
- **[Database Seeding](./docs/SEEDING.md)** - Populate demo data
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Deploy to Railway or Render (staging + production)

### 🧪 Testing & Quality
- **[Testing Guide](./docs/TESTING_GUIDE.md)** - Test setup and best practices

### 📖 Additional Resources
- **[CLAUDE.md](./CLAUDE.md)** - Project architecture overview for AI assistants
- **[Toll-Free Verification](./docs/TOLL_FREE_VERIFICATION.md)** - SMS compliance setup
- **[UI Design System](./docs/UI_DESIGN_SYSTEM.md)** - shadcn/ui components
- **[Zod Validation](./docs/ZOD_VALIDATION.md)** - Form validation patterns

---

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod validation
- React Router v6

### Backend
- Node.js + Express (ESM modules)
- PostgreSQL + Prisma ORM v7
- bcryptjs (authentication)
- SMS: Twilio (primary) + Vonage (fallback)

---

## Understanding User Roles

### 1. **Rider**
**Who**: People who need transportation (clients, service users)
**What they do**: Request rides and receive confirmations
**Access**: Can request rides and view ride history
**SMS**: Receives updates about pickups, driver info, and ETAs

**Examples**: John Smith, Mary Johnson

---

### 2. **Driver / Service Provider**
**Who**: People providing transportation services
**What they do**: Accept ride requests, pick up riders, complete trips
**Access**: Can view available and assigned rides, and update statuses
**Login**: Use their username and password

**Note**: Drivers exist in TWO places:
1. **Service Providers** (in System Manager) - Their profile, phone, assigned to rides
2. **Login Account** - Separate username/password for app access

**Example**: Driver "Johan Guse":
- Profile in Providers: Johan Guse (+5547991274449) - Gets assigned to rides
- Login account: Username `gusedriver` / Password `gusedriver123` - Logs into app

---

### 3. **Caregiver / Relative / Guardian / Case Manager**
**Who**: People managing rides for others (like elderly or disabled riders)
**What they do**: Request rides on behalf of the actual rider
**Access**: Can create ride requests and manage riders
**Login**: Username and password

**Example**: `casemanager` / `case123`

---

### 4. **Dispatch Staff**
**Who**: Team members coordinating rides
**What they do**:
- Request rides for users
- Assign drivers and vehicles to rides
- Manage ride requests and statuses
- View **all rides** in the system

**Access**: Cannot access System Manager or delete data
**Login**: Username and password

**Example**: `dispatcher` / `dispatch123`

---

### 5. **Admin**
**Who**: System administrators with full access
**What they do**:
- Create user accounts (all types)
- Request rides for users
- Assign drivers and vehicles
- Manage ride requests
- Access System Manager to add/edit/delete any data

**Access**: Full dashboard with all management features
**Login**: Username and password

**Example**: `admin` / `admin123`

---

## System Manager - Managing Data (Admin Only)

The **System Manager** is accessible only to **Admins** and has 5 tabs for managing different types of data:

### 1. **Riders Tab**
Manage the people who need rides. Add new riders, edit their information, or remove them from the system.

### 2. **Providers Tab**
Manage your drivers and transportation staff (these are the profiles that get assigned to rides, separate from login accounts).

### 3. **Vehicles Tab**
Manage your fleet vehicles. Each vehicle can be assigned to rides along with a driver.

**Examples**: 2023 Toyota Sienna (Silver) - XYZ1234, 2022 Honda Odyssey (Black) - ABC5678

### 4. **Dispatchers Tab**
Manage dispatcher accounts who coordinate daily operations. Add, edit, activate/deactivate, or remove dispatcher accounts.

### 5. **Case Managers Tab**
Manage case manager accounts who request rides on behalf of riders. Add, edit, activate/deactivate, or remove case manager accounts.

---

## Project Structure

```
ride-request-mvp-johan/
├── client/          # React frontend (Vite)
├── server/          # Express backend
├── shared/          # Shared Zod schemas
├── docs/            # Documentation
└── README.md        # This file
```

---

## Common Commands

```bash
# Development
bun run dev              # Run client + server concurrently
bun run client           # Run client only (port 3001)
bun run server           # Run server only (port 5000)

# Database
bunx prisma migrate dev  # Create and apply database migrations
bunx prisma generate     # Generate Prisma Client
bunx prisma studio       # Open Prisma Studio (database GUI)
bun run seed             # Seed all demo data

# Production
bun run build            # Build client for production
bun start                # Start production server
```

---

## Quick Troubleshooting

### Port Already in Use
```bash
# Change server port in .env
PORT=5001

# Update client/vite.config.ts proxy target to match
```

### PostgreSQL Connection Failed
```bash
# Verify connection string in .env
DATABASE_URL=postgresql://username:password@localhost:5432/ride_request_app
# OR for hosted PostgreSQL:
DATABASE_URL=postgresql://username:password@host:5432/database_name
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

For more troubleshooting, see the [Development Guide](./docs/DEVELOPMENT_GUIDE.md#troubleshooting).

---

## Contributing

1. Read the [Development Guide](./docs/DEVELOPMENT_GUIDE.md)
2. Check the [CLAUDE.md](./CLAUDE.md) for architecture details
3. Review existing documentation in `/docs`
4. Follow the established patterns and conventions

---

## License

This project is licensed under the **GNU General Public License v3.0**.

See the [LICENSE.md](./LICENSE.md) file for full license text and details.

---

## Support

For questions or issues:
- Check the [Development Guide](./docs/DEVELOPMENT_GUIDE.md)
- Review the [API Reference](./docs/API_REFERENCE.md)
- See [Troubleshooting](./docs/DEVELOPMENT_GUIDE.md#troubleshooting)