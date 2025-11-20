/**
 * Service Users (Riders) Seed
 */

import { PrismaClient } from '../generated/client/client.js';
import { v7 as uuidv7 } from 'uuid';

export async function seedRiders(prisma: PrismaClient) {
  console.log('\n👥 Seeding Service Users (Riders)...');

  const riders = [
    {
      uuid: uuidv7(),
      fullName: 'Maria Rodriguez',
      phone: '+12125551234',
      role: 'rider',
      smsConsentGiven: true,
      smsConsentTimestamp: new Date(),
      smsConsentIpAddress: '192.168.1.1',
    },
    {
      uuid: uuidv7(),
      fullName: 'James Wilson',
      phone: '+14155554444',
      role: 'rider',
      smsConsentGiven: true,
      smsConsentTimestamp: new Date(),
      smsConsentIpAddress: '192.168.1.2',
    },
    {
      uuid: uuidv7(),
      fullName: 'Emily Chen',
      phone: '+16465551111',
      role: 'rider',
      smsConsentGiven: false,
    },
    {
      uuid: uuidv7(),
      fullName: 'Robert Taylor',
      phone: '+13105558888',
      role: 'rider',
      smsConsentGiven: true,
      smsConsentTimestamp: new Date(),
      smsConsentIpAddress: '192.168.1.3',
    },
    {
      uuid: uuidv7(),
      fullName: 'Sarah Johnson',
      phone: '+14155552222',
      role: 'caregiver',
      smsConsentGiven: true,
      smsConsentTimestamp: new Date(),
      smsConsentIpAddress: '192.168.1.4',
    },
    {
      uuid: uuidv7(),
      fullName: 'David Martinez',
      phone: '+12125559999',
      role: 'rider',
      smsConsentGiven: true,
      smsConsentTimestamp: new Date(),
      smsConsentIpAddress: '192.168.1.5',
    },
  ];

  const createdRiders: any[] = [];
  for (const rider of riders) {
    // Use upsert to avoid unique constraint on phone
    const created = await prisma.user.upsert({
      where: { phone: rider.phone },
      update: {},
      create: rider,
    });
    createdRiders.push(created);
    console.log(`  ✅ Created ${rider.role}: ${rider.fullName}`);
  }

  console.log(`\n  📊 Total: ${riders.length} service users`);

  return createdRiders;
}
