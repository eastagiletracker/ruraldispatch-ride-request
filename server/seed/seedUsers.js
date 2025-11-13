/**
 * Seed script to create demo service users (riders, caregivers, etc.)
 * Run this script to populate the users collection with demo data
 *
 * Service User Roles:
 * - rider: Person requesting transportation
 * - caregiver: Person providing care support
 * - relative: Family member
 * - guardian: Legal guardian
 */

require('dotenv').config({ path: '../../.env' });
const generateApi = require('../database/api');
const { v4: uuidv4 } = require('uuid');

/**
 * Demo service users organized by role
 * Clean, minimal demo data for testing
 */
const demoUsers = [
    // RIDERS
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
            current: '111 Park Ave, Manhattan, NY 10016',
            last: '222 5th Ave, Manhattan, NY 10010'
        },
        income: {
            current: 'Employed',
            last: 'Employed'
        },
        serviceUserRole: ['rider'],
        veteranStatus: 'veteran',
        disabilityStatus: 'yes',
        smsConsent: {
            given: false
        }
    },

    // CAREGIVERS
    {
        fullName: 'Sarah Johnson',
        phone: '+14155552222',
        dob: '1992-11-28',
        race: 'white',
        maritalStatus: 'single',
        residence: {
            current: '999 5th Ave, Manhattan, NY 10028',
            last: '111 Broadway, Manhattan, NY 10006'
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
        dob: '1985-03-15',
        race: 'asian',
        maritalStatus: 'single',
        residence: {
            current: '333 Lexington Ave, Manhattan, NY 10016',
            last: '444 Madison Ave, Manhattan, NY 10022'
        },
        income: {
            current: 'Employed',
            last: 'Employed'
        },
        serviceUserRole: ['caregiver', 'relative'],
        veteranStatus: 'not veteran',
        disabilityStatus: 'no',
        smsConsent: {
            given: false
        }
    }
];

async function seedUsers() {
    try {
        console.log('\n🌱 Starting service users seed...\n');
        console.log('═'.repeat(80));

        const api = await generateApi();

        // RESET: Delete all existing users
        console.log('\n🗑️  Clearing existing service users...');
        const existingUsers = await api.getUsers();

        if (existingUsers.length > 0) {
            console.log(`   Found ${existingUsers.length} existing user(s)`);

            for (const user of existingUsers) {
                await api.deleteUser(user.uuid);
                console.log(`   ✓ Deleted: ${user.fullName}`);
            }

            console.log(`\n   ✅ Successfully cleared ${existingUsers.length} user(s)\n`);
        } else {
            console.log('   No existing users found\n');
        }

        // Create new users
        console.log('👤 Creating fresh demo service users...\n');

        const createdUsers = [];
        const failedUsers = [];

        for (const userData of demoUsers) {
            try {
                // Add UUID
                const userWithUuid = {
                    ...userData,
                    uuid: uuidv4()
                };

                // Create the user
                const result = await api.addUser(userWithUuid);

                createdUsers.push(userData);
                const roles = userData.serviceUserRole.join(', ').toUpperCase();
                console.log(`✅ Created: ${userData.fullName.padEnd(20)} | ${roles.padEnd(25)} | ${userData.phone}`);

            } catch (error) {
                failedUsers.push({ fullName: userData.fullName, error: error.message });
                console.error(`❌ Failed: ${userData.fullName.padEnd(20)} | ${error.message}`);
            }
        }

        // Print summary
        console.log('\n' + '═'.repeat(80));
        console.log('📊 SEED SUMMARY\n');
        console.log(`✅ Successfully created: ${createdUsers.length} user(s)`);
        if (failedUsers.length > 0) {
            console.log(`❌ Failed: ${failedUsers.length} user(s)\n`);
            failedUsers.forEach(f => console.log(`   - ${f.fullName}: ${f.error}`));
        }

        // Print users by role
        console.log('\n📋 CREATED USERS BY ROLE\n');
        console.log('═'.repeat(80));

        const roleGroups = {};
        createdUsers.forEach(user => {
            user.serviceUserRole.forEach(role => {
                if (!roleGroups[role]) {
                    roleGroups[role] = [];
                }
                roleGroups[role].push(user);
            });
        });

        Object.entries(roleGroups).forEach(([role, users]) => {
            console.log(`\n${role.toUpperCase()}:`);
            console.log('─'.repeat(80));
            users.forEach(user => {
                console.log(`  Name:  ${user.fullName.padEnd(25)} Phone: ${user.phone}`);
                console.log(`  DOB:   ${user.dob.padEnd(25)} Status: ${user.disabilityStatus}`);
                console.log(`  SMS:   ${user.smsConsent.given ? '✅ Consented' : '❌ Not consented'}\n`);
            });
        });

        console.log('═'.repeat(80));
        console.log('\n✨ Seed completed successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

// Run the seed
seedUsers();
