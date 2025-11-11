/**
 * Seed script to create demo admin users
 * Admins have full system access including System Manager
 *
 * Run: npm run seed:admins
 *
 * Demo Admin Users:
 * - natecooper / natecooper123
 * - cassiebrinen / cassiebrinen123
 * - dominiquemorris / dominiquemorris123
 */

require('dotenv').config({ path: '../../.env' });
const generateApi = require('../database/api');

const demoAdmins = [
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
    }
];

async function seedAdmins() {
    try {
        console.log('\n🌱 Starting admins seed...\n');
        console.log('═'.repeat(70));

        const api = await generateApi();

        // RESET: Delete all existing admins
        console.log('\n🗑️  Clearing existing admins...');
        const existingUsers = await api.getAllSystemUsers();
        const existingAdmins = existingUsers.filter(u => u.role === 'admin');

        if (existingAdmins.length > 0) {
            console.log(`   Found ${existingAdmins.length} existing admin(s)`);

            for (const admin of existingAdmins) {
                await api.deleteSystemUser(admin.uuid);
                console.log(`   ✓ Deleted: ${admin.username}`);
            }

            console.log(`\n   ✅ Successfully cleared ${existingAdmins.length} admin(s)\n`);
        } else {
            console.log('   No existing admins found\n');
        }

        // Create new admins
        console.log('👨‍💼 Creating fresh demo admins...\n');

        const createdAdmins = [];
        const failedAdmins = [];

        for (const userData of demoAdmins) {
            try {
                await api.createSystemUser(userData);
                createdAdmins.push(userData);
                console.log(`✅ Created: ${userData.username.padEnd(20)} | ${userData.fullName}`);
            } catch (error) {
                failedAdmins.push({ username: userData.username, error: error.message });
                console.error(`❌ Failed: ${userData.username.padEnd(20)} | ${error.message}`);
            }
        }

        // Print summary
        console.log('\n' + '═'.repeat(70));
        console.log('📊 ADMINS SEED SUMMARY\n');
        console.log(`✅ Successfully created: ${createdAdmins.length} admin(s)`);
        if (failedAdmins.length > 0) {
            console.log(`❌ Failed: ${failedAdmins.length} admin(s)\n`);
            failedAdmins.forEach(f => console.log(`   - ${f.username}: ${f.error}`));
        }

        console.log('\n📋 ADMIN CREDENTIALS\n');
        console.log('─'.repeat(70));
        createdAdmins.forEach(admin => {
            console.log(`  Username: ${admin.username.padEnd(20)} Password: ${admin.password}`);
            console.log(`  Email:    ${admin.email.padEnd(20)} Phone:    ${admin.phone}\n`);
        });

        console.log('═'.repeat(70));
        console.log('\n✨ Admin seed completed successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

seedAdmins();
