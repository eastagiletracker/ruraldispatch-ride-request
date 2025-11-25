import { randomUUID } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { RIDE_REQUEST_STATUSES } from '../constants/rideRequestStatuses.js';
import { isClosingStatus, RIDE_STATUSES } from '../constants/rideStatuses.js';
import notificationService from '../services/notificationService.js';
import scheduler from '../services/scheduler/RideScheduler.js';
import type { ServiceProvider, User, Vehicle } from '../types/database.types.js';

/**
 * Ride Request Routes Plugin
 * Handles all ride request CRUD operations and related business logic
 *
 * Endpoints:
 * - GET /api/riderequests - Get all ride requests
 * - GET /api/riderequests/:id - Get specific ride request
 * - POST /api/riderequests - Create new ride request
 * - PUT /api/riderequests/:id - Update ride request (complex business logic)
 */

interface UserData {
  rider?: User | null;
  driver?: ServiceProvider | null;
  vehicle?: Vehicle | null;
}

const rideRequestRoutes: FastifyPluginAsync = async (fastify) => {
  const api = fastify.database;

  /**
   * Helper to transform ride data for client compatibility
   * Converts rider/driver from single objects to arrays
   */
  const transformRideForClient = (ride: any) => {
    return {
      ...ride,
      rider: ride.rider ? [ride.rider] : [],
      driver: ride.driver ? [ride.driver] : [],
      vehicle: ride.vehicle || null,
    };
  };

  /**
   * GET /api/riderequests
   * Get all ride requests
   */
  fastify.get('/', async () => {
    const rides = await api.getRideRequests();
    return rides.map(transformRideForClient);
  });

  /**
   * GET /api/riderequests/:id
   * Get a specific ride request by ID
   */
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const rideRequest = await api.getRideRequest(request.params.id);
      if (!rideRequest) {
        return reply.status(404).send({ error: 'Ride request not found' });
      }
      return transformRideForClient(rideRequest);
    } catch (error) {
      fastify.log.error(error, 'Error fetching ride request');
      return reply.status(500).send({
        error: 'Failed to fetch ride request',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/riderequests
   * Create a new ride request
   */
  fastify.post('/', async (request, reply) => {
    try {
      // Validation handled by frontend Zod schema
      const newRideRequest = await api.addRideRequest(request.body as any);
      return newRideRequest;
    } catch (error) {
      fastify.log.error(error, 'Error creating ride request');
      return reply.status(500).send({
        error: 'Failed to create ride request',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * PUT /api/riderequests/:id
   * Update a ride request
   * Handles validation, notifications, and task scheduling
   */
  fastify.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const rideUuid = request.params.id;
      const body = request.body as any;

      // Get old ride data before update (needed for validation and notifications)
      const oldRide = await api.getRideRequest(rideUuid);

      if (!oldRide) {
        return reply.status(404).send({ error: 'Ride request not found' });
      }

      // Validate: If setting rideRequestStatus to 400 or higher, require both driver and vehicle
      if (body.rideRequestStatus !== undefined && body.rideRequestStatus >= 400) {
        // Check both the update body and existing ride data
        const bodyDriverUuid = body.driverUuid;
        const bodyVehicleUuid = body.vehicleUuid;
        const oldDriverUuid = oldRide.driverUuid;
        const oldVehicleUuid = oldRide.vehicleUuid;

        const hasDriver =
          (bodyDriverUuid !== undefined && bodyDriverUuid !== null) ||
          (oldDriverUuid !== undefined && oldDriverUuid !== null);
        const hasVehicle =
          (bodyVehicleUuid !== undefined && bodyVehicleUuid !== null) ||
          (oldVehicleUuid !== undefined && oldVehicleUuid !== null);

        if (!hasDriver || !hasVehicle) {
          return reply.status(400).send({
            error:
              'Both driver and vehicle must be assigned before setting ride request status to 400 or higher',
            details: {
              hasDriver,
              hasVehicle,
              driverInBody: bodyDriverUuid,
              vehicleInBody: bodyVehicleUuid,
              driverInRide: oldDriverUuid,
              vehicleInRide: oldVehicleUuid,
            },
          });
        }
      }

      // Check if updating ride status to a closing status
      if (body.rideStatus !== undefined && isClosingStatus(body.rideStatus)) {
        fastify.log.info(
          `🔒 Auto-closing ride request #${rideUuid} due to status ${body.rideStatus}`
        );
        body.rideRequestStatus = RIDE_REQUEST_STATUSES.ALL_RIDE_REQUEST_CLOSED.code;

        // Cancel all scheduled tasks for this ride
        scheduler.cancelRideTasks(rideUuid);
      }

      // Update the ride
      const updateResult = await api.updateRideRequest(rideUuid, body);

      // Get updated ride data with full user/provider info
      const updatedRide = await api.getRideRequest(rideUuid);

      if (!updatedRide) {
        return reply.status(500).send({ error: 'Failed to retrieve updated ride' });
      }

      // Get user data for notifications
      const userData: UserData = {};

      // Use data already populated in the ride object from getRideRequest
      if (updatedRide.rider) {
        userData.rider = updatedRide.rider;
      } else if (updatedRide.riderName || updatedRide.riderPhone) {
        // Fallback to riderName/riderPhone if no linked rider
        // Cast as any to allow fallback object
        userData.rider = {
          fullName: updatedRide.riderName || 'Unknown Rider',
          phone: updatedRide.riderPhone || null,
        } as any;
      }

      if (updatedRide.driver) {
        userData.driver = updatedRide.driver;
      }

      // Check for vehicle UUID
      const vehicleUuidToCheck = updatedRide.vehicleUuid;
      if (vehicleUuidToCheck) {
        fastify.log.info({ vehicleUuid: vehicleUuidToCheck }, '🚗 Looking up vehicle');
        try {
          userData.vehicle = await api.getVehicle(vehicleUuidToCheck);
          if (userData.vehicle) {
            fastify.log.info({ vehicle: userData.vehicle.displayName }, '✅ Found vehicle');
          } else {
            fastify.log.warn({ vehicleUuid: vehicleUuidToCheck }, '⚠️ Vehicle not found');
          }
        } catch (error) {
          fastify.log.error(error, '❌ Error fetching vehicle');
          userData.vehicle = null;
        }
      }

      // Trigger notifications based on status changes
      fastify.log.info('=== SMS NOTIFICATION DEBUG ===');
      fastify.log.info(
        {
          oldRideStatus: oldRide?.rideStatus,
          newRideStatus: updatedRide.rideStatus,
          oldRequestStatus: oldRide?.rideRequestStatus,
          newRequestStatus: updatedRide.rideRequestStatus,
          riderName: userData.rider
            ? 'fullName' in userData.rider
              ? userData.rider.fullName
              : undefined
            : undefined,
          riderPhone: userData.rider
            ? 'phone' in userData.rider
              ? userData.rider.phone
              : undefined
            : undefined,
          driverName: userData.driver?.fullName,
          driverContact: userData.driver?.mobilePhone || userData.driver?.phone || 'No phone',
          vehicle: userData.vehicle?.displayName,
        },
        'Status change details'
      );

      const notifications = await notificationService.handleRideStatusChange(
        updatedRide,
        oldRide?.rideRequestStatus,
        updatedRide.rideRequestStatus,
        userData
      );

      fastify.log.info({ count: notifications.length }, 'Notifications sent');
      fastify.log.info('=============================');

      // Schedule tasks based on status changes
      if (
        updatedRide.rideStatus === RIDE_STATUSES.RIDE_CONFIRMED &&
        oldRide.rideStatus !== RIDE_STATUSES.RIDE_CONFIRMED
      ) {
        // Ride just confirmed - schedule all initial tasks
        fastify.log.info(`📅 Ride confirmed - scheduling tasks for ride #${rideUuid}`);
        if (userData.driver) {
          scheduler.scheduleRideConfirmationTasks(updatedRide, userData.driver);
        }
      }

      if (
        updatedRide.rideStatus === RIDE_STATUSES.RIDER_PICKED_UP &&
        oldRide.rideStatus !== RIDE_STATUSES.RIDER_PICKED_UP
      ) {
        // Rider just picked up - schedule pickup tasks
        fastify.log.info(`📅 Rider picked up - scheduling pickup tasks for ride #${rideUuid}`);
        if (userData.driver) {
          scheduler.schedulePickupTasks(updatedRide, userData.driver, async (uuid, updates) => {
            return await api.updateRideRequest(uuid, updates);
          });
        }
      }

      if (
        updatedRide.rideStatus === RIDE_STATUSES.RIDER_DROPPED_OFF &&
        oldRide.rideStatus !== RIDE_STATUSES.RIDER_DROPPED_OFF &&
        updatedRide.roundTrip
      ) {
        // Rider dropped off on roundtrip - schedule return tasks
        fastify.log.info(`📅 Roundtrip dropoff - scheduling return tasks for ride #${rideUuid}`);
        if (userData.driver) {
          scheduler.scheduleDropoffTasks(updatedRide, userData.driver);
        }
      }

      // Auto-close session when ride is complete
      if (
        updatedRide.rideStatus === RIDE_STATUSES.RIDE_COMPLETE ||
        updatedRide.rideStatus === RIDE_STATUSES.ROUNDTRIP_COMPLETE
      ) {
        await api.closeRideSession(rideUuid);
        fastify.log.info(`✅ Auto-closed SMS session for ride #${rideUuid}`);

        // Cancel any remaining scheduled tasks (in-memory timeouts)
        scheduler.cancelRideTasks(rideUuid);
        
        // Cancel any scheduled Twilio messages
        console.log(`[CANCEL] Canceling scheduled Twilio messages for completed ride #${rideUuid}`);
        await notificationService.cancelScheduledMessagesForRide(rideUuid);
      }

      // Cancel scheduled messages if ride is cancelled by rider (status 109)
      if (
        updatedRide.rideStatus === RIDE_STATUSES.RIDE_CANCELED_BY_RIDER &&
        oldRide.rideStatus !== RIDE_STATUSES.RIDE_CANCELED_BY_RIDER
      ) {
        console.log(`[CANCEL] Ride cancelled by rider #${rideUuid} - canceling scheduled messages`);
        scheduler.cancelRideTasks(rideUuid);
        await notificationService.cancelScheduledMessagesForRide(rideUuid);
        await api.closeRideSession(rideUuid);
      }

      // Save notification records to database
      for (const notif of notifications) {
        if (notif.success) {
          const notificationRecord = {
            uuid: randomUUID(),
            rideUuid: rideUuid,
            notificationType: notif.type,
            direction: 'outbound' as const,
            recipientPhone: notif.to,
            recipientName:
              userData.rider && 'fullName' in userData.rider
                ? userData.rider.fullName
                : userData.driver?.fullName,
            recipientRole: notif.type.includes('rider') ? ('rider' as const) : ('driver' as const),
            messageBody: notif.body,
            twilioMessageSid: notif.messageSid,
            twilioStatus: notif.status || undefined,
            sentAt: notif.timestamp,
            sessionActive: true,
          };

          await api.addNotification(notificationRecord);
        }
      }

      return {
        success: true,
        updateResult,
        notifications,
        ride: updatedRide,
      };
    } catch (error) {
      fastify.log.error(error, 'Error updating ride request');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};

export default rideRequestRoutes;
