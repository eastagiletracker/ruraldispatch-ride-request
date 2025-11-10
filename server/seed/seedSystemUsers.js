/**
 * Seed script to create demo system users for all roles
 * Run this script to populate the system-users collection with demo credentials
 *
 * Usage: node server/database/seedSystemUsers.js
 *
 * Available roles:
 * - admin: Full system access
 * - dispatcher: Manage ride requests and dispatch
 * - case_manager: Submit and manage ride requests
 * - driver: View and update assigned rides
 */

require('dotenv').config({ path: '../../.env' });
const generateApi = require('../database/api');

/**
 * Demo system users organized by role
 * Each user has:
 * - username: Unique login identifier
 * - password: Initial password (change on first login in production)
 * - role: User's system role
 * - fullName: Display name
 * - email: Contact email
 * - phone: Phone number with country code
 */
const demoUsers = [
    // ADMINS (Full system access)
    {
        username: 'natecooper',
        password: 'natecooper123',
        role: 'admin',
        fullName: 'Nate Cooper',
        email: 'nate@swarmnyc.com',
        phone: '+18313251472'
    },
    {
        username: 'cassiebrinen',
        password: 'cassiebrinen123',
        role: 'admin',
        fullName: 'Cassie Brinen',
        email: 'cassie@swarmnyc.com',
        phone: '+18777804236'
    },
    {
        username: 'dominiquemorris',
        password: 'dominiquemorris123',
        role: 'admin',
        fullName: 'Dominique Morris',
        email: 'dominique@swarmnyc.com',
        phone: '+18777804236'
    },

    // CASE MANAGERS (Submit and manage ride requests)
    {
        username: 'johanguse',
        password: 'johanguse123',
        role: 'case_manager',
        fullName: 'Johan Guse',
        email: 'johan@swarmnyc.com',
        phone: '+5547991274449'
    }
];

async function seedSystemUsers() {
    try {
        console.log('\n🌱 Starting system users seed...\n');
        console.log('═'.repeat(70));

        const api = await generateApi();

        // RESET: Delete all existing system users
        console.log('\n🗑️  Clearing existing system users...');
        const existingUsers = await api.getAllSystemUsers();

        if (existingUsers.length > 0) {
            console.log(`   Found ${existingUsers.length} existing user(s)`);

            for (const user of existingUsers) {
                await api.deleteSystemUser(user.uuid);
                console.log(`   ✓ Deleted: ${user.username}`);
            }

            console.log(`\n   ✅ Successfully cleared ${existingUsers.length} user(s)\n`);
        } else {
            console.log('   No existing users found\n');
        }

        // Create new users
        console.log('👤 Creating fresh demo users...\n');

        const createdUsers = [];
        const failedUsers = [];

        for (const userData of demoUsers) {
            try {
                // Create the user
                const result = await api.createSystemUser(userData);

                createdUsers.push(userData);
                console.log(`✅ Created: ${userData.username.padEnd(18)} | ${userData.role.toUpperCase().padEnd(15)} | ${userData.fullName}`);

            } catch (error) {
                failedUsers.push({ username: userData.username, error: error.message });
                console.error(`❌ Failed: ${userData.username.padEnd(18)} | ${error.message}`);
            }
        }

        // Print summary
        console.log('\n' + '═'.repeat(70));
        console.log('📊 SEED SUMMARY\n');
        console.log(`✅ Successfully created: ${createdUsers.length} user(s)`);
        if (failedUsers.length > 0) {
            console.log(`❌ Failed: ${failedUsers.length} user(s)\n`);
            failedUsers.forEach(f => console.log(`   - ${f.username}: ${f.error}`));
        }

        // Print credentials by role
        console.log('\n📋 DEMO CREDENTIALS BY ROLE\n');
        console.log('═'.repeat(70));

        const roles = ['admin', 'dispatcher', 'driver', 'case_manager'];
        roles.forEach(role => {
            const usersInRole = createdUsers.filter(u => u.role === role);
            if (usersInRole.length > 0) {
                console.log(`\n${role.toUpperCase()}:`);
                console.log('─'.repeat(70));
                usersInRole.forEach(user => {
                    console.log(`  Username: ${user.username.padEnd(20)} Password: ${user.password.padEnd(20)}`);
                    console.log(`  Name:     ${user.fullName.padEnd(20)} Email:    ${user.email}`);
                    console.log(`  Phone:    ${user.phone}\n`);
                });
            }
        });

        console.log('═'.repeat(70));
        console.log('\n✨ Seed completed successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

// Run the seed
seedSystemUsers();
