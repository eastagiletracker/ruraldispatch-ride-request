-- CreateTable
CREATE TABLE "users" (
    "uuid" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "role" TEXT NOT NULL DEFAULT 'rider',
    "smsConsentGiven" BOOLEAN DEFAULT false,
    "smsConsentTimestamp" TIMESTAMP(3),
    "smsConsentIpAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_providers" (
    "uuid" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "mobilePhone" TEXT,
    "title" TEXT,
    "organizationId" INTEGER,
    "role" TEXT NOT NULL DEFAULT 'Driver',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "uuid" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "fleetId" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "color" TEXT,
    "licensePlate" TEXT,
    "capacity" INTEGER,
    "serviceArea" TEXT,
    "walkerAccessible" BOOLEAN NOT NULL DEFAULT false,
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT false,
    "serviceAnimalFriendly" BOOLEAN NOT NULL DEFAULT false,
    "oxygenTankAccessible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "rides" (
    "uuid" UUID NOT NULL,
    "displayId" TEXT NOT NULL,
    "riderUuid" UUID,
    "driverUuid" UUID,
    "vehicleUuid" UUID,
    "riderName" TEXT,
    "riderPhone" TEXT,
    "pickupAddress" TEXT NOT NULL,
    "dropOffAddress" TEXT NOT NULL,
    "pickupRequestedTime" TIMESTAMP(3) NOT NULL,
    "dropOffRequestedTime" TIMESTAMP(3),
    "rideStartedActualTime" TIMESTAMP(3),
    "pickupActualTime" TIMESTAMP(3),
    "dropOffActualTime" TIMESTAMP(3),
    "rideCompleteRequestedTime" TIMESTAMP(3),
    "rideCompleteActualTime" TIMESTAMP(3),
    "rideStatus" INTEGER NOT NULL DEFAULT 0,
    "rideRequestStatus" INTEGER NOT NULL DEFAULT 100,
    "roundTrip" BOOLEAN NOT NULL DEFAULT false,
    "purpose" TEXT,
    "notes" TEXT,
    "estimatedTravelTime" INTEGER,
    "walkerAccessible" BOOLEAN NOT NULL DEFAULT false,
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT false,
    "serviceAnimalFriendly" BOOLEAN NOT NULL DEFAULT false,
    "oxygenTankAccessible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rides_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "notifications" (
    "uuid" UUID NOT NULL,
    "rideUuid" UUID,
    "notificationType" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "recipientName" TEXT,
    "recipientRole" TEXT NOT NULL,
    "messageBody" TEXT NOT NULL,
    "twilioMessageSid" TEXT,
    "twilioStatus" TEXT DEFAULT 'pending',
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "sessionActive" BOOLEAN NOT NULL DEFAULT true,
    "sessionClosedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "system_users" (
    "uuid" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_users_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_fullName_idx" ON "users"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");

-- CreateIndex
CREATE INDEX "organizations_name_idx" ON "organizations"("name");

-- CreateIndex
CREATE INDEX "service_providers_mobilePhone_idx" ON "service_providers"("mobilePhone");

-- CreateIndex
CREATE INDEX "service_providers_fullName_idx" ON "service_providers"("fullName");

-- CreateIndex
CREATE INDEX "service_providers_role_idx" ON "service_providers"("role");

-- CreateIndex
CREATE INDEX "service_providers_organizationId_idx" ON "service_providers"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_fleetId_key" ON "vehicles"("fleetId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_licensePlate_key" ON "vehicles"("licensePlate");

-- CreateIndex
CREATE INDEX "vehicles_licensePlate_idx" ON "vehicles"("licensePlate");

-- CreateIndex
CREATE INDEX "vehicles_displayName_idx" ON "vehicles"("displayName");

-- CreateIndex
CREATE INDEX "vehicles_fleetId_idx" ON "vehicles"("fleetId");

-- CreateIndex
CREATE INDEX "vehicles_serviceArea_idx" ON "vehicles"("serviceArea");

-- CreateIndex
CREATE UNIQUE INDEX "rides_displayId_key" ON "rides"("displayId");

-- CreateIndex
CREATE INDEX "rides_riderUuid_idx" ON "rides"("riderUuid");

-- CreateIndex
CREATE INDEX "rides_driverUuid_idx" ON "rides"("driverUuid");

-- CreateIndex
CREATE INDEX "rides_vehicleUuid_idx" ON "rides"("vehicleUuid");

-- CreateIndex
CREATE INDEX "rides_rideStatus_idx" ON "rides"("rideStatus");

-- CreateIndex
CREATE INDEX "rides_rideRequestStatus_idx" ON "rides"("rideRequestStatus");

-- CreateIndex
CREATE INDEX "rides_pickupRequestedTime_idx" ON "rides"("pickupRequestedTime");

-- CreateIndex
CREATE INDEX "rides_displayId_idx" ON "rides"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_twilioMessageSid_key" ON "notifications"("twilioMessageSid");

-- CreateIndex
CREATE INDEX "notifications_rideUuid_idx" ON "notifications"("rideUuid");

-- CreateIndex
CREATE INDEX "notifications_recipientPhone_idx" ON "notifications"("recipientPhone");

-- CreateIndex
CREATE INDEX "notifications_twilioMessageSid_idx" ON "notifications"("twilioMessageSid");

-- CreateIndex
CREATE INDEX "notifications_sessionActive_idx" ON "notifications"("sessionActive");

-- CreateIndex
CREATE INDEX "notifications_sentAt_idx" ON "notifications"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_users_username_key" ON "system_users"("username");

-- CreateIndex
CREATE INDEX "system_users_username_idx" ON "system_users"("username");

-- CreateIndex
CREATE INDEX "system_users_role_idx" ON "system_users"("role");

-- AddForeignKey
ALTER TABLE "service_providers" ADD CONSTRAINT "service_providers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rides" ADD CONSTRAINT "rides_riderUuid_fkey" FOREIGN KEY ("riderUuid") REFERENCES "users"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rides" ADD CONSTRAINT "rides_driverUuid_fkey" FOREIGN KEY ("driverUuid") REFERENCES "service_providers"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rides" ADD CONSTRAINT "rides_vehicleUuid_fkey" FOREIGN KEY ("vehicleUuid") REFERENCES "vehicles"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_rideUuid_fkey" FOREIGN KEY ("rideUuid") REFERENCES "rides"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
