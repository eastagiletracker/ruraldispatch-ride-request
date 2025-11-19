require('dotenv').config({ path: '../.env' });
const {pipelineGenerators, pipelines} = require("./pipelines");
const { generateUuid } = require("../utils/uuid");
const { generateRideDisplayId } = require("../utils/displayId");

async function getCollection(collection)
{
    return await collection.find({}).toArray();
}

async function add(collection, document)
{
    // Auto-generate UUIDv7 if not provided
    // UUIDv7 provides sequential ordering for optimal B-Tree performance
    // while maintaining global uniqueness and unpredictability
    if (!document.uuid) {
        document.uuid = generateUuid();
    }
    return await collection.insertOne(document);
}

async function update(collection, uuid, replacementFields){
    const replacementDoc = {$set: replacementFields};
    // UUIDs are now strings (UUIDv7 format)
    const filter = {uuid: uuid};
    return await collection.updateOne(filter, replacementDoc);
}

async function fuzzyUserSearch(collection, searchTerm)
{
    const pipeline =
        pipelineGenerators.fuzzySearch("userSearch", searchTerm)
            .concat(pipelines.projectUserNameUuidAndPhone);
    const results = await collection.aggregate(pipeline).toArray();
    return results;
}

async function fuzzyProviderSearch(collection, searchTerm)
{
    const pipeline =
        pipelineGenerators.fuzzySearch("providerSearch", searchTerm)
            .concat(pipelines.projectProviderNameUuidAndPhone);
    const results = await collection.aggregate(pipeline).toArray();
    return results;
}

async function fuzzyVehicleSearch(collection, searchTerm)
{
    const pipeline =
        pipelineGenerators.fuzzySearch("vehicleSearch", searchTerm)
            .concat(pipelines.projectVehicleNameUuiAndFleetId);
    const results = await collection.aggregate(pipeline).toArray();
    return results;
}

async function fuzzySearch(collection, searchTerm, indexField) {
    const results = await collection.aggregate(pipelineGenerators.fuzzySearch(indexField, searchTerm))
    return await results.toArray();
}

async function getRideRequestsWithUserAndProviderData(collection)
{
    return await collection.aggregate(pipelines.userAndProviderDataAggregation).toArray();
}

async function getRideRequestWithUserAndProviderData(collection, uuid)
{
    // UUIDs are now strings (UUIDv7 format)
    const pipeline = pipelineGenerators.matchUuid(uuid).concat(pipelines.userAndProviderDataAggregation);
    const results = await collection.aggregate(pipeline).toArray();
    return results[0];
}

async function getByUuidString(collection, uuid)
{
    // UUIDs are now strings (UUIDv7 format)
    return await collection.findOne({uuid: uuid})
}

async function getSpecifiedFieldsOfDocument(collection, uuid, fields)
{
    const pipeline = pipelineGenerators.matchUuid(uuid).concat(pipelineGenerators.projectFields(fields));
    const results = await collection.aggregate(pipeline).toArray();
    return results[0];
}

async function getSpecifiedFieldsOfCollection(collection, fields)
{
    const pipeline = pipelineGenerators.projectFields(fields);
    return await collection.aggregate(pipeline).toArray();
}

async function updateUserSMSConsent(collection, phone, consentData) {
    const result = await collection.updateOne(
        { phone: phone },
        { 
            $set: { 
                smsConsent: consentData 
            } 
        }
    );
    return result;
}

async function deleteByUuid(collection, uuid) {
    // UUIDs are now strings (UUIDv7 format)
    const filter = { uuid: uuid };
    const result = await collection.deleteOne(filter);
    return result;
}

/**
 * Add a ride request with auto-generated display ID
 * @param {object} collection - MongoDB collection
 * @param {object} document - Ride request document
 * @returns {object} Insert result
 */
async function addRideRequest(collection, document) {
    // Auto-generate display ID if not provided
    if (!document.displayId) {
        document.displayId = generateRideDisplayId();
    }

    // Auto-generate UUID if not provided (handled by add function)
    return await add(collection, document);
}

module.exports = {
    getCollection,
    add,
    addRideRequest,
    update,
    deleteByUuid,
    fuzzyUserSearch,
    fuzzyProviderSearch,
    fuzzyVehicleSearch,
    getRideRequestWithUserAndProviderData,
    getRideRequestsWithUserAndProviderData,
    getByUuidString,
    getSpecifiedFieldsOfDocument,
    getSpecifiedFieldsOfCollection,
    updateUserSMSConsent
};