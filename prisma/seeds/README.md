# Prisma Seed System

This directory contains modular seed files for populating the database with demo data.

## Structure

```
prisma/
├── seed.ts                   # Main orchestrator
└── seeds/
    ├── README.md             # This file
    ├── systemUsers.ts        # Admin, dispatcher, case manager, driver accounts
    ├── riders.ts             # Service users (riders, caregivers)
    ├── drivers.ts            # Service providers (drivers)
    ├── vehicles.ts           # Fleet vehicles
    └── rides.ts              # Sample ride requests
```

## Usage

### Run All Seeds
```bash
npx prisma db seed
```

This will seed in the correct order (respecting foreign key dependencies):
1. System Users
2. Riders
3. Drivers
4. Vehicles
5. Ride Requests

### Customizing Seeds

Each seed file exports a function that you can call individually:

```typescript
import { seedSystemUsers } from './seeds/systemUsers.js';
import { seedRiders } from './seeds/riders.js';

// Seed only system users and riders
const systemUsers = await seedSystemUsers(prisma);
const riders = await seedRiders(prisma);
```

### Adding More Data

To add more demo data, edit the respective seed files:

- **More admins?** → Edit `prisma/seeds/systemUsers.ts`
- **More riders?** → Edit `prisma/seeds/riders.ts`
- **More drivers?** → Edit `prisma/seeds/drivers.ts`
- **More vehicles?** → Edit `prisma/seeds/vehicles.ts`
- **More rides?** → Edit `prisma/seeds/rides.ts`

All seed files use **upsert** to avoid duplicate key errors, so you can run `npx prisma db seed` multiple times safely.

## Demo Credentials

### Admins
- `natecooper` / `natecooper123`
- `cassiebrinen` / `cassiebrinen123`
- `dominiquemorris` / `dominiquemorris123`

### Dispatchers
- `dispatcher` / `dispatch123`

### Case Managers
- `johanguse` / `johanguse123`

### Drivers
- `driver1` / `driver123`

## Resetting Database

To completely reset the database and reseed:

```bash
npx prisma migrate reset
```

This will:
1. Drop all tables
2. Run all migrations
3. Run the seed script

## Adding New Seed Files

1. Create a new file in `prisma/seeds/` (e.g., `locations.ts`)
2. Export a function that accepts `PrismaClient`
3. Import and call it in `prisma/seed.ts`

Example:

```typescript
// prisma/seeds/locations.ts
export async function seedLocations(prisma: PrismaClient) {
  console.log('\n📍 Seeding Locations...');
  // ... seed logic
}

// prisma/seed.ts
import { seedLocations } from './seeds/locations.js';

async function main() {
  // ... other seeds
  await seedLocations(prisma);
}
```
