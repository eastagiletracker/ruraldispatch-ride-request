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
            console.log('Old status:', oldRide?.rideRequestStatus);
            console.log('New status:', updatedRide.rideRequestStatus);
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

    router.post(`/users/sms-consent`, async (req, res) => {
        try {
            const { phoneNumber, consentGiven, timestamp, ipAddress } = req.body;
            
            // Find user by phone and update consent
            const result = await api.updateUserSMSConsent(phoneNumber, {
                given: consentGiven,
                timestamp: timestamp || new Date().toISOString(),
                ipAddress: ipAddress || req.ip
            });

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
            const rideStatuses = require('../constants/rideStatuses');
            const activeRides = allRides.filter(ride => {
                // Check if ride is active (not complete)
                const isActive = ride.rideStatus !== rideStatuses.RIDE_COMPLETE &&
                                ride.rideStatus !== rideStatuses.ROUNDTRIP_COMPLETE;

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
            } else {
                console.log('❌ No active ride found for this sender');
            }

            // Generate unique notification ID
            const notificationUuid = Date.now();

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
                        const forwardMessage = `Message from ${senderName} (Rider):\n${Body}`;

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
                        const forwardMessage = `Message from ${senderName} (Driver):\n${Body}`;

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
                rideRequestUuid: activeRide ? parseInt(activeRide.uuid) : 0,
                notificationType: 'incoming_sms',
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
            const rideStatuses = require('../constants/rideStatuses');
            const activeRides = allRides.filter(ride => {
                // Check if ride is active (not complete)
                const isActive = ride.rideStatus !== rideStatuses.RIDE_COMPLETE &&
                                ride.rideStatus !== rideStatuses.ROUNDTRIP_COMPLETE;

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
            const notificationUuid = Date.now();

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
                rideRequestUuid: activeRide ? parseInt(activeRide.uuid) : 0,
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


    return router;
}

module.exports = createRouter;