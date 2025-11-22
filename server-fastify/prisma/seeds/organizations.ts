/**
 * Organizations Seed
 * Transportation provider organizations
 */

import type { PrismaClient } from '../generated/client/client.js';

export async function seedOrganizations(prisma: PrismaClient) {
  console.log('\n🏢 Seeding Organizations...');

  const organizations = [
    {
      id: 1,
      name: 'EASTCONN',
      description: 'Educational and community services organization',
      contactEmail: 'info@eastconn.org',
      contactPhone: '+18604554000',
      address: '376 Hartford Turnpike, Hampton, CT 06247',
    },
    {
      id: 2,
      name: 'Generations Health',
      description: 'Healthcare and transportation services for seniors and disabled individuals',
      contactEmail: 'contact@generationshealth.org',
      contactPhone: '+18005559876',
      address: '100 Main Street, Hartford, CT 06103',
    },
  ];

  const createdOrganizations: any[] = [];
  for (const org of organizations) {
    // Use upsert to avoid duplicate errors
    const created = await prisma.organization.upsert({
      where: { id: org.id },
      update: {},
      create: org,
    });
    createdOrganizations.push(created);
    console.log(`  ✅ Created organization: ${org.name}`);
  }

  console.log(`\n  📊 Total: ${organizations.length} organizations`);

  return createdOrganizations;
}
