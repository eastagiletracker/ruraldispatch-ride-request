/**
 * Seed script to create demo caregiver users
 * Caregivers are service users who manage rides for others
 *
 * Run: npm run seed:caregivers
 *
 * Demo Caregiver Users:
 * - Sarah Johnson (+14155552222)
 * - Emily Chen (+16465551111)
 */

require('dotenv').config({ path: '../../.env' });
const generateApi = require('../database/api');

const demoCaregivers = [
    {
        fullName: 'Sarah Johnson',
        phone: '+14155552222',
        dob: '1965-03-22',
        race: 'white',
        maritalStatus: 'married',
        residence: {
            current: '789 Broadway, Manhattan, NY 10003',
            last: '321 Park Ave South, Manhattan, NY 10010'
        },
        income: {
            current: 'Employed',
            last: 'Employed'
        },
        serviceUserRole: ['caregiver'],
        veteranStatus: 'not veteran',
        disabilityStatus: 'no',
        smsConsent: {
            given: true,
            timestamp: new Date(),
            ipAddress: '192.168.1.3'
        }
    },
    {
        fullName: 'Emily Chen',
        phone: '+16465551111',
        dob: '1992-08-18',
        race: 'asian',
        maritalStatus: 'single',
        residence: {
            current: '999 3rd Ave, Manhattan, NY 10022',
            last: '111 Amsterdam Ave, Manhattan, NY 10023'
        },
        income: {
            current: 'Employed',
            last: 'Employed'
        },
        serviceUserRole: ['caregiver'],
        veteranStatus: 'not veteran',
        disabilityStatus: 'no',
        smsConsent: {
            given: false
        }
    }
];

async function seedCaregivers() {
    try {
        console.log('\n🌱 Starting caregivers seed...\n');
        console.log('═'.repeat(70));

        const api = await generateApi();

        // RESET: Delete all existing caregivers
        console.log('\n🗑️  Clearing existing caregivers...');
        const existingUsers = await api.getUsers();
        const existingCaregivers = existingUsers.filter(u => u.serviceUserRole?.includes('caregiver'));

        if (existingCaregivers.length > 0) {
            console.log(`   Found ${existingCaregivers.length} existing caregiver(s)`);

            for (const caregiver of existingCaregivers) {
                await api.deleteUser(caregiver.uuid);
                console.log(`   ✓ Deleted: ${caregiver.fullName}`);
            }

            console.log(`\n   ✅ Successfully cleared ${existingCaregivers.length} caregiver(s)\n`);
        } else {
            console.log('   No existing caregivers found\n');
        }

        // Create new caregivers
        console.log('👥 Creating fresh demo caregivers...\n');

        const createdCaregivers = [];
        const failedCaregivers = [];

        for (const userData of demoCaregivers) {
            try {
                await api.addUser(userData);
                createdCaregivers.push(userData);
                console.log(`✅ Created: ${userData.fullName.padEnd(20)} | ${userData.phone}`);
            } catch (error) {
                failedCaregivers.push({ name: userData.fullName, error: error.message });
                console.error(`❌ Failed: ${userData.fullName.padEnd(20)} | ${error.message}`);
            }
        }

        // Print summary
        console.log('\n' + '═'.repeat(70));
        console.log('📊 CAREGIVERS SEED SUMMARY\n');
        console.log(`✅ Successfully created: ${createdCaregivers.length} caregiver(s)`);
        if (failedCaregivers.length > 0) {
            console.log(`❌ Failed: ${failedCaregivers.length} caregiver(s)\n`);
            failedCaregivers.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
        }

        console.log('\n📋 CAREGIVER DETAILS\n');
        console.log('─'.repeat(70));
        createdCaregivers.forEach(caregiver => {
            console.log(`  Name: ${caregiver.fullName.padEnd(25)} | Phone: ${caregiver.phone}`);
        });

        console.log('\n' + '═'.repeat(70));
        console.log('\n✨ Caregivers seed completed successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

seedCaregivers();
