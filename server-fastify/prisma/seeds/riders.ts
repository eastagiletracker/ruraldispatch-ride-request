/**
 * Service Users (Riders) Seed
 */

import { v7 as uuidv7 } from 'uuid';
import type { PrismaClient } from '../../node_modules/.prisma/client/index.js';

export async function seedRiders(prisma: PrismaClient) {
  console.log('\n👥 Seeding Service Users (Riders)...');

  const riders = [
    {
      uuid: uuidv7(),
      fullName: 'Maria Rodriguez',
      phone: '+15551234567',
      email: 'maria.rodriguez@example.com',
      address: '456 Broadway, New York, NY 10013',
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
      address: '789 5th Avenue, New York, NY 10022',
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
      address: '321 West 42nd Street, New York, NY 10036',
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
      smsConsentGiven: false,
      smsConsentTimestamp: null,
      smsConsentIpAddress: null,
    },
    {
      uuid: uuidv7(),
      fullName: 'David Martinez',
      phone: '+15551234572',
      email: 'david.m@example.com',
      address: '123 East 86th Street, New York, NY 10028',
      role: 'rider',
      smsConsentGiven: true,
      smsConsentTimestamp: new Date(),
      smsConsentIpAddress: '192.168.1.6',
    },
    {
      uuid: uuidv7(),
      fullName: 'Patricia Anderson',
      phone: '+15551234573',
      email: 'patricia.a@example.com',
      address: '567 Park Avenue, New York, NY 10065',
      role: 'rider',
      smsConsentGiven: false,
      smsConsentTimestamp: null,
      smsConsentIpAddress: null,
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
