require('dotenv').config({ path: '../.env' });
const express = require('express');
const notificationService = require('../services/notificationService');


function createRouter(api)
{
    const router = express.Router();

    router.get(`/riderequests`, async (req, res) => {
        res.json(await api.getRideRequests());
    });

    router.get(`/riderequests/:id`, async (req, res) => {
        res.json(await api.getRideRequest(req.params.id));
    });

    router.post(`/riderequests`, async (req, res) => {
        res.json(await api.addRideRequest(req.body));
    });

    router.put(`/riderequests/:id`, async (req, res) => {
        try {
            const rideUuid = req.params.id;

            // Get old ride data before update
            const oldRide = await api.getRideRequest(rideUuid);

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
                // Search for vehicle - the API doesn't have a direct getVehicle method
                const vehicleSearch = await api.fuzzyVehicleSearch(updatedRide.assignedVehicleUuid.toString());
                userData.vehicle = vehicleSearch && vehicleSearch.length > 0 ? vehicleSearch[0] : null;
            }

            // Trigger notifications based on status changes
            console.log('=== SMS NOTIFICATION DEBUG ===');
            console.log('Old status:', oldRide?.rideRequestStatus);
            console.log('New status:', updatedRide.rideRequestStatus);
            console.log('Rider:', userData.rider?.fullName, userData.rider?.phone);
            console.log('Driver:', userData.driver?.fullName, userData.driver?.mobilePhone);
            console.log('Vehicle:', userData.vehicle?.displayName);

            const notifications = await notificationService.handleRideStatusChange(
                updatedRide,
                oldRide?.rideRequestStatus,
                updatedRide.rideRequestStatus,
                userData
            );

            console.log('Notifications returned:', notifications.length);
            console.log('=============================');

            // Auto-close session when ride is complete
            const rideStatuses = require('../constants/rideStatuses');
            if (updatedRide.rideStatus === rideStatuses.RIDE_COMPLETE ||
                updatedRide.rideStatus === rideStatuses.ROUNDTRIP_COMPLETE) {
                await api.closeRideSession(rideUuid);
                console.log(`Auto-closed SMS session for ride #${rideUuid}`);
            }

            // Save notification records to database
            for (const notif of notifications) {
                if (notif.success) {
                    const notificationRecord = {
                        uuid: Date.now() + Math.random(), // Generate unique ID
                        rideRequestUuid: parseInt(rideUuid),
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

    router.get(`/users`, async (req, res) => {
        res.json(await api.getUsers());
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

    // Twilio webhook for incoming SMS responses
    router.post(`/notifications/webhook`, async (req, res) => {
        try {
            const { From, To, Body, MessageSid, SmsStatus } = req.body;

            console.log('Incoming SMS webhook:', { From, To, Body, MessageSid });

            // Generate unique notification ID
            const notificationUuid = Date.now();

            // Create notification record for incoming message
            const notification = {
                uuid: notificationUuid,
                rideRequestUuid: 0, // Will need to be associated with a ride later
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

    // Status callback endpoint for delivery notifications
    router.post(`/notifications/status`, async (req, res) => {
        try {
            const { MessageSid, MessageStatus } = req.body;

            console.log('SMS status update:', { MessageSid, MessageStatus });

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


    return router;
}

module.exports = createRouter;