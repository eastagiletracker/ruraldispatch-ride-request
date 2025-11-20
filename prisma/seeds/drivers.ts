/**
 * Service Providers (Drivers) Seed
 */

import { PrismaClient } from '../generated/client/client.js';
import { v7 as uuidv7 } from 'uuid';

export async function seedDrivers(prisma: PrismaClient, organizations: any[]) {
  console.log('\n🚗 Seeding Service Providers (Drivers)...');

  // Get organization IDs
  const eastconn = organizations.find(o => o.name === 'EASTCONN');
  const generationsHealth = organizations.find(o => o.name === 'Generations Health');

  const drivers = [
    {
      uuid: uuidv7(),
      fullName: 'Michael Chen',
      phone: '+16465551234',
      mobilePhone: '+16465551234',
      title: 'Senior Driver',
      organizationId: eastconn?.id,
      role: 'Driver',
    },
    {
      uuid: uuidv7(),
      fullName: 'Patricia Smith',
      phone: '+12125555678',
      mobilePhone: '+12125555678',
      title: 'Fleet Manager',
      organizationId: eastconn?.id,
      role: 'Fleet Manager',
    },
    {
      uuid: uuidv7(),
      fullName: 'David Martinez',
      phone: '+13105559999',
      mobilePhone: '+13105559999',
      title: 'Driver',
      organizationId: eastconn?.id,
      role: 'Driver',
    },
    {
      uuid: uuidv7(),
      fullName: 'Jennifer Lee',
      phone: '+14155557777',
      mobilePhone: '+14155557777',
      title: 'Lead Driver',
      organizationId: generationsHealth?.id,
      role: 'Driver',
    },
    {
      uuid: uuidv7(),
      fullName: 'Carlos Rodriguez',
      phone: '+16465556666',
      mobilePhone: '+16465556666',
      title: 'Driver',
      organizationId: generationsHealth?.id,
      role: 'Driver',
    },
  ];

  const createdDrivers: any[] = [];
  for (const driver of drivers) {
    // Use upsert to avoid unique constraint on mobilePhone
    const created = await prisma.serviceProvider.upsert({
      where: { mobilePhone: driver.mobilePhone },
      update: {},
      create: driver,
    });
    createdDrivers.push(created);
    console.log(`  ✅ Created driver: ${driver.fullName}`);
  }

  console.log(`\n  📊 Total: ${drivers.length} drivers`);

  return createdDrivers;
}
