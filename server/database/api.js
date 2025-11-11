require('dotenv').config();
const database = require("./database");
const notificationDb = require("./notification");
const systemUserDb = require("./systemUser");
const {getDatabaseConnectionAsync, configSearchIndex} = require("./setup");


async function generateApi()
{
    const dbUri = process.env.MONGODB_URI;

    const databaseConnection = await getDatabaseConnectionAsync(dbUri);

    const [rideRequestCollection, userCollection, providerCollection, vehicleCollection, notificationCollection, systemUserCollection] = await Promise.all([
        databaseConnection.getCollectionAsync("ride-requests"),
        databaseConnection.getCollectionAsync("users"),
        databaseConnection.getCollectionAsync("service-providers"),
        databaseConnection.getCollectionAsync("vehicles"),
        databaseConnection.getCollectionAsync("notifications"),
        databaseConnection.getCollectionAsync("system-users")
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
        updateUserSMSConsent: async(phone, consentData) => await database.updateUserSMSConsent(userCollection, phone, consentData),
        getProvider: async(uuid) => await database.getByUuidString(providerCollection, uuid),
        getProviders: async() => await database.getCollection(providerCollection),
        addProvider: async(provider) => await database.add(providerCollection, provider),
        deleteProvider: async(uuid) => await database.deleteByUuid(providerCollection, uuid),
        fuzzyUserSearch: async(searchTerm) => await database.fuzzyUserSearch(userCollection, searchTerm),
        fuzzyProviderSearch: async(searchTerm) => await database.fuzzyProviderSearch(providerCollection, searchTerm),
        getVehicle: async(uuid) => await database.getByUuidString(vehicleCollection, uuid),
        getVehicles: async() => await database.getCollection(vehicleCollection),
        fuzzyVehicleSearch: async(searchTerm) => await database.fuzzyVehicleSearch(vehicleCollection, searchTerm),
        addVehicle: async (vehicle) => await database.add(vehicleCollection, vehicle),
        deleteVehicle: async(uuid) => await database.deleteByUuid(vehicleCollection, uuid),
        deleteUser: async(uuid) => await database.deleteByUuid(userCollection, uuid),
        // Notification functions
        getNotificationsByRide: async(rideRequestUuid) => await notificationDb.getNotificationsByRide(notificationCollection, rideRequestUuid),
        getNotificationsByPhone: async(phone) => await notificationDb.getNotificationsByPhone(notificationCollection, phone),
        getActiveSessionNotifications: async(rideRequestUuid) => await notificationDb.getActiveSessionNotifications(notificationCollection, rideRequestUuid),
        addNotification: async(notification) => await notificationDb.addNotification(notificationCollection, notification),
        updateNotificationStatus: async(twilioMessageSid, statusData) => await notificationDb.updateNotificationStatus(notificationCollection, twilioMessageSid, statusData),
        closeRideSession: async(rideRequestUuid) => await notificationDb.closeRideSession(notificationCollection, rideRequestUuid),
        getNotificationByMessageSid: async(twilioMessageSid) => await notificationDb.getNotificationByMessageSid(notificationCollection, twilioMessageSid),
        getAllNotifications: async(limit) => await notificationDb.getAllNotifications(notificationCollection, limit),
        getRideNotificationStats: async(rideRequestUuid) => await notificationDb.getRideNotificationStats(notificationCollection, rideRequestUuid),
        // System User functions (authentication)
        getAllSystemUsers: async() => await systemUserDb.getAllSystemUsers(systemUserCollection),
        getSystemUserByUsername: async(username) => await systemUserDb.getSystemUserByUsername(systemUserCollection, username),
        getSystemUserByUuid: async(uuid) => await systemUserDb.getSystemUserByUuid(systemUserCollection, uuid),
        getSystemUsersByRole: async(role) => await systemUserDb.getSystemUsersByRole(systemUserCollection, role),
        createSystemUser: async(userData) => await systemUserDb.createSystemUser(systemUserCollection, userData),
        authenticateSystemUser: async(username, password) => await systemUserDb.authenticateSystemUser(systemUserCollection, username, password),
        updateSystemUser: async(uuid, updateData) => await systemUserDb.updateSystemUser(systemUserCollection, uuid, updateData),
        updateSystemUserStatus: async(uuid, isActive) => await systemUserDb.updateSystemUserStatus(systemUserCollection, uuid, isActive),
        deactivateSystemUser: async(uuid) => await systemUserDb.deactivateSystemUser(systemUserCollection, uuid),
        activateSystemUser: async(uuid) => await systemUserDb.activateSystemUser(systemUserCollection, uuid),
        deleteSystemUser: async(uuid) => await systemUserDb.deleteSystemUser(systemUserCollection, uuid)
    }

    return api;
}

module.exports = generateApi;