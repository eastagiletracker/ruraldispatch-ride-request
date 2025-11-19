require('dotenv').config({ path: '../.env' });
const express = require('express');
const notificationService = require('../services/notificationService');
const scheduler = require('../services/scheduler/RideScheduler');
const { checkPermission } = require('../middleware/permissions');
const { RIDE_STATUSES, isClosingStatus } = require('../constants/rideStatuses');
const { RIDE_REQUEST_STATUSES } = require('../constants/rideRequestStatuses');
const { generateUuid } = require('../utils/uuid');


function createRouter(api)
{
    const router = express.Router();

    // Initialize notification service with database API
    notificationService.setApi(api);
    console.log('✅ Notification service initialized with database API');

    router.get(`/riderequests`, async (req, res) => {
        res.json(await api.getRideRequests());
    });

    router.get(`/riderequests/:id`, async (req, res) => {
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

    router.post(`/riderequests`, async (req, res) => {
        try {
            const { pickupRequestedTime } = req.body;

            // Validate pickup time is at least 30 minutes in the future
            if (pickupRequestedTime) {
                const pickupDateTime = new Date(pickupRequestedTime);
                const now = new Date();
                const minAllowedTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now

                if (pickupDateTime < minAllowedTime) {
                    return res.status(400).json({
                        error: 'Pickup time must be at least 30 minutes from now'
                    });
                }

                // Validate pickup time is not in the past
                if (pickupDateTime < now) {
                    return res.status(400).json({
                        error: 'Pickup time cannot be in the past'
                    });
                }
            }

            res.json(await api.addRideRequest(req.body));
        } catch (error) {
            console.error('Error creating ride request:', error);
            res.status(500).json({ error: 'Failed to create ride request', message: error.message });
        }
    });

    router.put(`/riderequests/:id`, async (req, res) => {
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
            }

            // Request status constants available from module scope

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

    router.get(`/users`, checkPermission('canViewUsers'), async (req, res) => {
        try {
            const users = await api.getUsers();
            res.json({ success: true, users: users });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    router.get(`/users/:id`, async (req, res) => {
        res.json(await api.getUser(req.params.id));
    });

    router.get(`/users/:id/fields/:fields`, async (req, res) => {
        res.json(await api.getSpecifiedFieldsOfUser(req.params.id, req.params.fields.split(',')));
    });

    router.post(`/users`, async (req, res) => {
        res.json(await api.addUser(req.body));
    });

    router.post(`/users/sms-consent`, async (req, res) => {
        try {
            const { phoneNumber, consentGiven, timestamp, ipAddress } = req.body;
            
            // Find user by phone and update consent
            const result = await api.updateUserSMSConsent(phoneNumber, {
                given: consentGiven,
                timestamp: timestamp || new Date().toISOString(),
                ipAddress: ipAddress || req.ip
            });

            // If newly given consent, send confirmation SMS (verbal/web).
            if (consentGiven) {
                try {
                    await notificationService.sendSMS(phoneNumber, 'SWARM LLC: Welcome! You\'re signed up for ride notifications (1-5 msgs/ride). Msg&data rates may apply. Reply STOP to opt-out, HELP for support. Terms: https://ruraldispatch.swarmnyc.com/sms-terms');
                } catch (e) {
                    console.error('Failed to send confirmation SMS:', e.message);
                }
            }

            res.json({ 
                success: true, 
                message: 'SMS consent updated successfully',
                result 
            });
        } catch (error) {
            console.error('Error updating SMS consent:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update SMS consent' 
            });
        }
    });

    router.get(`/users/fields/:fields`, async (req, res) => {
        res.json(await api.getSpecifiedFieldsOfUsers(req.params.fields.split(',')));
    });

    router.get(`/users/fuzzy/:searchTerm`, async (req, res) => {
        res.json(await api.fuzzyUserSearch(req.params.searchTerm));
    });

    router.get(`/providers`, async (req, res) => {
        res.json(await api.getProviders());
    });

    router.get(`/providers/:id`, async (req, res) => {
        res.json(await api.getProvider(req.params.id));
    });

    router.get(`/providers/fuzzy/:searchTerm`, async (req, res) => {
        res.json(await api.fuzzyProviderSearch(req.params.searchTerm));
    });

    router.post(`/providers`, async (req, res) => {
        res.json(await api.addProvider(req.body));
    });

    router.get(`/vehicles/fuzzy/:searchTerm`, async (req, res) => {
        res.json(await api.fuzzyVehicleSearch(req.params.searchTerm));
    });

    router.post(`/vehicles`, async (req, res) => {
        res.json(await api.addVehicle(req.body));
    });

    // Notification endpoints
    router.get(`/notifications/ride/:rideUuid`, async (req, res) => {
        try {
            const notifications = await api.getNotificationsByRide(req.params.rideUuid);
            res.json({ success: true, notifications });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    router.get(`/notifications/phone/:phone`, async (req, res) => {
        try {
            const notifications = await api.getNotificationsByPhone(req.params.phone);
            res.json({ success: true, notifications });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    router.get(`/notifications/active/:rideUuid`, async (req, res) => {
        try {
            const notifications = await api.getActiveSessionNotifications(req.params.rideUuid);
            res.json({ success: true, notifications });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    router.get(`/notifications/stats/:rideUuid`, async (req, res) => {
        try {
            const stats = await api.getRideNotificationStats(req.params.rideUuid);
            res.json({ success: true, stats });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    router.post(`/notifications/close-session/:rideUuid`, async (req, res) => {
        try {
            const result = await api.closeRideSession(req.params.rideUuid);
            const serviceResult = await notificationService.closeRideSession(req.params.rideUuid);
            res.json({ success: true, result, serviceResult });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Helper function to determine sender role
    function determineSenderRole(ride, phoneNumber) {
        // Check if sender is rider
        if (ride.rider && ride.rider[0]?.phone === phoneNumber) {
            return 'rider';
        }

        // Check if sender is driver
        if (ride.driver && ride.driver[0]) {
            const driverPhone = ride.driver[0].mobilePhone || ride.driver[0].phone;
            if (driverPhone === phoneNumber) {
                return 'driver';
            }
        }

        // Check if sender is case manager (creator)
        if (ride.createdBy?.phone === phoneNumber) {
            return 'case_manager';
        }

        return 'unknown';
    }

    // Twilio webhook for incoming SMS responses
    router.post(`/notifications/webhook/twilio`, async (req, res) => {
        try {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📨 INCOMING TWILIO SMS WEBHOOK RECEIVED');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            const { From, To, Body, MessageSid, SmsStatus } = req.body;

            console.log('📨 Parsed webhook data:', { From, To, Body, MessageSid });

            const senderPhone = From;
            console.log('🔍 Looking for active ride from sender:', senderPhone);

            // Find active rides involving this phone number
            const allRides = await api.getRideRequests();
            console.log(`📋 Total rides in database: ${allRides.length}`);

            // Filter all active rides involving this sender
            const activeRides = allRides.filter(ride => {
                // Check if ride is active (not complete)
                const isActive = ride.rideStatus !== RIDE_STATUSES.RIDE_COMPLETE &&
                                ride.rideStatus !== RIDE_STATUSES.ROUNDTRIP_COMPLETE;

                if (!isActive) return false;

                // Check if sender is the rider or driver
                const isRider = ride.rider && ride.rider.length > 0 &&
                               ride.rider[0].phone === senderPhone;
                const isDriver = ride.driver && ride.driver.length > 0 &&
                                (ride.driver[0].mobilePhone === senderPhone ||
                                 ride.driver[0].phone === senderPhone);

                return isRider || isDriver;
            });

            // Get the most recent active ride (highest UUID/timestamp)
            let activeRide = activeRides.sort((a, b) => b.uuid - a.uuid)[0];

            if (activeRides.length > 1) {
                console.log(`⚠️  Found ${activeRides.length} active rides, using most recent: #${activeRide.uuid}`);
            }

            if (activeRide) {
                console.log(`✅ Found active ride: #${activeRide.uuid}`);
                console.log(`   Rider: ${activeRide.rider?.[0]?.fullName} (${activeRide.rider?.[0]?.phone})`);
                console.log(`   Driver: ${activeRide.driver?.[0]?.fullName} (${activeRide.driver?.[0]?.mobilePhone || activeRide.driver?.[0]?.phone})`);
                console.log(`   Current Status: ${activeRide.rideStatus}`);
            } else {
                console.log('❌ No active ride found for this sender');
            }

            // Determine sender role
            const senderRole = activeRide ? determineSenderRole(activeRide, senderPhone) : 'unknown';
            console.log(`👤 Sender role: ${senderRole}`);

            // Process interactive SMS response
            if (activeRide && senderRole !== 'unknown') {
                // Try to process as interactive response (1, 2, 3)
                const action = await notificationService.processIncomingSMS(
                    senderPhone,
                    Body,
                    activeRide,
                    senderRole
                );

                console.log('🔄 Processing result:', action);

                if (action.success) {
                    // Execute status updates
                    const updates = {};
                    const previousRideStatus = activeRide.rideStatus;

                    if (action.newRideStatus !== undefined) {
                        updates.rideStatus = action.newRideStatus;
                        console.log(`📝 Updating ride status to: ${action.newRideStatus}`);
                    }

                    if (action.newRequestStatus !== undefined) {
                        updates.requestStatus = action.newRequestStatus;
                        console.log(`📝 Updating request status to: ${action.newRequestStatus}`);
                    }

                    if (updates.rideStatus !== undefined && updates.requestStatus === undefined && isClosingStatus(updates.rideStatus)) {
                        updates.requestStatus = RIDE_REQUEST_STATUSES.CLOSED.code;
                        console.log('📝 Auto-closing ride request because ride entered a closing status');
                    }

                    if (Object.keys(updates).length > 0) {
                        await api.updateRideRequest(activeRide.uuid, updates);
                        console.log(`✅ Ride #${activeRide.uuid} updated`);

                        if (updates.rideStatus !== undefined && isClosingStatus(updates.rideStatus)) {
                            scheduler.cancelRideTasks(activeRide.uuid);
                        }

                        activeRide = await api.getRideRequest(activeRide.uuid);

                        if (activeRide.rideStatus === RIDE_STATUSES.RIDE_COMPLETE ||
                            activeRide.rideStatus === RIDE_STATUSES.ROUNDTRIP_COMPLETE) {
                            await api.closeRideSession(activeRide.uuid);
                            console.log(`✅ Auto-closed SMS session for ride #${activeRide.uuid}`);
                        }
                    }

                    const riderData = activeRide.rider?.[0];
                    const driverData = activeRide.driver?.[0];
                    const vehicleData = activeRide.vehicle?.[0];

                    const data = {
                        rider: riderData,
                        driver: driverData,
                        vehicle: vehicleData,
                        caseManager: activeRide.createdBy,
                        rideRequest: activeRide,
                        pickupLocation: activeRide.pickupLocation
                    };

                    // Send bulk notifications
                    if (action.notifications && action.notifications.length > 0) {
                        console.log(`📨 Sending ${action.notifications.length} notifications`);
                        const notifResults = await notificationService.sendBulkNotifications(
                            activeRide,
                            action.notifications,
                            data
                        );
                        console.log(`✅ Notifications sent:`, notifResults);
                    }

                    // Schedule future notifications
                    if (action.scheduleNotification) {
                        const { recipient, template, delayMinutes } = action.scheduleNotification;
                        console.log(`⏰ Scheduling ${template} notification to ${recipient} in ${delayMinutes} minutes`);

                        scheduler.scheduleNotification(
                            activeRide,
                            recipient,
                            template,
                            delayMinutes,
                            data
                        );
                    }

                    // Schedule status change
                    if (action.scheduleStatusChange) {
                        const { status, delayMinutes } = action.scheduleStatusChange;
                        console.log(`⏰ Scheduling status change to ${status} in ${delayMinutes} minutes`);

                        scheduler.scheduleStatusChange(
                            activeRide,
                            status,
                            delayMinutes,
                            async (uuid, newUpdates) => await api.updateRideRequest(uuid, newUpdates)
                        );
                    }

                    // Mirror scheduler behavior triggered via dashboard updates
                    if (previousRideStatus !== activeRide.rideStatus) {
                        if (activeRide.rideStatus === RIDE_STATUSES.RIDE_CONFIRMED && previousRideStatus !== RIDE_STATUSES.RIDE_CONFIRMED) {
                            if (riderData && driverData) {
                                scheduler.scheduleRideConfirmationTasks(
                                    activeRide,
                                    riderData,
                                    driverData,
                                    async (uuid, rideUpdates) => await api.updateRideRequest(uuid, rideUpdates)
                                );
                            }
                        }

                        if (activeRide.rideStatus === RIDE_STATUSES.RIDER_PICKED_UP && previousRideStatus !== RIDE_STATUSES.RIDER_PICKED_UP) {
                            if (driverData) {
                                scheduler.schedulePickupTasks(
                                    activeRide,
                                    driverData,
                                    async (uuid, rideUpdates) => await api.updateRideRequest(uuid, rideUpdates)
                                );
                            }
                        }

                        if (activeRide.rideStatus === RIDE_STATUSES.RIDER_DROPPED_OFF && previousRideStatus !== RIDE_STATUSES.RIDER_DROPPED_OFF) {
                            if (activeRide.roundTrip && driverData) {
                                scheduler.scheduleDropoffTasks(activeRide, driverData);
                            }
                        }
                    }
                } else {
                    // Not an interactive response - forward as conversation
                    console.log('💬 Not an interactive response, forwarding as conversation');

                    let recipientPhone = null;
                    let recipientName = null;

                    if (senderRole === 'rider') {
                        // Forward to driver
                        if (activeRide.driver && activeRide.driver.length > 0) {
                            recipientPhone = activeRide.driver[0].mobilePhone || activeRide.driver[0].phone;
                            recipientName = activeRide.driver[0].fullName;

                            const senderName = activeRide.rider[0].fullName;
                            const forwardMessage = `Message from ${senderName} (Rider):\n${Body}`;

                            console.log(`📤 Forwarding rider message to driver: ${recipientPhone}`);
                            await notificationService.sendSMS(recipientPhone, forwardMessage);
                        }
                    } else if (senderRole === 'driver') {
                        // Forward to rider
                        if (activeRide.rider && activeRide.rider.length > 0) {
                            recipientPhone = activeRide.rider[0].phone;
                            recipientName = activeRide.rider[0].fullName;

                            const senderName = activeRide.driver[0].fullName;
                            const forwardMessage = `Message from ${senderName} (Driver):\n${Body}`;

                            console.log(`📤 Forwarding driver message to rider: ${recipientPhone}`);
                            await notificationService.sendSMS(recipientPhone, forwardMessage);
                        }
                    }
                }
            } else {
                console.log('⚠️  No active ride or unknown sender - ignoring message');
            }

            // Create notification record for incoming message
            const notificationUuid = generateUuid();
            const notification = {
                uuid: notificationUuid,
                rideRequestUuid: activeRide ? activeRide.uuid : null,
                notificationType: senderRole !== 'unknown' ? 'sms_response' : 'incoming_sms',
                direction: 'inbound',
                recipientPhone: To,
                recipientRole: senderRole,
                messageBody: Body,
                twilioMessageSid: MessageSid,
                twilioStatus: 'received',
                sentAt: new Date(),
                sessionActive: true
            };

            // Save the incoming message
            await api.addNotification(notification);

            // Respond to Twilio with empty response (don't auto-reply)
            res.type('text/xml');
            res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
        } catch (error) {
            console.error('Twilio webhook error:', error);
            res.status(500).send('Error processing webhook');
        }
    });

    // Test endpoint to verify webhook is accessible
    router.get(`/notifications/webhook/vonage`, (req, res) => {
        console.log('✅ Vonage webhook test endpoint hit (GET request)');
        res.json({
            status: 'ok',
            message: 'Vonage webhook endpoint is accessible',
            timestamp: new Date().toISOString()
        });
    });

    // Vonage webhook for incoming SMS responses
    router.post(`/notifications/webhook/vonage`, async (req, res) => {
        try {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📨 INCOMING SMS WEBHOOK RECEIVED');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Full request body:', JSON.stringify(req.body, null, 2));
            console.log('Headers:', JSON.stringify(req.headers, null, 2));

            const { msisdn, to, messageId, text, type, keyword, 'message-timestamp': timestamp } = req.body;

            console.log('📨 Parsed webhook data:', { from: msisdn, to, messageId, text });

            // Format the sender's phone number
            const senderPhone = msisdn.startsWith('+') ? msisdn : `+${msisdn}`;
            console.log('🔍 Looking for active ride from sender:', senderPhone);

            // Find active rides involving this phone number
            const allRides = await api.getRideRequests();
            console.log(`📋 Total rides in database: ${allRides.length}`);

            // Filter all active rides involving this sender
            const activeRides = allRides.filter(ride => {
                // Check if ride is active (not complete)
                const isActive = ride.rideStatus !== RIDE_STATUSES.RIDE_COMPLETE &&
                                ride.rideStatus !== RIDE_STATUSES.ROUNDTRIP_COMPLETE;

                if (!isActive) return false;

                // Check if sender is the rider or driver
                const isRider = ride.rider && ride.rider.length > 0 &&
                               ride.rider[0].phone === senderPhone;
                const isDriver = ride.driver && ride.driver.length > 0 &&
                                (ride.driver[0].mobilePhone === senderPhone ||
                                 ride.driver[0].phone === senderPhone);

                return isRider || isDriver;
            });

            // Get the most recent active ride (highest UUID/timestamp)
            const activeRide = activeRides.sort((a, b) => b.uuid - a.uuid)[0];

            if (activeRides.length > 1) {
                console.log(`⚠️  Found ${activeRides.length} active rides, using most recent: #${activeRide.uuid}`);
            }

            if (activeRide) {
                console.log(`✅ Found active ride: #${activeRide.uuid}`);
                console.log(`   Rider: ${activeRide.rider?.[0]?.fullName} (${activeRide.rider?.[0]?.phone})`);
                console.log(`   Driver: ${activeRide.driver?.[0]?.fullName} (${activeRide.driver?.[0]?.mobilePhone || activeRide.driver?.[0]?.phone})`);
                console.log(`   Driver data:`, JSON.stringify(activeRide.driver?.[0], null, 2));
            } else {
                console.log('❌ No active ride found for this sender');
            }

            // Generate unique notification ID
            const notificationUuid = generateUuid();

            // Determine sender role and recipient
            let senderRole = 'unknown';
            let recipientPhone = null;
            let recipientName = null;

            if (activeRide) {
                const isRider = activeRide.rider && activeRide.rider.length > 0 &&
                               activeRide.rider[0].phone === senderPhone;
                const isDriver = activeRide.driver && activeRide.driver.length > 0 &&
                                (activeRide.driver[0].mobilePhone === senderPhone ||
                                 activeRide.driver[0].phone === senderPhone);

                if (isRider) {
                    senderRole = 'rider';
                    // Forward to driver
                    if (activeRide.driver && activeRide.driver.length > 0) {
                        recipientPhone = activeRide.driver[0].mobilePhone || activeRide.driver[0].phone;
                        recipientName = activeRide.driver[0].fullName;

                        const senderName = activeRide.rider[0].fullName;
                        const forwardMessage = `Message from ${senderName} (Rider):\n${text}`;

                        console.log(`📤 Forwarding rider message to driver: ${recipientPhone}`);
                        const result = await notificationService.sendSMS(recipientPhone, forwardMessage);
                        console.log(`✅ Forward result:`, result.success ? 'SUCCESS' : 'FAILED');
                    }
                } else if (isDriver) {
                    senderRole = 'driver';
                    // Forward to rider
                    if (activeRide.rider && activeRide.rider.length > 0) {
                        recipientPhone = activeRide.rider[0].phone;
                        recipientName = activeRide.rider[0].fullName;

                        const senderName = activeRide.driver[0].fullName;
                        const forwardMessage = `Message from ${senderName} (Driver):\n${text}`;

                        console.log(`📤 Forwarding driver message to rider: ${recipientPhone}`);
                        const result = await notificationService.sendSMS(recipientPhone, forwardMessage);
                        console.log(`✅ Forward result:`, result.success ? 'SUCCESS' : 'FAILED');
                    }
                }
            } else {
                console.log('⚠️  No active ride found for sender:', senderPhone);
            }

            // Create notification record for incoming message
            const notification = {
                uuid: notificationUuid,
                rideRequestUuid: activeRide ? activeRide.uuid : null,
                notificationType: 'incoming_sms',
                direction: 'inbound',
                recipientPhone: to,
                recipientRole: senderRole,
                messageBody: text,
                twilioMessageSid: messageId,
                twilioStatus: 'received',
                sentAt: timestamp ? new Date(timestamp) : new Date(),
                sessionActive: true
            };

            // Save the incoming message
            await api.addNotification(notification);

            // Respond to Vonage with 200 OK
            res.status(200).send('OK');
        } catch (error) {
            console.error('Vonage webhook error:', error);
            res.status(500).send('Error processing webhook');
        }
    });

    // Legacy webhook endpoint (defaults to Twilio for backward compatibility)
    router.post(`/notifications/webhook`, async (req, res) => {
        try {
            const { From, To, Body, MessageSid, SmsStatus } = req.body;

            console.log('Incoming SMS webhook (legacy):', { From, To, Body, MessageSid });

            // Generate unique notification ID
            const notificationUuid = generateUuid();

            // Create notification record for incoming message
            const notification = {
                uuid: notificationUuid,
                rideRequestUuid: null, // Will need to be associated with a ride later
                notificationType: 'incoming_sms',
                direction: 'inbound',
                recipientPhone: To,
                recipientRole: 'dispatcher',
                messageBody: Body,
                twilioMessageSid: MessageSid,
                twilioStatus: 'received',
                sentAt: new Date(),
                sessionActive: true
            };

            // Save the incoming message
            await api.addNotification(notification);

            // Respond to Twilio
            res.type('text/xml');
            res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>Thank you for your message. A dispatcher will review it shortly.</Message>
</Response>`);
        } catch (error) {
            console.error('Webhook error:', error);
            res.status(500).send('Error processing webhook');
        }
    });

    // Twilio status callback endpoint for delivery notifications
    router.post(`/notifications/status/twilio`, async (req, res) => {
        try {
            const { MessageSid, MessageStatus } = req.body;

            console.log('Twilio SMS status update:', { MessageSid, MessageStatus });

            // Update notification status
            await api.updateNotificationStatus(MessageSid, {
                twilioStatus: MessageStatus,
                deliveredAt: MessageStatus === 'delivered' ? new Date() : undefined
            });

            res.sendStatus(200);
        } catch (error) {
            console.error('Twilio status callback error:', error);
            res.status(500).send('Error processing status');
        }
    });

    // Vonage delivery receipt endpoint
    router.post(`/notifications/status/vonage`, async (req, res) => {
        try {
            const { messageId, status, 'err-code': errCode } = req.body;

            console.log('Vonage delivery receipt:', { messageId, status, errCode });

            // Map Vonage status to our internal status
            const statusMap = {
                'delivered': 'delivered',
                'accepted': 'accepted',
                'buffered': 'queued',
                'failed': 'failed',
                'rejected': 'failed',
                'expired': 'failed'
            };

            const mappedStatus = statusMap[status] || status;

            // Update notification status
            await api.updateNotificationStatus(messageId, {
                twilioStatus: mappedStatus,
                deliveredAt: status === 'delivered' ? new Date() : undefined
            });

            res.sendStatus(200);
        } catch (error) {
            console.error('Vonage delivery receipt error:', error);
            res.status(500).send('Error processing delivery receipt');
        }
    });

    // Legacy status callback endpoint (defaults to Twilio for backward compatibility)
    router.post(`/notifications/status`, async (req, res) => {
        try {
            const { MessageSid, MessageStatus } = req.body;

            console.log('SMS status update (legacy):', { MessageSid, MessageStatus });

            // Update notification status
            await api.updateNotificationStatus(MessageSid, {
                twilioStatus: MessageStatus,
                deliveredAt: MessageStatus === 'delivered' ? new Date() : undefined
            });

            res.sendStatus(200);
        } catch (error) {
            console.error('Status callback error:', error);
            res.status(500).send('Error processing status');
        }
    });

    // Get SMS provider status
    router.get(`/notifications/provider-status`, async (req, res) => {
        try {
            const status = notificationService.getProviderStatus();
            res.json({ success: true, status });
        } catch (error) {
            console.error('Error getting provider status:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get scheduler status (admin/debugging)
    router.get(`/notifications/scheduler-status`, async (req, res) => {
        try {
            const status = scheduler.getStatus();
            res.json({
                success: true,
                scheduler: status,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error getting scheduler status:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ====================
    // SYSTEM USER / AUTHENTICATION ENDPOINTS
    // ====================

    // Login endpoint
    router.post(`/auth/login`, async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username and password are required'
                });
            }

            const result = await api.authenticateSystemUser(username, password);

            if (result.success) {
                res.json({
                    success: true,
                    user: result.user
                });
            } else {
                res.status(401).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during login'
            });
        }
    });

    // Get all system users (admin only)
    router.get(`/auth/users`, async (req, res) => {
        try {
            const users = await api.getAllSystemUsers();
            res.json({ success: true, users });
        } catch (error) {
            console.error('Error getting system users:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get system user by UUID
    router.get(`/auth/users/:uuid`, async (req, res) => {
        try {
            const user = await api.getSystemUserByUuid(req.params.uuid);
            if (user) {
                const { passwordHash, ...userWithoutPassword } = user;
                res.json({ success: true, user: userWithoutPassword });
            } else {
                res.status(404).json({ success: false, message: 'User not found' });
            }
        } catch (error) {
            console.error('Error getting system user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Create new system user (admin only)
    router.post(`/auth/users`, async (req, res) => {
        try {
            const result = await api.createSystemUser(req.body);
            res.json({
                success: true,
                message: 'User created successfully',
                user: result.user
            });
        } catch (error) {
            console.error('Error creating system user:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create user'
            });
        }
    });

    // Update system user (admin only)
    router.put(`/auth/users/:uuid`, async (req, res) => {
        try {
            const result = await api.updateSystemUser(req.params.uuid, req.body);
            res.json({
                success: true,
                message: 'User updated successfully',
                result
            });
        } catch (error) {
            console.error('Error updating system user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Deactivate system user (admin only)
    router.post(`/auth/users/:uuid/deactivate`, async (req, res) => {
        try {
            const result = await api.deactivateSystemUser(req.params.uuid);
            res.json({
                success: true,
                message: 'User deactivated successfully',
                result
            });
        } catch (error) {
            console.error('Error deactivating system user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Activate system user (admin only)
    router.post(`/auth/users/:uuid/activate`, async (req, res) => {
        try {
            const result = await api.activateSystemUser(req.params.uuid);
            res.json({
                success: true,
                message: 'User activated successfully',
                result
            });
        } catch (error) {
            console.error('Error activating system user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Delete system user (admin only)
    router.delete(`/auth/users/:uuid`, async (req, res) => {
        try {
            const result = await api.deleteSystemUser(req.params.uuid);
            res.json({
                success: true,
                message: 'User deleted successfully',
                result
            });
        } catch (error) {
            console.error('Error deleting system user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ==================== MANAGER ENDPOINTS (Admin Only) ====================

    // Get all service providers (admin/dispatcher)
    router.get(`/service-providers`, checkPermission('canViewServiceProviders'), async (req, res) => {
        try {
            const providers = await api.getProviders();
            res.json({ 
                success: true, 
                serviceProviders: providers 
            });
        } catch (error) {
            console.error('Error fetching service providers:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Delete service provider (admin only)
    router.delete(`/service-providers/:uuid`, checkPermission('canDeleteServiceProviders'), async (req, res) => {
        try {
            const result = await api.deleteProvider(req.params.uuid);
            res.json({ 
                success: true, 
                message: 'Service provider deleted successfully',
                result 
            });
        } catch (error) {
            console.error('Error deleting service provider:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get all vehicles (admin/dispatcher)
    router.get(`/vehicles`, checkPermission('canViewVehicles'), async (req, res) => {
        try {
            const vehicles = await api.getVehicles();
            res.json({ 
                success: true, 
                vehicles: vehicles 
            });
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Delete vehicle (admin only)
    router.delete(`/vehicles/:uuid`, checkPermission('canDeleteVehicles'), async (req, res) => {
        try {
            const result = await api.deleteVehicle(req.params.uuid);
            res.json({ 
                success: true, 
                message: 'Vehicle deleted successfully',
                result 
            });
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Delete user/rider (admin only)
    router.delete(`/users/:uuid`, checkPermission('canDeleteUsers'), async (req, res) => {
        try {
            const result = await api.deleteUser(req.params.uuid);
            res.json({ 
                success: true, 
                message: 'User deleted successfully',
                result 
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get all system users (case managers, etc.) - admin only
    router.get(`/auth/system-users`, checkPermission('canViewSystemUsers'), async (req, res) => {
        try {
            const role = req.query.role;
            let users;
            
            if (role) {
                users = await api.getSystemUsersByRole(role);
            } else {
                users = await api.getAllSystemUsers();
            }
            
            res.json({ 
                success: true, 
                users: users 
            });
        } catch (error) {
            console.error('Error fetching system users:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Toggle system user status (admin only)
    router.patch(`/auth/system-users/:uuid/toggle-status`, checkPermission('canManageSystemUsers'), async (req, res) => {
        try {
            const { isActive } = req.body;
            const result = await api.updateSystemUserStatus(req.params.uuid, isActive);
            res.json({ 
                success: true, 
                message: 'User status updated successfully',
                result 
            });
        } catch (error) {
            console.error('Error updating system user status:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Delete system user (admin only)
    router.delete(`/auth/system-users/:uuid`, checkPermission('canManageSystemUsers'), async (req, res) => {
        try {
            const result = await api.deleteSystemUser(req.params.uuid);
            res.json({ 
                success: true, 
                message: 'System user deleted successfully',
                result 
            });
        } catch (error) {
            console.error('Error deleting system user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });


    return router;
}

module.exports = createRouter;