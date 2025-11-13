#!/usr/bin/env node

/**
 * Reset Database Script
 * 
 * This script clears ALL collections in the database:
 * - system-users
 * - users
 * - service-providers
 * - vehicles
 * - ride-requests
 * - notifications
 *
 * WARNING: This will DELETE ALL DATA. Use with caution!
 *
 * Usage:
 *   node server/seed/reset.js
 *   npm run reset
 */

require('dotenv').config({ path: '.env' });
const { MongoClient } = require('mongodb');

async function resetDatabase() {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = (process.env.MONGODB_DB_DEV || 'dev-ruraldispatch').trim();
    
    if (!mongoUri) {
        console.error('❌ Error: MONGODB_URI not set in .env');
        process.exit(1);
    }

    const client = new MongoClient(mongoUri);

    try {
        console.log('\n🗑️  DATABASE RESET\n');
        console.log('═'.repeat(90));
        console.log(`Connecting to: ${dbName}`);
        console.log('═'.repeat(90));

        await client.connect();
        const db = client.db(dbName);

        // Get all collections
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        console.log(`\n📊 Found ${collectionNames.length} collection(s):\n`);

        let totalDeleted = 0;

        for (const collectionName of collectionNames) {
            const collection = db.collection(collectionName);
            const count = await collection.countDocuments();

            if (count > 0) {
                await collection.deleteMany({});
                console.log(`✓ Cleared: ${collectionName.padEnd(20)} (${count} document(s))`);
                totalDeleted += count;
            } else {
                console.log(`- Empty: ${collectionName.padEnd(20)}`);
            }
        }

        console.log('\n' + '═'.repeat(90));
        console.log(`\n✅ Database reset complete!`);
        console.log(`   Total documents deleted: ${totalDeleted}\n`);
        console.log('Next steps:');
        console.log('   1. npm run seed        (to recreate demo data)\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error resetting database:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

// Run the reset
resetDatabase();
