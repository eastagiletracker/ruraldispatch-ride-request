/**
 * Service Providers (Drivers) Seed
 */

import { v7 as uuidv7 } from 'uuid';
import type { PrismaClient } from '../../node_modules/.prisma/client/index.js';

export async function seedDrivers(prisma: PrismaClient, organizations: any[]) {
  console.log('\n🚗 Seeding Service Providers (Drivers)...');

  // Get organization IDs
  const eastconn = organizations.find((o) => o.name === 'EASTCONN');
  const generationsHealth = organizations.find((o) => o.name === 'Generations Health');

  const drivers = [
    {
      uuid: uuidv7(),
      fullName: 'Michael Chen',
      phone: '+18777804236',
      mobilePhone: '+18777804236',
      title: 'Senior Driver',
      organizationId: eastconn?.id,
      role: 'Driver',
    },
    {
      uuid: uuidv7(),
      fullName: 'Patricia Smith',
      mobilePhone: '+18777804236',
      title: 'Fleet Manager',
      organizationId: eastconn?.id,
      role: 'Fleet Manager',
    },
    {
      uuid: uuidv7(),
      fullName: 'David Martinez',
      phone: '+18777804236',
      mobilePhone: '+18777804236',
      title: 'Driver',
      organizationId: eastconn?.id,
      role: 'Driver',
    },
    {
      uuid: uuidv7(),
      fullName: 'Jennifer Lee',
      mobilePhone: '+18777804236',
      title: 'Lead Driver',
      organizationId: generationsHealth?.id,
      role: 'Driver',
    },
    {
      uuid: uuidv7(),
      fullName: 'Carlos Rodriguez',
      phone: '+18777804236',
      mobilePhone: '+18777804236',
      title: 'Driver',
      organizationId: generationsHealth?.id,
      role: 'Driver',
    },
  ];

  const createdDrivers: any[] = [];
  for (const driver of drivers) {
    const created = await prisma.serviceProvider.create({
      data: driver,
    });
    createdDrivers.push(created);
    console.log(`  ✅ Created driver: ${driver.fullName}`);
  }

  console.log(`\n  📊 Total: ${drivers.length} drivers`);

  return createdDrivers;
}
