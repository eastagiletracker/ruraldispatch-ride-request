import * as runtime from "@prisma/client/runtime/client";
export const PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
export const PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
export const PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
export const PrismaClientInitializationError = runtime.PrismaClientInitializationError;
export const PrismaClientValidationError = runtime.PrismaClientValidationError;
export const sql = runtime.sqltag;
export const empty = runtime.empty;
export const join = runtime.join;
export const raw = runtime.raw;
export const Sql = runtime.Sql;
export const Decimal = runtime.Decimal;
export const getExtensionContext = runtime.Extensions.getExtensionContext;
export const prismaVersion = {
    client: "7.0.0",
    engine: "0c19ccc313cf9911a90d99d2ac2eb0280c76c513"
};
export const NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
export const DbNull = runtime.DbNull;
export const JsonNull = runtime.JsonNull;
export const AnyNull = runtime.AnyNull;
export const ModelName = {
    User: 'User',
    Organization: 'Organization',
    ServiceProvider: 'ServiceProvider',
    Vehicle: 'Vehicle',
    Ride: 'Ride',
    Notification: 'Notification',
    SystemUser: 'SystemUser'
};
export const TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
export const UserScalarFieldEnum = {
    uuid: 'uuid',
    fullName: 'fullName',
    phone: 'phone',
    email: 'email',
    role: 'role',
    smsConsentGiven: 'smsConsentGiven',
    smsConsentTimestamp: 'smsConsentTimestamp',
    smsConsentIpAddress: 'smsConsentIpAddress',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const OrganizationScalarFieldEnum = {
    id: 'id',
    name: 'name',
    description: 'description',
    contactEmail: 'contactEmail',
    contactPhone: 'contactPhone',
    address: 'address',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const ServiceProviderScalarFieldEnum = {
    uuid: 'uuid',
    fullName: 'fullName',
    phone: 'phone',
    mobilePhone: 'mobilePhone',
    title: 'title',
    organizationId: 'organizationId',
    role: 'role',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const VehicleScalarFieldEnum = {
    uuid: 'uuid',
    displayName: 'displayName',
    fleetId: 'fleetId',
    model: 'model',
    year: 'year',
    color: 'color',
    licensePlate: 'licensePlate',
    capacity: 'capacity',
    serviceArea: 'serviceArea',
    walkerAccessible: 'walkerAccessible',
    wheelchairAccessible: 'wheelchairAccessible',
    serviceAnimalFriendly: 'serviceAnimalFriendly',
    oxygenTankAccessible: 'oxygenTankAccessible',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const RideScalarFieldEnum = {
    uuid: 'uuid',
    displayId: 'displayId',
    riderUuid: 'riderUuid',
    driverUuid: 'driverUuid',
    vehicleUuid: 'vehicleUuid',
    riderName: 'riderName',
    riderPhone: 'riderPhone',
    pickupAddress: 'pickupAddress',
    dropOffAddress: 'dropOffAddress',
    pickupRequestedTime: 'pickupRequestedTime',
    dropOffRequestedTime: 'dropOffRequestedTime',
    rideStartedActualTime: 'rideStartedActualTime',
    pickupActualTime: 'pickupActualTime',
    dropOffActualTime: 'dropOffActualTime',
    rideCompleteRequestedTime: 'rideCompleteRequestedTime',
    rideCompleteActualTime: 'rideCompleteActualTime',
    rideStatus: 'rideStatus',
    rideRequestStatus: 'rideRequestStatus',
    roundTrip: 'roundTrip',
    purpose: 'purpose',
    notes: 'notes',
    walkerAccessible: 'walkerAccessible',
    wheelchairAccessible: 'wheelchairAccessible',
    serviceAnimalFriendly: 'serviceAnimalFriendly',
    oxygenTankAccessible: 'oxygenTankAccessible',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const NotificationScalarFieldEnum = {
    uuid: 'uuid',
    rideUuid: 'rideUuid',
    notificationType: 'notificationType',
    direction: 'direction',
    recipientPhone: 'recipientPhone',
    recipientName: 'recipientName',
    recipientRole: 'recipientRole',
    messageBody: 'messageBody',
    twilioMessageSid: 'twilioMessageSid',
    twilioStatus: 'twilioStatus',
    errorMessage: 'errorMessage',
    sentAt: 'sentAt',
    deliveredAt: 'deliveredAt',
    sessionActive: 'sessionActive',
    sessionClosedAt: 'sessionClosedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const SystemUserScalarFieldEnum = {
    uuid: 'uuid',
    username: 'username',
    passwordHash: 'passwordHash',
    fullName: 'fullName',
    role: 'role',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
export const QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
export const NullsOrder = {
    first: 'first',
    last: 'last'
};
export const defineExtension = runtime.Extensions.defineExtension;
//# sourceMappingURL=prismaNamespace.js.map