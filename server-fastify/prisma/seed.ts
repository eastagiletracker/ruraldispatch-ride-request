/**
 * Prisma Seed Script - Main Orchestrator
 * Seeds the database with comprehensive demo data
 *
 * Run: npx prisma db seed
 */

import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from './generated/client/client.js';
import { seedDrivers } from './seeds/drivers.js';
import { seedOrganizations } from './seeds/organizations.js';
import { seedRiders } from './seeds/riders.js';
import { seedRides } from './seeds/rides.js';
// Import modular seed functions
import { seedSystemUsers } from './seeds/systemUsers.js';
import { seedVehicles } from './seeds/vehicles.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('\n🌱 Starting comprehensive database seed...\n');
  console.log('═'.repeat(70));

  // Seed in order (respecting foreign key dependencies)
  const systemUsers = await seedSystemUsers(prisma);
  const riders = await seedRiders(prisma);
  const organizations = await seedOrganizations(prisma);
  const drivers = await seedDrivers(prisma, organizations);
  const vehicles = await seedVehicles(prisma);
  const ridesCount = await seedRides(prisma, riders, drivers, vehicles);

  // ==================== SUMMARY ====================
  console.log('\n' + '═'.repeat(70));
  console.log('✨ Seed completed successfully!');
  console.log('═'.repeat(70));

  console.log('\n📋 DEMO CREDENTIALS:\n');
  console.log('ADMINS:');
  console.log('  Username: natecooper        Password: natecooper123');
  console.log('  Username: cassiebrinen      Password: cassiebrinen123');
  console.log('  Username: dominiquemorris   Password: dominiquemorris123\n');
  console.log('DISPATCHERS:');
  console.log('  Username: dispatcher        Password: dispatch123\n');
  console.log('CASE MANAGERS:');
  console.log('  Username: johanguse         Password: johanguse123\n');
  console.log('DRIVERS:');
  console.log('  Username: driver1           Password: driver123\n');

  console.log('📊 DATABASE STATISTICS:\n');
  console.log(`  System Users........... ${systemUsers.length}`);
  console.log(`  Service Users.......... ${riders.length}`);
  console.log(`  Organizations.......... ${organizations.length}`);
  console.log(`  Drivers................ ${drivers.length}`);
  console.log(`  Vehicles............... ${vehicles.length}`);
  console.log(`  Ride Requests.......... ${ridesCount}`);
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
