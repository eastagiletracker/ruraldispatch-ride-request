/**
 * Vehicles Seed
 */

import { PrismaClient } from '../generated/client/client.js';
import { v7 as uuidv7 } from 'uuid';

export async function seedVehicles(prisma: PrismaClient) {
  console.log('\n🚐 Seeding Vehicles...');

  const vehicles = [
    {
      uuid: uuidv7(),
      displayName: '2023 Toyota Sienna (Silver) - ABC1234',
      fleetId: 'VH-001',
      model: 'Toyota Sienna',
      year: 2023,
      color: 'Silver',
      licensePlate: 'ABC1234',
      capacity: 7,
      serviceArea: 'Manhattan & Brooklyn',
      wheelchairAccessible: true,
      walkerAccessible: true,
      serviceAnimalFriendly: true,
      oxygenTankAccessible: false,
    },
    {
      uuid: uuidv7(),
      displayName: '2022 Honda Odyssey (Blue) - XYZ5678',
      fleetId: 'VH-002',
      model: 'Honda Odyssey',
      year: 2022,
      color: 'Blue',
      licensePlate: 'XYZ5678',
      capacity: 8,
      serviceArea: 'Queens & Bronx',
      wheelchairAccessible: false,
      walkerAccessible: true,
      serviceAnimalFriendly: true,
      oxygenTankAccessible: true,
    },
    {
      uuid: uuidv7(),
      displayName: '2024 Chrysler Pacifica (White) - DEF9012',
      fleetId: 'VH-003',
      model: 'Chrysler Pacifica',
      year: 2024,
      color: 'White',
      licensePlate: 'DEF9012',
      capacity: 7,
      serviceArea: 'Manhattan & Queens',
      wheelchairAccessible: true,
      walkerAccessible: true,
      serviceAnimalFriendly: true,
      oxygenTankAccessible: true,
    },
    {
      uuid: uuidv7(),
      displayName: '2023 Ford Transit (Gray) - GHI3456',
      fleetId: 'VH-004',
      model: 'Ford Transit',
      year: 2023,
      color: 'Gray',
      licensePlate: 'GHI3456',
      capacity: 12,
      serviceArea: 'All NYC Boroughs',
      wheelchairAccessible: true,
      walkerAccessible: true,
      serviceAnimalFriendly: true,
      oxygenTankAccessible: true,
    },
    {
      uuid: uuidv7(),
      displayName: '2022 Dodge Grand Caravan (Red) - JKL7890',
      fleetId: 'VH-005',
      model: 'Dodge Grand Caravan',
      year: 2022,
      color: 'Red',
      licensePlate: 'JKL7890',
      capacity: 7,
      serviceArea: 'Brooklyn & Staten Island',
      wheelchairAccessible: false,
      walkerAccessible: true,
      serviceAnimalFriendly: true,
      oxygenTankAccessible: false,
    },
  ];

  const createdVehicles: any[] = [];
  for (const vehicle of vehicles) {
    // Use upsert to avoid unique constraint on licensePlate
    const created = await prisma.vehicle.upsert({
      where: { licensePlate: vehicle.licensePlate },
      update: {},
      create: vehicle,
    });
    createdVehicles.push(created);
    console.log(`  ✅ Created vehicle: ${vehicle.displayName}`);
  }

  console.log(`\n  📊 Total: ${vehicles.length} vehicles`);

  return createdVehicles;
}
