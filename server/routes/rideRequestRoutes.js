const express = require('express');
const notificationService = require('../services/notificationService');
const scheduler = require('../services/scheduler/RideScheduler');
const { RIDE_STATUSES, isClosingStatus } = require('../constants/rideStatuses');
const { RIDE_REQUEST_STATUSES } = require('../constants/rideRequestStatuses');
const { generateUuid } = require('../utils/uuid');

/**
 * Ride Request Routes
 * Handles all ride request CRUD operations and related business logic
 */
function createRideRequestRoutes(api) {
    const router = express.Router();

    /**
     * GET /api/riderequests
     * Get all ride requests
     */
    router.get('/', async (req, res) => {
        res.json(await api.getRideRequests());
    });

    /**
     * GET /api/riderequests/:id
     * Get a specific ride request by ID
     */
    router.get('/:id', async (req, res) => {
        try {
            const rideRequest = await api.getRideRequest(req.params.id);
            if (!rideRequest) {
                return res.status(404).json({ error: 'Ride request not found' });
            }
            res.json(rideRequest);
        } catch (error) {
            console.error('Error fetching ride request:', error);
            res.status(500).json({ error: 'Failed to fetch ride request', message: error.message });
        }
    });

    /**
     * POST /api/riderequests
     * Create a new ride request
     */
    router.post('/', async (req, res) => {
        try {
            // Validation handled by frontend Zod schema
            res.json(await api.addRideRequest(req.body));
        } catch (error) {
            console.error('Error creating ride request:', error);
            res.status(500).json({ error: 'Failed to create ride request', message: error.message });
        }
    });

    /**
     * PUT /api/riderequests/:id
     * Update a ride request
     * Handles validation, notifications, and task scheduling
     */
    router.put('/:id', async (req, res) => {
        try {
            const rideUuid = req.params.id;

            // Get old ride data before update (needed for validation and notifications)
            const oldRide = await api.getRideRequest(rideUuid);

            if (!oldRide) {
                return res.status(404).json({ error: 'Ride request not found' });
            }

            // Validate: If setting rideRequestStatus to 400 or higher, require both driver and vehicle
            if (req.body.rideRequestStatus >= 400) {
                // Check both the update body and existing ride data
                const hasDriver = (req.body.assignedDriverUuid !== undefined && req.body.assignedDriverUuid !== null)
                    || (oldRide.assignedDriverUuid !== undefined && oldRide.assignedDriverUuid !== null);
                const hasVehicle = (req.body.assignedVehicleUuid !== undefined && req.body.assignedVehicleUuid !== null)
                    || (oldRide.assignedVehicleUuid !== undefined && oldRide.assignedVehicleUuid !== null);

                if (!hasDriver || !hasVehicle) {
                    return res.status(400).json({
                        error: 'Both driver and vehicle must be assigned before setting ride request status to 400 or higher',
                        details: {
                            hasDriver,
                            hasVehicle,
                            driverInBody: req.body.assignedDriverUuid,
                            vehicleInBody: req.body.assignedVehicleUuid,
                            driverInRide: oldRide.assignedDriverUuid,
                            vehicleInRide: oldRide.assignedVehicleUuid
                        }
                    });
                }

                // When driver and vehicle are assigned (status 400), automatically confirm the ride (status 100)
                // This removes the unnecessary driver approval step
                if (req.body.rideRequestStatus === 400 && oldRide.rideRequestStatus !== 400) {
                    console.log('🎯 Auto-confirming ride: Setting rideStatus to RIDE_CONFIRMED (100)');
                    req.body.rideStatus = RIDE_STATUSES.RIDE_CONFIRMED;
                }
            }

            // Check if updating ride status to a closing status
            if (req.body.rideStatus !== undefined && isClosingStatus(req.body.rideStatus)) {
                console.log(`🔒 Auto-closing ride request #${rideUuid} due to status ${req.body.rideStatus}`);
                req.body.requestStatus = RIDE_REQUEST_STATUSES.CLOSED.code;

                // Cancel all scheduled tasks for this ride
                scheduler.cancelRideTasks(rideUuid);
            }

            // Update the ride
            const updateResult = await api.updateRideRequest(rideUuid, req.body);

            // Get updated ride data with full user/provider info
            const updatedRide = await api.getRideRequest(rideUuid);

            // Get user data for notifications
            let userData = {};

            // Use data already populated in the ride object from getRideRequest
            if (updatedRide.rider && updatedRide.rider.length > 0) {
                userData.rider = updatedRide.rider[0];
            }

            if (updatedRide.driver && updatedRide.driver.length > 0) {
                userData.driver = updatedRide.driver[0];
            }

            if (updatedRide.assignedVehicleUuid) {
                console.log('🚗 Looking up vehicle UUID:', updatedRide.assignedVehicleUuid);
                try {
                    userData.vehicle = await api.getVehicle(updatedRide.assignedVehicleUuid);
                    if (userData.vehicle) {
                        console.log('✅ Found vehicle:', userData.vehicle.displayName);
                    } else {
                        console.log('⚠️  Vehicle not found for UUID:', updatedRide.assignedVehicleUuid);
                    }
                } catch (error) {
                    console.error('❌ Error fetching vehicle:', error.message);
                    userData.vehicle = null;
                }
            }

            // Trigger notifications based on status changes
            console.log('=== SMS NOTIFICATION DEBUG ===');
            console.log('Old rideStatus:', oldRide?.rideStatus, '→ New rideStatus:', updatedRide.rideStatus);
            console.log('Old requestStatus:', oldRide?.rideRequestStatus, '→ New requestStatus:', updatedRide.rideRequestStatus);
            console.log('Rider:', userData.rider?.fullName, userData.rider?.phone);
            console.log('Driver:', userData.driver?.fullName);
            console.log('Driver contact:', userData.driver?.mobilePhone || userData.driver?.phone || 'No phone');
            console.log('Vehicle:', userData.vehicle?.displayName);

            const notifications = await notificationService.handleRideStatusChange(
                updatedRide,
                oldRide?.rideRequestStatus,
                updatedRide.rideRequestStatus,
                userData
            );

            console.log('Notifications sent:', notifications.length);
            console.log('=============================');

            // Schedule tasks based on status changes
            if (updatedRide.rideStatus === RIDE_STATUSES.RIDE_CONFIRMED &&
                oldRide.rideStatus !== RIDE_STATUSES.RIDE_CONFIRMED) {
                // Ride just confirmed - schedule all initial tasks
                console.log(`📅 Ride confirmed - scheduling tasks for ride #${rideUuid}`);
                if (userData.rider && userData.driver) {
                    scheduler.scheduleRideConfirmationTasks(
                        updatedRide,
                        userData.rider,
                        userData.driver,
                        async (uuid, updates) => await api.updateRideRequest(uuid, updates)
                    );
                }
            }

            if (updatedRide.rideStatus === RIDE_STATUSES.RIDER_PICKED_UP &&
                oldRide.rideStatus !== RIDE_STATUSES.RIDER_PICKED_UP) {
                // Rider just picked up - schedule pickup tasks
                console.log(`📅 Rider picked up - scheduling pickup tasks for ride #${rideUuid}`);
                if (userData.driver) {
                    scheduler.schedulePickupTasks(
                        updatedRide,
                        userData.driver,
                        async (uuid, updates) => await api.updateRideRequest(uuid, updates)
                    );
                }
            }

            if (updatedRide.rideStatus === RIDE_STATUSES.RIDER_DROPPED_OFF &&
                oldRide.rideStatus !== RIDE_STATUSES.RIDER_DROPPED_OFF &&
                updatedRide.roundTrip) {
                // Rider dropped off on roundtrip - schedule return tasks
                console.log(`📅 Roundtrip dropoff - scheduling return tasks for ride #${rideUuid}`);
                if (userData.driver) {
                    scheduler.scheduleDropoffTasks(updatedRide, userData.driver);
                }
            }

            // Auto-close session when ride is complete
            if (updatedRide.rideStatus === RIDE_STATUSES.RIDE_COMPLETE ||
                updatedRide.rideStatus === RIDE_STATUSES.ROUNDTRIP_COMPLETE) {
                await api.closeRideSession(rideUuid);
                console.log(`✅ Auto-closed SMS session for ride #${rideUuid}`);

                // Cancel any remaining scheduled tasks
                scheduler.cancelRideTasks(rideUuid);
            }

            // Save notification records to database
            for (const notif of notifications) {
                if (notif.success) {
                    const notificationRecord = {
                        uuid: generateUuid(),
                        rideRequestUuid: rideUuid,
                        notificationType: notif.type,
                        direction: 'outbound',
                        recipientPhone: notif.to,
                        recipientName: userData.rider?.fullName || userData.driver?.fullName,
                        recipientRole: notif.type.includes('rider') ? 'rider' : 'driver',
                        messageBody: notif.body,
                        twilioMessageSid: notif.messageSid,
                        twilioStatus: notif.status,
                        sentAt: notif.timestamp,
                        sessionActive: true
                    };

                    await api.addNotification(notificationRecord);
                }
            }

            res.json({
                success: true,
                updateResult,
                notifications,
                ride: updatedRide
            });
        } catch (error) {
            console.error('Error updating ride request:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
}

module.exports = createRideRequestRoutes;
