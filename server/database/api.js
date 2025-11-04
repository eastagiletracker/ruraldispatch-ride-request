require('dotenv').config();
const database = require("./database");
const notificationDb = require("./notification");
const {getDatabaseConnectionAsync, configSearchIndex} = require("./setup");


async function generateApi()
{
    const dbUri = process.env.MONGODB_URI;

    const databaseConnection = await getDatabaseConnectionAsync(dbUri);

    const [rideRequestCollection, userCollection, providerCollection, vehicleCollection, notificationCollection] = await Promise.all([
        databaseConnection.getCollectionAsync("ride-requests"),
        databaseConnection.getCollectionAsync("users"),
        databaseConnection.getCollectionAsync("service-providers"),
        databaseConnection.getCollectionAsync("vehicles"),
        databaseConnection.getCollectionAsync("notifications")
        ]
    );

    console.log(`Configuring search indexes... (This step may take a minute)`);

    await Promise.all([
        configSearchIndex(vehicleCollection, 'vehicleSearch'),
        configSearchIndex(userCollection, 'userSearch'),
        configSearchIndex(providerCollection, 'providerSearch'),
    ]);

    const api = {
        getRideRequest: async(uuid) => await database.getRideRequestWithUserAndProviderData(rideRequestCollection, uuid),
        getRideRequests: async() => await database.getRideRequestsWithUserAndProviderData(rideRequestCollection),
        addRideRequest: async(rideReq) => await database.add(rideRequestCollection, rideReq),
        updateRideRequest: async(uuid, replacementFields) => await database.update(rideRequestCollection, uuid, replacementFields),
        getUser: async(uuid) => await database.getByUuidString(userCollection, uuid),
        getSpecifiedFieldsOfUser: async(uuid, fields) => await database.getSpecifiedFieldsOfDocument(userCollection, uuid, fields),
        getUsers: async() => await database.getCollection(userCollection),
        getSpecifiedFieldsOfUsers: async(fields) => await database.getSpecifiedFieldsOfDocument(userCollection, fields),
        addUser: async(user) => await database.add(userCollection, user),
        getProvider: async(uuid) => await database.getByUuidString(providerCollection, uuid),
        getProviders: async() => await database.getCollection(providerCollection),
        addProvider: async(provider) => await database.add(providerCollection, provider),
        fuzzyUserSearch: async(searchTerm) => await database.fuzzyUserSearch(userCollection, searchTerm),
        fuzzyProviderSearch: async(searchTerm) => await database.fuzzyProviderSearch(providerCollection, searchTerm),
        fuzzyVehicleSearch: async(searchTerm) => await database.fuzzyVehicleSearch(vehicleCollection, searchTerm),
        addVehicle: async (vehicle) => await database.add(vehicleCollection, vehicle),
        // Notification functions
        getNotificationsByRide: async(rideRequestUuid) => await notificationDb.getNotificationsByRide(notificationCollection, rideRequestUuid),
        getNotificationsByPhone: async(phone) => await notificationDb.getNotificationsByPhone(notificationCollection, phone),
        getActiveSessionNotifications: async(rideRequestUuid) => await notificationDb.getActiveSessionNotifications(notificationCollection, rideRequestUuid),
        addNotification: async(notification) => await notificationDb.addNotification(notificationCollection, notification),
        updateNotificationStatus: async(twilioMessageSid, statusData) => await notificationDb.updateNotificationStatus(notificationCollection, twilioMessageSid, statusData),
        closeRideSession: async(rideRequestUuid) => await notificationDb.closeRideSession(notificationCollection, rideRequestUuid),
        getNotificationByMessageSid: async(twilioMessageSid) => await notificationDb.getNotificationByMessageSid(notificationCollection, twilioMessageSid),
        getAllNotifications: async(limit) => await notificationDb.getAllNotifications(notificationCollection, limit),
        getRideNotificationStats: async(rideRequestUuid) => await notificationDb.getRideNotificationStats(notificationCollection, rideRequestUuid)
    }

    return api;
}

module.exports = generateApi;