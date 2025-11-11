/**
 * Seed script to create demo case manager users
 * Case managers request rides on behalf of service users
 *
 * Run: npm run seed:case-managers
 *
 * Demo Case Manager Users:
 * - johanguse / johanguse123
 */

require('dotenv').config({ path: '../../.env' });
const generateApi = require('../database/api');

const demoCaseManagers = [
    {
        username: 'johanguse',
        password: 'johanguse123',
        role: 'case_manager',
        fullName: 'Johan Guse',
        email: 'johan@swarmnyc.com',
        phone: '+5547991274449'
    }
];

async function seedCaseManagers() {
    try {
        console.log('\n🌱 Starting case managers seed...\n');
        console.log('═'.repeat(70));

        const api = await generateApi();

        // RESET: Delete all existing case managers
        console.log('\n🗑️  Clearing existing case managers...');
        const existingUsers = await api.getAllSystemUsers();
        const existingCaseManagers = existingUsers.filter(u => u.role === 'case_manager');

        if (existingCaseManagers.length > 0) {
            console.log(`   Found ${existingCaseManagers.length} existing case manager(s)`);

            for (const caseManager of existingCaseManagers) {
                await api.deleteSystemUser(caseManager.uuid);
                console.log(`   ✓ Deleted: ${caseManager.username}`);
            }

            console.log(`\n   ✅ Successfully cleared ${existingCaseManagers.length} case manager(s)\n`);
        } else {
            console.log('   No existing case managers found\n');
        }

        // Create new case managers
        console.log('👨‍💼 Creating fresh demo case managers...\n');

        const createdCaseManagers = [];
        const failedCaseManagers = [];

        for (const userData of demoCaseManagers) {
            try {
                await api.createSystemUser(userData);
                createdCaseManagers.push(userData);
                console.log(`✅ Created: ${userData.username.padEnd(20)} | ${userData.fullName}`);
            } catch (error) {
                failedCaseManagers.push({ username: userData.username, error: error.message });
                console.error(`❌ Failed: ${userData.username.padEnd(20)} | ${error.message}`);
            }
        }

        // Print summary
        console.log('\n' + '═'.repeat(70));
        console.log('📊 CASE MANAGERS SEED SUMMARY\n');
        console.log(`✅ Successfully created: ${createdCaseManagers.length} case manager(s)`);
        if (failedCaseManagers.length > 0) {
            console.log(`❌ Failed: ${failedCaseManagers.length} case manager(s)\n`);
            failedCaseManagers.forEach(f => console.log(`   - ${f.username}: ${f.error}`));
        }

        console.log('\n📋 CASE MANAGER CREDENTIALS\n');
        console.log('─'.repeat(70));
        createdCaseManagers.forEach(caseManager => {
            console.log(`  Username: ${caseManager.username.padEnd(20)} Password: ${caseManager.password}`);
            console.log(`  Email:    ${caseManager.email.padEnd(20)} Phone:    ${caseManager.phone}\n`);
        });

        console.log('═'.repeat(70));
        console.log('\n✨ Case manager seed completed successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

seedCaseManagers();
