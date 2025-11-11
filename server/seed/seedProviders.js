/**
 * Seed script to create demo service providers
 * Run this script to populate the service-providers collection with demo data
 *
 * Usage: node server/database/seedProviders.js
 *
 * Service providers can offer various services:
 * - Transportation
 * - Medical
 * - Social Services
 * - etc.
 */

require('dotenv').config({ path: '../../.env' });
const generateApi = require('../database/api');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/**
 * Demo service providers (Drivers and other service providers)
 * Drivers provide transportation services and can view assigned rides
 */
const demoProviders = [
    {
        fullName: 'Michael Chen',
        title: 'Driver',
        organization: 'EASTCONN',
        mobilePhone: '+16465551234',
        serviceProviderRole: 'Driver',
        specializations: 'Wheelchair accessible, Long distance',
        faxPhone: '',
        email: 'michael.chen@eastconn.org',
        password: 'michaeldriver123' // Will be hashed
    },
    {
        fullName: 'Patricia Smith',
        title: 'Senior Driver',
        organization: 'EASTCONN',
        mobilePhone: '+12125555678',
        serviceProviderRole: 'Driver',
        specializations: 'Medical appointments, Senior care',
        faxPhone: '',
        email: 'patricia.smith@eastconn.org',
        password: 'patriciadriver123' // Will be hashed
    },
    {
        fullName: 'David Martinez',
        title: 'Driver',
        organization: 'Generations Health',
        mobilePhone: '+13105559999',
        serviceProviderRole: 'Driver',
        specializations: 'Medical appointments, Bilingual',
        faxPhone: '',
        email: 'david.martinez@generationshealth.org',
        password: 'daviddriver123' // Will be hashed
    },
    {
        fullName: 'Lisa Anderson',
        title: 'Fleet Manager',
        organization: 'EASTCONN',
        mobilePhone: '+14155553333',
        serviceProviderRole: 'Fleet Manager',
        specializations: 'Vehicle coordination, Dispatch',
        faxPhone: '+14155554444',
        email: 'lisa.anderson@eastconn.org',
        password: 'lisafleet123' // Will be hashed
    }
];

async function seedProviders() {
    try {
        console.log('\n🌱 Starting service providers seed...\n');
        console.log('═'.repeat(90));

        const api = await generateApi();

        // RESET: Delete all existing providers
        console.log('\n🗑️  Clearing existing service providers...');
        const existingProviders = await api.getProviders();

        if (existingProviders.length > 0) {
            console.log(`   Found ${existingProviders.length} existing provider(s)`);

            for (const provider of existingProviders) {
                await api.deleteProvider(provider.uuid);
                console.log(`   ✓ Deleted: ${provider.fullName || provider.name}`);
            }

            console.log(`\n   ✅ Successfully cleared ${existingProviders.length} provider(s)\n`);
        } else {
            console.log('   No existing providers found\n');
        }

        // Create new providers
        console.log('🏢 Creating fresh demo service providers...\n');

        const createdProviders = [];
        const failedProviders = [];

        for (const providerData of demoProviders) {
            try {
                // Hash password
                const hashedPassword = await bcrypt.hash(providerData.password, 10);

                // Add UUID and hashed password
                const providerWithUuid = {
                    ...providerData,
                    uuid: uuidv4(),
                    password: hashedPassword
                };

                // Create the provider
                const result = await api.addProvider(providerWithUuid);

                createdProviders.push(providerData);
                const role = providerData.serviceProviderRole.padEnd(15);
                console.log(`✅ Created: ${providerData.fullName.padEnd(25)} | ${role} | ${providerData.organization.padEnd(20)} | ${providerData.email}`);

            } catch (error) {
                failedProviders.push({ name: providerData.fullName, error: error.message });
                console.error(`❌ Failed: ${providerData.fullName.padEnd(25)} | ${error.message}`);
            }
        }

        // Print summary
        console.log('\n' + '═'.repeat(90));
        console.log('📊 SEED SUMMARY\n');
        console.log(`✅ Successfully created: ${createdProviders.length} provider(s)`);
        if (failedProviders.length > 0) {
            console.log(`❌ Failed: ${failedProviders.length} provider(s)\n`);
            failedProviders.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
        }

        // Print providers by role
        console.log('\n📋 CREATED PROVIDERS BY ROLE\n');
        console.log('═'.repeat(90));

        const roleGroups = {};
        createdProviders.forEach(provider => {
            const role = provider.serviceProviderRole;
            if (!roleGroups[role]) {
                roleGroups[role] = [];
            }
            roleGroups[role].push(provider);
        });

        Object.entries(roleGroups).forEach(([role, providers]) => {
            console.log(`\n${role.toUpperCase()}:`);
            console.log('─'.repeat(90));
            providers.forEach(provider => {
                console.log(`  Name:          ${provider.fullName}`);
                console.log(`  Title:         ${provider.title}`);
                console.log(`  Organization:  ${provider.organization}`);
                console.log(`  Email:         ${provider.email}`);
                console.log(`  Password:      ${provider.password} (for demo purposes)`);
                console.log(`  Mobile Phone:  ${provider.mobilePhone}`);
                if (provider.specializations) {
                    console.log(`  Specialties:   ${provider.specializations}`);
                }
                if (provider.faxPhone) {
                    console.log(`  Fax:           ${provider.faxPhone}`);
                }
                console.log('');
            });
        });

        console.log('═'.repeat(90));
        console.log('\n✨ Seed completed successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

// Run the seed
seedProviders();
