/**
 * Prisma-based Database API
 * Replaces MongoDB implementation with Prisma ORM + PostgreSQL
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '../../prisma/generated/client/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { generateRideDisplayId } from '../utils/displayId.js';

const { Pool } = pg;

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function generateApi() {
  // Create PostgreSQL connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Create Prisma adapter
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('🔌 Connected to PostgreSQL via Prisma 7');

  const api = {
    // ==================== RIDE REQUEST METHODS ====================

    /**
     * Get a single ride request with joined user/driver/vehicle data
     */
    getRideRequest: async (uuid) => {
      const ride = await prisma.ride.findUnique({
        where: { uuid },
        include: {
          rider: true,
          driver: true,
          vehicle: true,
          notifications: true
        }
      });

      if (!ride) return null;

      // Format to match MongoDB structure for backward compatibility
      return {
        ...ride,
        rider: ride.rider ? [ride.rider] : [],
        driver: ride.driver ? [ride.driver] : [],
        assignedVehicleUuid: ride.vehicleUuid,
        assignedDriverUuid: ride.driverUuid,
        serviceUserUuid: ride.riderUuid,
        serviceUserName: ride.riderName,
        serviceUserPhone: ride.riderPhone
      };
    },

    /**
     * Get all ride requests with joined data
     */
    getRideRequests: async () => {
      const rides = await prisma.ride.findMany({
        include: {
          rider: true,
          driver: true,
          vehicle: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Format to match MongoDB structure
      return rides.map(ride => ({
        ...ride,
        rider: ride.rider ? [ride.rider] : [],
        driver: ride.driver ? [ride.driver] : [],
        assignedVehicleUuid: ride.vehicleUuid,
        assignedDriverUuid: ride.driverUuid,
        serviceUserUuid: ride.riderUuid,
        serviceUserName: ride.riderName,
        serviceUserPhone: ride.riderPhone
      }));
    },

    /**
     * Add a new ride request
     */
    addRideRequest: async (rideReq) => {
      return await prisma.ride.create({
        data: {
          uuid: rideReq.uuid,
          displayId: rideReq.displayId || generateRideDisplayId(),
          riderUuid: rideReq.serviceUserUuid || rideReq.riderUuid || null,
          riderName: rideReq.serviceUserName || null,
          riderPhone: rideReq.serviceUserPhone || null,
          driverUuid: rideReq.assignedDriverUuid || rideReq.driverUuid || null,
          vehicleUuid: rideReq.assignedVehicleUuid || rideReq.vehicleUuid || null,
          pickupAddress: rideReq.pickupAddress,
          dropOffAddress: rideReq.dropOffAddress,
          pickupRequestedTime: new Date(rideReq.pickupRequestedTime),
          dropOffRequestedTime: rideReq.dropOffRequestedTime ? new Date(rideReq.dropOffRequestedTime) : null,
          rideStartedActualTime: rideReq.rideStartedActualTime ? new Date(rideReq.rideStartedActualTime) : null,
          pickupActualTime: rideReq.pickupActualTime ? new Date(rideReq.pickupActualTime) : null,
          dropOffActualTime: rideReq.dropOffActualTime ? new Date(rideReq.dropOffActualTime) : null,
          rideCompleteRequestedTime: rideReq.rideCompleteRequestedTime ? new Date(rideReq.rideCompleteRequestedTime) : null,
          rideCompleteActualTime: rideReq.rideCompleteActualTime ? new Date(rideReq.rideCompleteActualTime) : null,
          rideStatus: rideReq.rideStatus || 0,
          rideRequestStatus: rideReq.rideRequestStatus || 100,
          roundTrip: rideReq.roundTrip || false,
          purpose: rideReq.purpose || null,
          notes: rideReq.notes || null,
          walkerAccessible: rideReq.walkerAccessible || false,
          wheelchairAccessible: rideReq.wheelchairAccessible || false,
          serviceAnimalFriendly: rideReq.serviceAnimalFriendly || false,
          oxygenTankAccessible: rideReq.oxygenTankAccessible || false
        }
      });
    },

    /**
     * Update a ride request
     */
    updateRideRequest: async (uuid, replacementFields) => {
      // Map MongoDB field names to Prisma schema
      const updates = {
        ...(replacementFields.assignedDriverUuid !== undefined && { driverUuid: replacementFields.assignedDriverUuid }),
        ...(replacementFields.assignedVehicleUuid !== undefined && { vehicleUuid: replacementFields.assignedVehicleUuid }),
        ...(replacementFields.serviceUserUuid !== undefined && { riderUuid: replacementFields.serviceUserUuid }),
        ...(replacementFields.pickupAddress !== undefined && { pickupAddress: replacementFields.pickupAddress }),
        ...(replacementFields.dropOffAddress !== undefined && { dropOffAddress: replacementFields.dropOffAddress }),
        ...(replacementFields.pickupRequestedTime !== undefined && { pickupRequestedTime: new Date(replacementFields.pickupRequestedTime) }),
        ...(replacementFields.dropOffRequestedTime !== undefined && { dropOffRequestedTime: replacementFields.dropOffRequestedTime ? new Date(replacementFields.dropOffRequestedTime) : null }),
        ...(replacementFields.rideStartedActualTime !== undefined && { rideStartedActualTime: replacementFields.rideStartedActualTime ? new Date(replacementFields.rideStartedActualTime) : null }),
        ...(replacementFields.pickupActualTime !== undefined && { pickupActualTime: replacementFields.pickupActualTime ? new Date(replacementFields.pickupActualTime) : null }),
        ...(replacementFields.dropOffActualTime !== undefined && { dropOffActualTime: replacementFields.dropOffActualTime ? new Date(replacementFields.dropOffActualTime) : null }),
        ...(replacementFields.rideCompleteRequestedTime !== undefined && { rideCompleteRequestedTime: replacementFields.rideCompleteRequestedTime ? new Date(replacementFields.rideCompleteRequestedTime) : null }),
        ...(replacementFields.rideCompleteActualTime !== undefined && { rideCompleteActualTime: replacementFields.rideCompleteActualTime ? new Date(replacementFields.rideCompleteActualTime) : null }),
        ...(replacementFields.rideStatus !== undefined && { rideStatus: replacementFields.rideStatus }),
        ...(replacementFields.rideRequestStatus !== undefined && { rideRequestStatus: replacementFields.rideRequestStatus }),
        ...(replacementFields.requestStatus !== undefined && { rideRequestStatus: replacementFields.requestStatus }),
        ...(replacementFields.roundTrip !== undefined && { roundTrip: replacementFields.roundTrip }),
        ...(replacementFields.purpose !== undefined && { purpose: replacementFields.purpose }),
        ...(replacementFields.notes !== undefined && { notes: replacementFields.notes }),
        ...(replacementFields.walkerAccessible !== undefined && { walkerAccessible: replacementFields.walkerAccessible }),
        ...(replacementFields.wheelchairAccessible !== undefined && { wheelchairAccessible: replacementFields.wheelchairAccessible }),
        ...(replacementFields.serviceAnimalFriendly !== undefined && { serviceAnimalFriendly: replacementFields.serviceAnimalFriendly }),
        ...(replacementFields.oxygenTankAccessible !== undefined && { oxygenTankAccessible: replacementFields.oxygenTankAccessible })
      };

      return await prisma.ride.update({
        where: { uuid },
        data: updates
      });
    },

    // ==================== USER METHODS ====================

    getUser: async (uuid) => {
      return await prisma.user.findUnique({
        where: { uuid }
      });
    },

    getUsers: async () => {
      return await prisma.user.findMany({
        orderBy: {
          fullName: 'asc'
        }
      });
    },

    getSpecifiedFieldsOfUser: async (uuid, fields) => {
      const select = fields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {});

      return await prisma.user.findUnique({
        where: { uuid },
        select
      });
    },

    getSpecifiedFieldsOfUsers: async (fields) => {
      const select = fields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {});

      return await prisma.user.findMany({
        select
      });
    },

    addUser: async (user) => {
      return await prisma.user.create({
        data: {
          uuid: user.uuid,
          fullName: user.fullName,
          phone: user.phone,
          role: user.serviceUserRole?.[0] || user.role || 'rider',
          smsConsentGiven: user.smsConsent?.given || user.smsConsentGiven || false,
          smsConsentTimestamp: user.smsConsent?.timestamp ? new Date(user.smsConsent.timestamp) : user.smsConsentTimestamp ? new Date(user.smsConsentTimestamp) : null,
          smsConsentIpAddress: user.smsConsent?.ipAddress || user.smsConsentIpAddress || null
        }
      });
    },

    updateUserSMSConsent: async (phone, consentData) => {
      return await prisma.user.update({
        where: { phone },
        data: {
          smsConsentGiven: consentData.given,
          smsConsentTimestamp: consentData.timestamp ? new Date(consentData.timestamp) : new Date(),
          smsConsentIpAddress: consentData.ipAddress
        }
      });
    },

    deleteUser: async (uuid) => {
      return await prisma.user.delete({
        where: { uuid }
      });
    },

    fuzzyUserSearch: async (searchTerm) => {
      return await prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm } }
          ]
        },
        orderBy: {
          fullName: 'asc'
        }
      });
    },

    // ==================== PROVIDER METHODS ====================

    getProvider: async (uuid) => {
      return await prisma.serviceProvider.findUnique({
        where: { uuid },
        include: {
          organization: true
        }
      });
    },

    getProviders: async () => {
      return await prisma.serviceProvider.findMany({
        include: {
          organization: true
        },
        orderBy: {
          fullName: 'asc'
        }
      });
    },

    addProvider: async (provider) => {
      return await prisma.serviceProvider.create({
        data: {
          uuid: provider.uuid,
          fullName: provider.fullName,
          phone: provider.phone || null,
          mobilePhone: provider.mobilePhone || null
        }
      });
    },

    deleteProvider: async (uuid) => {
      return await prisma.serviceProvider.delete({
        where: { uuid }
      });
    },

    fuzzyProviderSearch: async (searchTerm) => {
      return await prisma.serviceProvider.findMany({
        where: {
          OR: [
            { fullName: { contains: searchTerm, mode: 'insensitive' } },
            { mobilePhone: { contains: searchTerm } },
            { phone: { contains: searchTerm } }
          ]
        },
        orderBy: {
          fullName: 'asc'
        }
      });
    },

    // ==================== VEHICLE METHODS ====================

    getVehicle: async (uuid) => {
      const vehicle = await prisma.vehicle.findUnique({
        where: { uuid }
      });

      if (!vehicle) return null;

      // Transform accessibility booleans into comma-separated string
      const features = [];
      if (vehicle.wheelchairAccessible) features.push('Wheelchair');
      if (vehicle.walkerAccessible) features.push('Walker');
      if (vehicle.serviceAnimalFriendly) features.push('Service Animal');
      if (vehicle.oxygenTankAccessible) features.push('Oxygen Tank');

      return {
        ...vehicle,
        accessibilityFeatures: features.length > 0 ? features.join(', ') : 'None'
      };
    },

    getVehicles: async () => {
      const vehicles = await prisma.vehicle.findMany({
        orderBy: {
          displayName: 'asc'
        }
      });

      // Transform accessibility booleans into comma-separated string for each vehicle
      return vehicles.map(vehicle => {
        const features = [];
        if (vehicle.wheelchairAccessible) features.push('Wheelchair');
        if (vehicle.walkerAccessible) features.push('Walker');
        if (vehicle.serviceAnimalFriendly) features.push('Service Animal');
        if (vehicle.oxygenTankAccessible) features.push('Oxygen Tank');

        return {
          ...vehicle,
          accessibilityFeatures: features.length > 0 ? features.join(', ') : 'None'
        };
      });
    },

    addVehicle: async (vehicle) => {
      return await prisma.vehicle.create({
        data: {
          uuid: vehicle.uuid,
          displayName: vehicle.displayName,
          model: vehicle.model || null,
          year: vehicle.year || null,
          color: vehicle.color || null,
          licensePlate: vehicle.licensePlate || null,
          walkerAccessible: vehicle.walkerAccessible || false,
          wheelchairAccessible: vehicle.wheelchairAccessible || false,
          serviceAnimalFriendly: vehicle.serviceAnimalFriendly || false,
          oxygenTankAccessible: vehicle.oxygenTankAccessible || false
        }
      });
    },

    deleteVehicle: async (uuid) => {
      return await prisma.vehicle.delete({
        where: { uuid }
      });
    },

    fuzzyVehicleSearch: async (searchTerm) => {
      return await prisma.vehicle.findMany({
        where: {
          OR: [
            { displayName: { contains: searchTerm, mode: 'insensitive' } },
            { licensePlate: { contains: searchTerm, mode: 'insensitive' } },
            { model: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        orderBy: {
          displayName: 'asc'
        }
      });
    },

    // ==================== NOTIFICATION METHODS ====================

    getNotificationsByRide: async (rideRequestUuid) => {
      return await prisma.notification.findMany({
        where: { rideUuid: rideRequestUuid },
        orderBy: {
          sentAt: 'asc'
        }
      });
    },

    getNotificationsByPhone: async (phone) => {
      return await prisma.notification.findMany({
        where: { recipientPhone: phone },
        orderBy: {
          sentAt: 'desc'
        }
      });
    },

    getActiveSessionNotifications: async (rideRequestUuid) => {
      return await prisma.notification.findMany({
        where: {
          rideUuid: rideRequestUuid,
          sessionActive: true
        },
        orderBy: {
          sentAt: 'desc'
        }
      });
    },

    addNotification: async (notification) => {
      return await prisma.notification.create({
        data: {
          uuid: notification.uuid,
          rideUuid: notification.rideRequestUuid || notification.rideUuid || null,
          notificationType: notification.notificationType,
          direction: notification.direction,
          recipientPhone: notification.recipientPhone,
          recipientName: notification.recipientName || null,
          recipientRole: notification.recipientRole,
          messageBody: notification.messageBody,
          twilioMessageSid: notification.twilioMessageSid || null,
          twilioStatus: notification.twilioStatus || 'pending',
          errorMessage: notification.errorMessage || null,
          sentAt: notification.sentAt ? new Date(notification.sentAt) : new Date(),
          deliveredAt: notification.deliveredAt ? new Date(notification.deliveredAt) : null,
          sessionActive: notification.sessionActive !== undefined ? notification.sessionActive : true,
          sessionClosedAt: notification.sessionClosedAt ? new Date(notification.sessionClosedAt) : null
        }
      });
    },

    updateNotificationStatus: async (twilioMessageSid, statusData) => {
      return await prisma.notification.update({
        where: { twilioMessageSid },
        data: {
          twilioStatus: statusData.status,
          errorMessage: statusData.errorMessage || null,
          deliveredAt: statusData.deliveredAt ? new Date(statusData.deliveredAt) : null
        }
      });
    },

    closeRideSession: async (rideRequestUuid) => {
      return await prisma.notification.updateMany({
        where: {
          rideUuid: rideRequestUuid,
          sessionActive: true
        },
        data: {
          sessionActive: false,
          sessionClosedAt: new Date()
        }
      });
    },

    getNotificationByMessageSid: async (twilioMessageSid) => {
      return await prisma.notification.findUnique({
        where: { twilioMessageSid }
      });
    },

    getAllNotifications: async (limit = 100) => {
      return await prisma.notification.findMany({
        orderBy: {
          sentAt: 'desc'
        },
        take: limit
      });
    },

    getRideNotificationStats: async (rideRequestUuid) => {
      const notifications = await prisma.notification.findMany({
        where: { rideUuid: rideRequestUuid }
      });

      return {
        total: notifications.length,
        sent: notifications.filter(n => n.twilioStatus === 'sent').length,
        delivered: notifications.filter(n => n.twilioStatus === 'delivered').length,
        failed: notifications.filter(n => n.twilioStatus === 'failed').length
      };
    },

    // ==================== SYSTEM USER METHODS ====================

    getAllSystemUsers: async () => {
      return await prisma.systemUser.findMany({
        orderBy: {
          username: 'asc'
        }
      });
    },

    getSystemUserByUsername: async (username) => {
      return await prisma.systemUser.findUnique({
        where: { username }
      });
    },

    getSystemUserByUuid: async (uuid) => {
      return await prisma.systemUser.findUnique({
        where: { uuid }
      });
    },

    getSystemUsersByRole: async (role) => {
      return await prisma.systemUser.findMany({
        where: { role },
        orderBy: {
          username: 'asc'
        }
      });
    },

    createSystemUser: async (userData) => {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      return await prisma.systemUser.create({
        data: {
          uuid: userData.uuid,
          username: userData.username,
          passwordHash: hashedPassword,
          fullName: userData.fullName,
          role: userData.role,
          isActive: userData.isActive !== undefined ? userData.isActive : true
        }
      });
    },

    authenticateSystemUser: async (username, password) => {
      const user = await prisma.systemUser.findUnique({
        where: { username }
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is deactivated'
        };
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }

      // Return user without password hash
      const { passwordHash, ...userWithoutPassword } = user;
      return {
        success: true,
        user: userWithoutPassword
      };
    },

    updateSystemUser: async (uuid, updateData) => {
      const data = { ...updateData };

      // Hash password if being updated
      if (data.password) {
        data.passwordHash = await bcrypt.hash(data.password, 10);
        delete data.password;
      }

      return await prisma.systemUser.update({
        where: { uuid },
        data
      });
    },

    updateSystemUserStatus: async (uuid, isActive) => {
      return await prisma.systemUser.update({
        where: { uuid },
        data: { isActive }
      });
    },

    deactivateSystemUser: async (uuid) => {
      return await prisma.systemUser.update({
        where: { uuid },
        data: { isActive: false }
      });
    },

    activateSystemUser: async (uuid) => {
      return await prisma.systemUser.update({
        where: { uuid },
        data: { isActive: true }
      });
    },

    deleteSystemUser: async (uuid) => {
      return await prisma.systemUser.delete({
        where: { uuid }
      });
    }
  };

  return api;
}

export default generateApi;
