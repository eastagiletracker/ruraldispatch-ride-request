/**
 * Seed script to create demo dispatcher users
 * Dispatchers manage and assign ride requests
 *
 * Run: npm run seed:dispatchers
 *
 * Demo Dispatcher Users:
 * - dispatcher / dispatch123
 */

require('dotenv').config({ path: '../../.env' });
const generateApi = require('../database/api');

const demoDispatchers = [
    {
        username: 'dispatcher',
        password: 'dispatch123',
        role: 'dispatcher',
        fullName: 'Dispatch Staff',
        email: 'dispatch@swarmnyc.com',
        phone: '+18777804236'
    }
];

async function seedDispatchers() {
    try {
        console.log('\n🌱 Starting dispatchers seed...\n');
        console.log('═'.repeat(70));

        const api = await generateApi();

        // RESET: Delete all existing dispatchers
        console.log('\n🗑️  Clearing existing dispatchers...');
        const existingUsers = await api.getAllSystemUsers();
        const existingDispatchers = existingUsers.filter(u => u.role === 'dispatcher');

        if (existingDispatchers.length > 0) {
            console.log(`   Found ${existingDispatchers.length} existing dispatcher(s)`);

            for (const dispatcher of existingDispatchers) {
                await api.deleteSystemUser(dispatcher.uuid);
                console.log(`   ✓ Deleted: ${dispatcher.username}`);
            }

            console.log(`\n   ✅ Successfully cleared ${existingDispatchers.length} dispatcher(s)\n`);
        } else {
            console.log('   No existing dispatchers found\n');
        }

        // Create new dispatchers
        console.log('🚗 Creating fresh demo dispatchers...\n');

        const createdDispatchers = [];
        const failedDispatchers = [];

        for (const userData of demoDispatchers) {
            try {
                await api.createSystemUser(userData);
                createdDispatchers.push(userData);
                console.log(`✅ Created: ${userData.username.padEnd(20)} | ${userData.fullName}`);
            } catch (error) {
                failedDispatchers.push({ username: userData.username, error: error.message });
                console.error(`❌ Failed: ${userData.username.padEnd(20)} | ${error.message}`);
            }
        }

        // Print summary
        console.log('\n' + '═'.repeat(70));
        console.log('📊 DISPATCHERS SEED SUMMARY\n');
        console.log(`✅ Successfully created: ${createdDispatchers.length} dispatcher(s)`);
        if (failedDispatchers.length > 0) {
            console.log(`❌ Failed: ${failedDispatchers.length} dispatcher(s)\n`);
            failedDispatchers.forEach(f => console.log(`   - ${f.username}: ${f.error}`));
        }

        console.log('\n📋 DISPATCHER CREDENTIALS\n');
        console.log('─'.repeat(70));
        createdDispatchers.forEach(dispatcher => {
            console.log(`  Username: ${dispatcher.username.padEnd(20)} Password: ${dispatcher.password}`);
            console.log(`  Email:    ${dispatcher.email.padEnd(20)} Phone:    ${dispatcher.phone}\n`);
        });

        console.log('═'.repeat(70));
        console.log('\n✨ Dispatcher seed completed successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

seedDispatchers();
