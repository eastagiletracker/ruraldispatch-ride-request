/**
 * Seed script to create demo driver users
 * Drivers are service providers who provide transportation services
 *
 * Run: npm run seed:drivers
 *
 * Demo Driver Users:
 * - Michael Chen (+16465551234) - Wheelchair accessible, Long distance
 * - Patricia Smith (+12125555678) - Medical appointments, Senior care
 * - David Martinez (+13105559999) - Medical appointments, Bilingual
 * - Lisa Anderson (+14155553333) - Fleet Manager
 */

require('dotenv').config({ path: '../../.env' });
const generateApi = require('../database/api');

const demoDrivers = [
    {
        fullName: 'Michael Chen',
        title: 'Driver',
        organization: 'EASTCONN',
        mobilePhone: '+16465551234',
        serviceProviderRole: 'Driver',
        specializations: 'Wheelchair accessible, Long distance',
        faxPhone: '',
        email: 'michael.chen@eastconn.org',
        password: 'michaeldriver123'
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
        password: 'patriciadriver123'
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
        password: 'daviddriver123'
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
        password: 'lisafleet123'
    }
];

async function seedDrivers() {
    try {
        console.log('\n🌱 Starting drivers seed...\n');
        console.log('═'.repeat(90));

        const api = await generateApi();

        // RESET: Delete all existing drivers and fleet managers
        console.log('\n🗑️  Clearing existing drivers...');
        const existingProviders = await api.getProviders();
        const existingDrivers = existingProviders.filter(p => 
            p.serviceProviderRole === 'Driver' || p.serviceProviderRole === 'Fleet Manager'
        );

        if (existingDrivers.length > 0) {
            console.log(`   Found ${existingDrivers.length} existing driver(s)`);

            for (const driver of existingDrivers) {
                await api.deleteProvider(driver.uuid);
                console.log(`   ✓ Deleted: ${driver.fullName}`);
            }

            console.log(`\n   ✅ Successfully cleared ${existingDrivers.length} driver(s)\n`);
        } else {
            console.log('   No existing drivers found\n');
        }

        // Create new drivers
        console.log('🚗 Creating fresh demo drivers...\n');

        const createdDrivers = [];
        const failedDrivers = [];

        for (const driverData of demoDrivers) {
            try {
                await api.addProvider(driverData);
                createdDrivers.push(driverData);
                console.log(`✅ Created: ${driverData.fullName.padEnd(20)} | ${driverData.serviceProviderRole.padEnd(15)} | ${driverData.mobilePhone}`);
            } catch (error) {
                failedDrivers.push({ name: driverData.fullName, error: error.message });
                console.error(`❌ Failed: ${driverData.fullName.padEnd(20)} | ${error.message}`);
            }
        }

        // Print summary
        console.log('\n' + '═'.repeat(90));
        console.log('📊 DRIVERS SEED SUMMARY\n');
        console.log(`✅ Successfully created: ${createdDrivers.length} driver(s)`);
        if (failedDrivers.length > 0) {
            console.log(`❌ Failed: ${failedDrivers.length} driver(s)\n`);
            failedDrivers.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
        }

        console.log('\n📋 DRIVER DETAILS\n');
        console.log('─'.repeat(90));
        
        const driversByRole = createdDrivers.reduce((acc, driver) => {
            const role = driver.serviceProviderRole;
            if (!acc[role]) acc[role] = [];
            acc[role].push(driver);
            return acc;
        }, {});

        Object.entries(driversByRole).forEach(([role, drivers]) => {
            console.log(`\n${role.toUpperCase()}:`);
            drivers.forEach(driver => {
                console.log(`  ${driver.fullName.padEnd(25)} | ${driver.mobilePhone.padEnd(15)} | ${driver.organization}`);
                console.log(`    Specializations: ${driver.specializations}`);
            });
        });

        console.log('\n' + '═'.repeat(90));
        console.log('\n✨ Drivers seed completed successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

seedDrivers();
