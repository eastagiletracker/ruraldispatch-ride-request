/**
 * System Users Seed
 * Admin, Dispatcher, Case Manager, Driver accounts
 */

import bcrypt from 'bcryptjs';
import { v7 as uuidv7 } from 'uuid';
import type { PrismaClient } from '../generated/client/client.js';

export async function seedSystemUsers(prisma: PrismaClient) {
  console.log('\n👤 Seeding System Users...');

  const systemUsers = [
    // Admins
    {
      uuid: uuidv7(),
      username: 'natecooper',
      password: 'natecooper123',
      fullName: 'Nate Cooper',
      role: 'admin',
    },
    {
      uuid: uuidv7(),
      username: 'cassiebrinen',
      password: 'cassiebrinen123',
      fullName: 'Cassie Brinen',
      role: 'admin',
    },
    {
      uuid: uuidv7(),
      username: 'dominiquemorris',
      password: 'dominiquemorris123',
      fullName: 'Dominique Morris',
      role: 'admin',
    },
    // Dispatchers
    {
      uuid: uuidv7(),
      username: 'dispatcher',
      password: 'dispatch123',
      fullName: 'Dispatch Staff',
      role: 'dispatcher',
    },
    // Case Managers
    {
      uuid: uuidv7(),
      username: 'johanguse',
      password: 'johanguse123',
      fullName: 'Johan Guse',
      role: 'case_manager',
    },
    // Drivers (system users who can log in)
    {
      uuid: uuidv7(),
      username: 'driver1',
      password: 'driver123',
      fullName: 'Michael Chen',
      role: 'driver',
    },
  ];

  for (const user of systemUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    // Use upsert to avoid unique constraint errors
    await prisma.systemUser.upsert({
      where: { username: user.username },
      update: {},
      create: {
        uuid: user.uuid,
        username: user.username,
        passwordHash: hashedPassword,
        fullName: user.fullName,
        role: user.role,
        isActive: true,
      },
    });
    console.log(`  ✅ Created: ${user.username.padEnd(20)} (${user.role})`);
  }

  console.log(`\n  📊 Total: ${systemUsers.length} system users`);

  return systemUsers;
}
