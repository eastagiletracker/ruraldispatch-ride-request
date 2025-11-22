/**
 * Service Users (Riders) Seed
 */

import { v7 as uuidv7 } from 'uuid';
import type { PrismaClient } from '../generated/client/client.js';

export async function seedRiders(prisma: PrismaClient) {
  console.log('\n👥 Seeding Service Users (Riders)...');

  const riders = [
    {
      uuid: uuidv7(),
      fullName: 'Maria Rodriguez',
      phone: '+15551234567',
      email: 'maria.rodriguez@example.com',
      role: 'rider',
      smsConsentGiven: true,
      smsConsentTimestamp: new Date(),
      smsConsentIpAddress: '192.168.1.1',
    },
    {
      uuid: uuidv7(),
      fullName: 'James Wilson',
      phone: '+15551234568',
      email: 'james.wilson@placeholder.com',
      role: 'rider',
      smsConsentGiven: true,
      smsConsentTimestamp: new Date(),
      smsConsentIpAddress: '192.168.1.2',
    },
    {
      uuid: uuidv7(),
      fullName: 'Emily Chen',
      phone: '+15551234569',
      role: 'rider',
      smsConsentGiven: true,
      smsConsentTimestamp: new Date(),
      smsConsentIpAddress: '192.168.1.3',
    },
    {
      uuid: uuidv7(),
      fullName: 'Robert Taylor',
      phone: '+15551234570',
      email: 'rtaylor@placeholder.com',
      role: 'rider',
      smsConsentGiven: true,
      smsConsentTimestamp: new Date(),
      smsConsentIpAddress: '192.168.1.4',
    },
    {
      uuid: uuidv7(),
      fullName: 'Sarah Johnson',
      phone: '+15551234571',
      role: 'caregiver',
      smsConsentGiven: true,
      smsConsentTimestamp: new Date(),
      smsConsentIpAddress: '192.168.1.5',
    },
    {
      uuid: uuidv7(),
      fullName: 'David Martinez',
      phone: '+15551234572',
      email: 'david.m@example.com',
      role: 'rider',
      smsConsentGiven: true,
      smsConsentTimestamp: new Date(),
      smsConsentIpAddress: '192.168.1.6',
    },
  ];

  const createdRiders: any[] = [];
  for (const rider of riders) {
    const created = await prisma.user.create({
      data: rider,
    });
    createdRiders.push(created);
    console.log(`  ✅ Created ${rider.role}: ${rider.fullName}`);
  }

  console.log(`\n  📊 Total: ${riders.length} service users`);

  return createdRiders;
}
