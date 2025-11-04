require('dotenv').config({ path: '../.env' });
const { MongoClient } = require('mongodb');

async function getDatabaseConnectionAsync(dbUri)
{
    // Should these share a client or should there be multiple clients?
    const client = await new MongoClient(dbUri, {
        tls: true,
        tlsAllowInvalidCertificates: false,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
    }).connect();

    async function getCollectionAsync(collectionName) {
        const db = client.db();
        const collection = db.collection(collectionName);
        
        // Create unique index for uuid
        await collection.createIndex({ uuid: 1 }, { unique: true });
        
        // Create text indexes for search functionality (compatible with free tier)
        if (collectionName === 'users') {
            await collection.createIndex({ fullName: 'text', phone: 'text' });
        } else if (collectionName === 'service-providers') {
            await collection.createIndex({ fullName: 'text', mobilePhone: 'text' });
        } else if (collectionName === 'vehicles') {
            await collection.createIndex({ displayName: 'text', fleetId: 'text' });
        }
        
        return collection;
    }

    return {getCollectionAsync};
}

async function configSearchIndex(collection, indexName) {
    // Skip search index creation for free tier (M0) - use regular text indexes instead
    console.log(`Skipping Atlas Search index "${indexName}" (using regular text indexes instead)`);
    return;
    
    /* Original code - requires paid MongoDB Atlas tier
    let index;
    do {
        const indexes = await collection.listSearchIndexes().toArray();
        index = indexes.find(index => index.name === indexName);
        if (!index) {
            const result = await collection.createSearchIndex(
                {
                    name: indexName,
                    definition: {
                        mappings: {
                            dynamic: true
                        }
                    }
                }
            );
            if (!result || result !== indexName) {
                throw new Error(`Error creating search index ${indexName}`);
            }
        }
    } while (!index);

    while (!index || index.status !== "READY") {
        await delay(1000);

        const indexes = await collection.listSearchIndexes().toArray();
        index = indexes.find(index => index.name === indexName);
    }
    */
}

function delay(ms)
{
    return new Promise(res => setTimeout(res, ms));
}

module.exports = {getDatabaseConnectionAsync, configSearchIndex}