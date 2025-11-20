import express from 'express';
import notificationService from '../services/notificationService.js';
import scheduler from '../services/scheduler/RideScheduler.js';
import { RIDE_STATUSES, isClosingStatus } from '../constants/rideStatuses.js';
import { RIDE_REQUEST_STATUSES } from '../constants/rideRequestStatuses.js';
import { generateUuid } from '../utils/uuid.js';

/**
 * Helper function to determine sender role based on phone number
 */
function determineSenderRole(ride, phoneNumber) {
    // Check if sender is rider (registered user)
    if (ride.rider && ride.rider[0]?.phone === phoneNumber) {
        return 'rider';
    }

    // Check if sender is rider (non-registered service user)
    if (ride.riderPhone === phoneNumber || ride.serviceUserPhone === phoneNumber) {
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

/**
 * Notification Routes
 * Handles SMS notifications, webhooks, and delivery tracking
 */
function createNotificationRoutes(api) {
    const router = express.Router();

    /**
     * GET /api/notifications/ride/:rideUuid
     * Get all notifications for a specific ride
     */
    router.get('/ride/:rideUuid', async (req, res) => {
        try {
            const notifications = await api.getNotificationsByRide(req.params.rideUuid);
            res.json({ success: true, notifications });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * GET /api/notifications/phone/:phone
     * Get all notifications for a specific phone number
     */
    router.get('/phone/:phone', async (req, res) => {
        try {
            const notifications = await api.getNotificationsByPhone(req.params.phone);
            res.json({ success: true, notifications });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * GET /api/notifications/active/:rideUuid
     * Get active session notifications for a ride
     */
    router.get('/active/:rideUuid', async (req, res) => {
        try {
            const notifications = await api.getActiveSessionNotifications(req.params.rideUuid);
            res.json({ success: true, notifications });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * GET /api/notifications/stats/:rideUuid
     * Get notification statistics for a ride
     */
    router.get('/stats/:rideUuid', async (req, res) => {
        try {
            const stats = await api.getRideNotificationStats(req.params.rideUuid);
            res.json({ success: true, stats });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * POST /api/notifications/close-session/:rideUuid
     * Close SMS session for a ride
     */
    router.post('/close-session/:rideUuid', async (req, res) => {
        try {
            const result = await api.closeRideSession(req.params.rideUuid);
            const serviceResult = await notificationService.closeRideSession(req.params.rideUuid);
            res.json({ success: true, result, serviceResult });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * GET /api/notifications/provider-status
     * Get SMS provider status (Twilio/Vonage)
     */
    router.get('/provider-status', async (req, res) => {
        try {
            const status = notificationService.getProviderStatus();
            res.json({ success: true, status });
        } catch (error) {
            console.error('Error getting provider status:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * GET /api/notifications/scheduler-status
     * Get scheduler status for debugging
     */
    router.get('/scheduler-status', async (req, res) => {
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

    /**
     * POST /api/notifications/webhook/twilio
     * Twilio webhook for incoming SMS responses
     * Handles interactive responses (1=Yes, 2=No, 3=Cancel) and message forwarding
     */
    router.post('/webhook/twilio', async (req, res) => {
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
                const isActive = ride.rideStatus !== RIDE_STATUSES.RIDE_COMPLETE &&
                                ride.rideStatus !== RIDE_STATUSES.ROUNDTRIP_COMPLETE;
                if (!isActive) return false;

                // Check if sender is rider (registered or non-registered)
                const isRider = (ride.rider && ride.rider.length > 0 && ride.rider[0].phone === senderPhone) ||
                               ride.riderPhone === senderPhone ||
                               ride.serviceUserPhone === senderPhone;
                
                // Check if sender is driver
                const isDriver = ride.driver && ride.driver.length > 0 &&
                                (ride.driver[0].mobilePhone === senderPhone || ride.driver[0].phone === senderPhone);

                return isRider || isDriver;
            });

            // Get the most recent active ride
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

                    if (senderRole === 'rider' && activeRide.driver && activeRide.driver.length > 0) {
                        const recipientPhone = activeRide.driver[0].mobilePhone || activeRide.driver[0].phone;
                        const senderName = activeRide.rider[0].fullName;
                        const forwardMessage = `Message from ${senderName} (Rider):\n${Body}`;

                        console.log(`📤 Forwarding rider message to driver: ${recipientPhone}`);
                        await notificationService.sendSMS(recipientPhone, forwardMessage);
                    } else if (senderRole === 'driver' && activeRide.rider && activeRide.rider.length > 0) {
                        const recipientPhone = activeRide.rider[0].phone;
                        const senderName = activeRide.driver[0].fullName;
                        const forwardMessage = `Message from ${senderName} (Driver):\n${Body}`;

                        console.log(`📤 Forwarding driver message to rider: ${recipientPhone}`);
                        await notificationService.sendSMS(recipientPhone, forwardMessage);
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

            await api.addNotification(notification);

            // Respond to Twilio with empty response
            res.type('text/xml');
            res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
        } catch (error) {
            console.error('Twilio webhook error:', error);
            res.status(500).send('Error processing webhook');
        }
    });

    /**
     * GET /api/notifications/webhook/vonage
     * Test endpoint to verify Vonage webhook is accessible
     */
    router.get('/webhook/vonage', (req, res) => {
        console.log('✅ Vonage webhook test endpoint hit (GET request)');
        res.json({
            status: 'ok',
            message: 'Vonage webhook endpoint is accessible',
            timestamp: new Date().toISOString()
        });
    });

    /**
     * POST /api/notifications/webhook/vonage
     * Vonage webhook for incoming SMS
     * Forwards messages between riders and drivers
     */
    router.post('/webhook/vonage', async (req, res) => {
        try {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📨 INCOMING SMS WEBHOOK RECEIVED');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            const { msisdn, to, messageId, text, type, keyword, 'message-timestamp': timestamp } = req.body;
            console.log('📨 Parsed webhook data:', { from: msisdn, to, messageId, text });

            const senderPhone = msisdn.startsWith('+') ? msisdn : `+${msisdn}`;
            console.log('🔍 Looking for active ride from sender:', senderPhone);

            const allRides = await api.getRideRequests();
            const activeRides = allRides.filter(ride => {
                const isActive = ride.rideStatus !== RIDE_STATUSES.RIDE_COMPLETE &&
                                ride.rideStatus !== RIDE_STATUSES.ROUNDTRIP_COMPLETE;
                if (!isActive) return false;

                const isRider = ride.rider && ride.rider.length > 0 && ride.rider[0].phone === senderPhone;
                const isDriver = ride.driver && ride.driver.length > 0 &&
                                (ride.driver[0].mobilePhone === senderPhone || ride.driver[0].phone === senderPhone);

                return isRider || isDriver;
            });

            const activeRide = activeRides.sort((a, b) => b.uuid - a.uuid)[0];

            if (activeRide) {
                console.log(`✅ Found active ride: #${activeRide.uuid}`);

                const isRider = activeRide.rider && activeRide.rider.length > 0 && activeRide.rider[0].phone === senderPhone;
                const isDriver = activeRide.driver && activeRide.driver.length > 0 &&
                                (activeRide.driver[0].mobilePhone === senderPhone || activeRide.driver[0].phone === senderPhone);

                let senderRole = 'unknown';

                if (isRider) {
                    senderRole = 'rider';
                    if (activeRide.driver && activeRide.driver.length > 0) {
                        const recipientPhone = activeRide.driver[0].mobilePhone || activeRide.driver[0].phone;
                        const senderName = activeRide.rider[0].fullName;
                        const forwardMessage = `Message from ${senderName} (Rider):\n${text}`;

                        console.log(`📤 Forwarding rider message to driver: ${recipientPhone}`);
                        await notificationService.sendSMS(recipientPhone, forwardMessage);
                    }
                } else if (isDriver) {
                    senderRole = 'driver';
                    if (activeRide.rider && activeRide.rider.length > 0) {
                        const recipientPhone = activeRide.rider[0].phone;
                        const senderName = activeRide.driver[0].fullName;
                        const forwardMessage = `Message from ${senderName} (Driver):\n${text}`;

                        console.log(`📤 Forwarding driver message to rider: ${recipientPhone}`);
                        await notificationService.sendSMS(recipientPhone, forwardMessage);
                    }
                }

                // Create notification record
                const notification = {
                    uuid: generateUuid(),
                    rideRequestUuid: activeRide.uuid,
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

                await api.addNotification(notification);
            } else {
                console.log('❌ No active ride found for sender:', senderPhone);
            }

            res.status(200).send('OK');
        } catch (error) {
            console.error('Vonage webhook error:', error);
            res.status(500).send('Error processing webhook');
        }
    });

    /**
     * POST /api/notifications/webhook
     * Legacy webhook endpoint (defaults to Twilio)
     */
    router.post('/webhook', async (req, res) => {
        try {
            const { From, To, Body, MessageSid, SmsStatus } = req.body;
            console.log('Incoming SMS webhook (legacy):', { From, To, Body, MessageSid });

            const notification = {
                uuid: generateUuid(),
                rideRequestUuid: null,
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

            await api.addNotification(notification);

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

    /**
     * POST /api/notifications/status/twilio
     * Twilio delivery status callback
     */
    router.post('/status/twilio', async (req, res) => {
        try {
            const { MessageSid, MessageStatus } = req.body;
            console.log('Twilio SMS status update:', { MessageSid, MessageStatus });

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

    /**
     * POST /api/notifications/status/vonage
     * Vonage delivery receipt endpoint
     */
    router.post('/status/vonage', async (req, res) => {
        try {
            const { messageId, status, 'err-code': errCode } = req.body;
            console.log('Vonage delivery receipt:', { messageId, status, errCode });

            const statusMap = {
                'delivered': 'delivered',
                'accepted': 'accepted',
                'buffered': 'queued',
                'failed': 'failed',
                'rejected': 'failed',
                'expired': 'failed'
            };

            const mappedStatus = statusMap[status] || status;

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

    /**
     * POST /api/notifications/status
     * Legacy status callback (defaults to Twilio)
     */
    router.post('/status', async (req, res) => {
        try {
            const { MessageSid, MessageStatus } = req.body;
            console.log('SMS status update (legacy):', { MessageSid, MessageStatus });

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

export default createNotificationRoutes;
