/**
 * Seed script to create demo rider users
 * Riders are service users who request transportation
 *
 * Run: npm run seed:riders
 *
 * Demo Rider Users:
 * - Maria Rodriguez (+12125551234)
 * - James Wilson (+14155554444)
 */

require('dotenv').config({ path: '../../.env' });
const generateApi = require('../database/api');

const demoRiders = [
    {
        fullName: 'Maria Rodriguez',
        phone: '+12125551234',
        dob: '1988-07-10',
        race: 'latino',
        maritalStatus: 'single',
        residence: {
            current: '555 Washington Ave, Manhattan, NY 10027',
            last: '777 Madison Ave, Manhattan, NY 10065'
        },
        income: {
            current: 'Employed',
            last: 'Unemployed'
        },
        serviceUserRole: ['rider'],
        veteranStatus: 'not veteran',
        disabilityStatus: 'no',
        smsConsent: {
            given: true,
            timestamp: new Date(),
            ipAddress: '192.168.1.1'
        }
    },
    {
        fullName: 'James Wilson',
        phone: '+14155554444',
        dob: '1970-12-05',
        race: 'white',
        maritalStatus: 'married',
        residence: {
            current: '123 Park Ave, Manhattan, NY 10016',
            last: '456 5th Ave, Manhattan, NY 10018'
        },
        income: {
            current: 'Employed',
            last: 'Retired'
        },
        serviceUserRole: ['rider'],
        veteranStatus: 'not veteran',
        disabilityStatus: 'no',
        smsConsent: {
            given: true,
            timestamp: new Date(),
            ipAddress: '192.168.1.2'
        }
    }
];

async function seedRiders() {
    try {
        console.log('\n🌱 Starting riders seed...\n');
        console.log('═'.repeat(70));

        const api = await generateApi();

        // RESET: Delete all existing riders
        console.log('\n🗑️  Clearing existing riders...');
        const existingUsers = await api.getUsers();
        const existingRiders = existingUsers.filter(u => u.serviceUserRole?.includes('rider'));

        if (existingRiders.length > 0) {
            console.log(`   Found ${existingRiders.length} existing rider(s)`);

            for (const rider of existingRiders) {
                await api.deleteUser(rider.uuid);
                console.log(`   ✓ Deleted: ${rider.fullName}`);
            }

            console.log(`\n   ✅ Successfully cleared ${existingRiders.length} rider(s)\n`);
        } else {
            console.log('   No existing riders found\n');
        }

        // Create new riders
        console.log('👤 Creating fresh demo riders...\n');

        const createdRiders = [];
        const failedRiders = [];

        for (const userData of demoRiders) {
            try {
                await api.addUser(userData);
                createdRiders.push(userData);
                console.log(`✅ Created: ${userData.fullName.padEnd(20)} | ${userData.phone}`);
            } catch (error) {
                failedRiders.push({ name: userData.fullName, error: error.message });
                console.error(`❌ Failed: ${userData.fullName.padEnd(20)} | ${error.message}`);
            }
        }

        // Print summary
        console.log('\n' + '═'.repeat(70));
        console.log('📊 RIDERS SEED SUMMARY\n');
        console.log(`✅ Successfully created: ${createdRiders.length} rider(s)`);
        if (failedRiders.length > 0) {
            console.log(`❌ Failed: ${failedRiders.length} rider(s)\n`);
            failedRiders.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
        }

        console.log('\n📋 RIDER DETAILS\n');
        console.log('─'.repeat(70));
        createdRiders.forEach(rider => {
            console.log(`  Name: ${rider.fullName.padEnd(25)} | Phone: ${rider.phone}`);
        });

        console.log('\n' + '═'.repeat(70));
        console.log('\n✨ Riders seed completed successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

seedRiders();
