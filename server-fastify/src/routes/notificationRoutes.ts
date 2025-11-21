import type { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'node:crypto';
import notificationService from '../services/notificationService.js';
import scheduler from '../services/scheduler/RideScheduler.js';
import { RIDE_STATUSES, isClosingStatus } from '../constants/rideStatuses.js';
import { RIDE_REQUEST_STATUSES } from '../constants/rideRequestStatuses.js';
import type { ServiceProvider } from '../types/database.types.js';

/**
 * Notification Routes Plugin
 * Handles SMS notifications, webhooks, and delivery tracking
 *
 * Endpoints:
 * - GET /api/notifications/ride/:rideUuid
 * - GET /api/notifications/phone/:phone
 * - GET /api/notifications/active/:rideUuid
 * - GET /api/notifications/stats/:rideUuid
 * - POST /api/notifications/close-session/:rideUuid
 * - GET /api/notifications/provider-status
 * - GET /api/notifications/scheduler-status
 * - POST /api/notifications/webhook/twilio (CRITICAL)
 * - GET /api/notifications/webhook/vonage
 * - POST /api/notifications/webhook/vonage
 * - POST /api/notifications/webhook (legacy)
 * - POST /api/notifications/status/twilio
 * - POST /api/notifications/status/vonage
 * - POST /api/notifications/status (legacy)
 */

type SenderRole = 'rider' | 'driver' | 'case_manager' | 'unknown';
type RecipientRole = 'driver' | 'rider' | 'case_manager';

/**
 * Helper function to determine sender role based on phone number
 */
function determineSenderRole(ride: any, phoneNumber: string): SenderRole {
  // Check if sender is rider (registered user)
  if (ride.rider && ride.rider.phone === phoneNumber) {
    return 'rider';
  }

  // Check if sender is rider (non-registered service user)
  if (ride.riderPhone === phoneNumber || ride.serviceUserPhone === phoneNumber) {
    return 'rider';
  }

  // Check if sender is driver
  if (ride.driver) {
    const driverPhone = ride.driver.mobilePhone || ride.driver.phone;
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

const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  const api = fastify.database;

  /**
   * GET /api/notifications/ride/:rideUuid
   * Get all notifications for a specific ride
   */
  fastify.get<{ Params: { rideUuid: string } }>('/ride/:rideUuid', async (request, reply) => {
    try {
      const notifications = await api.getNotificationsByRide(request.params.rideUuid);
      return { success: true, notifications };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ success: false, error: errorMessage });
    }
  });

  /**
   * GET /api/notifications/phone/:phone
   * Get all notifications for a specific phone number
   */
  fastify.get<{ Params: { phone: string } }>('/phone/:phone', async (request, reply) => {
    try {
      const notifications = await api.getNotificationsByPhone(request.params.phone);
      return { success: true, notifications };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ success: false, error: errorMessage });
    }
  });

  /**
   * GET /api/notifications/active/:rideUuid
   * Get active session notifications for a ride
   */
  fastify.get<{ Params: { rideUuid: string } }>('/active/:rideUuid', async (request, reply) => {
    try {
      const notifications = await api.getActiveSessionNotifications(request.params.rideUuid);
      return { success: true, notifications };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ success: false, error: errorMessage });
    }
  });

  /**
   * GET /api/notifications/stats/:rideUuid
   * Get notification statistics for a ride
   */
  fastify.get<{ Params: { rideUuid: string } }>('/stats/:rideUuid', async (request, reply) => {
    try {
      const stats = await api.getRideNotificationStats(request.params.rideUuid);
      return { success: true, stats };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ success: false, error: errorMessage });
    }
  });

  /**
   * POST /api/notifications/close-session/:rideUuid
   * Close SMS session for a ride
   */
  fastify.post<{ Params: { rideUuid: string } }>(
    '/close-session/:rideUuid',
    async (request, reply) => {
      try {
        const result = await api.closeRideSession(request.params.rideUuid);
        const serviceResult = await notificationService.closeRideSession(request.params.rideUuid);
        return { success: true, result, serviceResult };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return reply.status(500).send({ success: false, error: errorMessage });
      }
    },
  );

  /**
   * GET /api/notifications/provider-status
   * Get SMS provider status (Twilio/Vonage)
   */
  fastify.get('/provider-status', async (_request, reply) => {
    try {
      const status = notificationService.getProviderStatus();
      return { success: true, status };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      fastify.log.error(error, 'Error getting provider status');
      return reply.status(500).send({ success: false, error: errorMessage });
    }
  });

  /**
   * GET /api/notifications/scheduler-status
   * Get scheduler status for debugging
   */
  fastify.get('/scheduler-status', async (_request, reply) => {
    try {
      const status = scheduler.getStatus();
      return {
        success: true,
        scheduler: status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      fastify.log.error(error, 'Error getting scheduler status');
      return reply.status(500).send({ success: false, error: errorMessage });
    }
  });

  /**
   * POST /api/notifications/webhook/twilio
   * Twilio webhook for incoming SMS responses
   * Handles interactive responses (1=Yes, 2=No, 3=Cancel) and message forwarding
   */
  fastify.post<{
    Body: {
      From: string;
      To: string;
      Body: string;
      MessageSid: string;
      SmsStatus?: string;
    };
  }>('/webhook/twilio', async (request, reply) => {
    try {
      fastify.log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      fastify.log.info('📨 INCOMING TWILIO SMS WEBHOOK RECEIVED');
      fastify.log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const { From, To, Body, MessageSid } = request.body;
      fastify.log.info({ From, To, Body, MessageSid }, '📨 Parsed webhook data');

      const senderPhone = From;
      fastify.log.info({ senderPhone }, '🔍 Looking for active ride from sender');

      // Find active rides involving this phone number
      const allRides = await api.getRideRequests();
      fastify.log.info(`📋 Total rides in database: ${allRides.length}`);

      // Filter all active rides involving this sender
      const activeRides = allRides.filter((ride: any) => {
        const isActive =
          ride.rideStatus !== RIDE_STATUSES.RIDE_COMPLETE &&
          ride.rideStatus !== RIDE_STATUSES.ROUNDTRIP_COMPLETE;
        if (!isActive) return false;

        // Check if sender is rider (registered or non-registered)
        const isRider =
          (ride.rider && ride.rider.phone === senderPhone) ||
          ride.riderPhone === senderPhone ||
          ride.serviceUserPhone === senderPhone;

        // Check if sender is driver
        const isDriver =
          ride.driver &&
          (ride.driver.mobilePhone === senderPhone || ride.driver.phone === senderPhone);

        return isRider || isDriver;
      });

      // Get the most recent active ride
      let activeRide: any = activeRides.sort((a: any, b: any) => b.uuid.localeCompare(a.uuid))[0];

      if (activeRides.length > 1) {
        fastify.log.warn(
          `⚠️  Found ${activeRides.length} active rides, using most recent: #${activeRide?.uuid}`,
        );
      }

      if (activeRide) {
        fastify.log.info(`✅ Found active ride: #${activeRide.uuid}`);
        fastify.log.info(
          `   Rider: ${activeRide.rider?.[0]?.fullName} (${activeRide.rider?.[0]?.phone})`,
        );
        fastify.log.info(
          `   Driver: ${activeRide.driver?.[0]?.fullName} (${activeRide.driver?.[0]?.mobilePhone || activeRide.driver?.[0]?.phone})`,
        );
        fastify.log.info(`   Current Status: ${activeRide.rideStatus}`);
      } else {
        fastify.log.warn('❌ No active ride found for this sender');
      }

      // Determine sender role
      const senderRole = activeRide ? determineSenderRole(activeRide, senderPhone) : 'unknown';
      fastify.log.info(`👤 Sender role: ${senderRole}`);

      // Process interactive SMS response
      if (activeRide && senderRole !== 'unknown') {
        const action = await notificationService.processIncomingSMS(
          senderPhone,
          Body,
          activeRide,
          senderRole,
        );

        fastify.log.info(action, '🔄 Processing result');

        if (action.success) {
          // Execute status updates
          const updates: Record<string, unknown> = {};
          const previousRideStatus = activeRide.rideStatus;

          if (action.newRideStatus !== undefined) {
            updates.rideStatus = action.newRideStatus;
            fastify.log.info(`📝 Updating ride status to: ${action.newRideStatus}`);
          }

          if (action.newRequestStatus !== undefined) {
            updates.requestStatus = action.newRequestStatus;
            fastify.log.info(`📝 Updating request status to: ${action.newRequestStatus}`);
          }

          if (
            updates.rideStatus !== undefined &&
            updates.requestStatus === undefined &&
            isClosingStatus(updates.rideStatus as number)
          ) {
            updates.requestStatus = RIDE_REQUEST_STATUSES.ALL_RIDE_REQUEST_CLOSED.code;
            fastify.log.info(
              '📝 Auto-closing ride request because ride entered a closing status',
            );
          }

          if (Object.keys(updates).length > 0) {
            await api.updateRideRequest(activeRide.uuid, updates);
            fastify.log.info(`✅ Ride #${activeRide.uuid} updated`);

            if (
              updates.rideStatus !== undefined &&
              isClosingStatus(updates.rideStatus as number)
            ) {
              scheduler.cancelRideTasks(activeRide.uuid);
            }

            activeRide = (await api.getRideRequest(activeRide.uuid)) as any;

            if (
              activeRide.rideStatus === RIDE_STATUSES.RIDE_COMPLETE ||
              activeRide.rideStatus === RIDE_STATUSES.ROUNDTRIP_COMPLETE
            ) {
              await api.closeRideSession(activeRide.uuid);
              fastify.log.info(`✅ Auto-closed SMS session for ride #${activeRide.uuid}`);
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
            pickupLocation: activeRide.pickupLocation,
          };

          // Send bulk notifications
          if (action.notifications && action.notifications.length > 0) {
            fastify.log.info(`📨 Sending ${action.notifications.length} notifications`);
            const notifResults = await notificationService.sendBulkNotifications(
              activeRide,
              action.notifications,
              data,
            );
            fastify.log.info({ results: notifResults }, '✅ Notifications sent');
          }

          // Schedule future notifications
          if (action.scheduleNotification) {
            const { recipient, template, delayMinutes } = action.scheduleNotification;
            fastify.log.info(
              `⏰ Scheduling ${template} notification to ${recipient} in ${delayMinutes} minutes`,
            );

            scheduler.scheduleNotification(activeRide, recipient as RecipientRole, template, delayMinutes, data);
          }

          // Schedule status change
          if (action.scheduleStatusChange) {
            const { status, delayMinutes } = action.scheduleStatusChange;
            fastify.log.info(`⏰ Scheduling status change to ${status} in ${delayMinutes} minutes`);

            scheduler.scheduleStatusChange(
              activeRide,
              status,
              delayMinutes,
              async (uuid, newUpdates) => await api.updateRideRequest(uuid, newUpdates),
            );
          }

          // Mirror scheduler behavior triggered via dashboard updates
          if (previousRideStatus !== activeRide.rideStatus) {
            if (
              activeRide.rideStatus === RIDE_STATUSES.RIDE_CONFIRMED &&
              previousRideStatus !== RIDE_STATUSES.RIDE_CONFIRMED
            ) {
              if (riderData && driverData) {
                scheduler.scheduleRideConfirmationTasks(activeRide, driverData as ServiceProvider);
              }
            }

            if (
              activeRide.rideStatus === RIDE_STATUSES.RIDER_PICKED_UP &&
              previousRideStatus !== RIDE_STATUSES.RIDER_PICKED_UP
            ) {
              if (driverData) {
                scheduler.schedulePickupTasks(
                  activeRide,
                  driverData as ServiceProvider,
                  async (uuid, rideUpdates) => await api.updateRideRequest(uuid, rideUpdates),
                );
              }
            }

            if (
              activeRide.rideStatus === RIDE_STATUSES.RIDER_DROPPED_OFF &&
              previousRideStatus !== RIDE_STATUSES.RIDER_DROPPED_OFF
            ) {
              if (activeRide.roundTrip && driverData) {
                scheduler.scheduleDropoffTasks(activeRide, driverData as ServiceProvider);
              }
            }
          }
        } else {
          // Not an interactive response - forward as conversation
          fastify.log.info('💬 Not an interactive response, forwarding as conversation');

          if (senderRole === 'rider' && activeRide.driver) {
            const recipientPhone = activeRide.driver.mobilePhone || activeRide.driver.phone;
            const senderName = activeRide.rider?.fullName || 'Rider';
            const forwardMessage = `Message from ${senderName} (Rider):\n${Body}`;

            fastify.log.info(`📤 Forwarding rider message to driver: ${recipientPhone}`);
            await notificationService.sendSMS(recipientPhone, forwardMessage);
          } else if (senderRole === 'driver' && activeRide.rider) {
            const recipientPhone = activeRide.rider.phone;
            const senderName = activeRide.driver?.fullName || 'Driver';
            const forwardMessage = `Message from ${senderName} (Driver):\n${Body}`;

            fastify.log.info(`📤 Forwarding driver message to rider: ${recipientPhone}`);
            await notificationService.sendSMS(recipientPhone, forwardMessage);
          }
        }
      } else {
        fastify.log.warn('⚠️  No active ride or unknown sender - ignoring message');
      }

      // Create notification record for incoming message
      const notificationUuid = randomUUID();
      const notification = {
        uuid: notificationUuid,
        rideUuid: activeRide ? activeRide.uuid : null,
        notificationType: senderRole !== 'unknown' ? 'sms_response' : 'incoming_sms',
        direction: 'inbound' as const,
        recipientPhone: To,
        recipientName: null,
        recipientRole: senderRole,
        messageBody: Body,
        twilioMessageSid: MessageSid,
        twilioStatus: 'received',
        sentAt: new Date(),
        deliveredAt: null,
        errorMessage: null,
      };

      await api.addNotification(notification);

      // Respond to Twilio with empty response
      reply.type('text/xml');
      return `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
    } catch (error) {
      fastify.log.error(error, 'Twilio webhook error');
      return reply.status(500).send('Error processing webhook');
    }
  });

  /**
   * GET /api/notifications/webhook/vonage
   * Test endpoint to verify Vonage webhook is accessible
   */
  fastify.get('/webhook/vonage', async () => {
    fastify.log.info('✅ Vonage webhook test endpoint hit (GET request)');
    return {
      status: 'ok',
      message: 'Vonage webhook endpoint is accessible',
      timestamp: new Date().toISOString(),
    };
  });

  /**
   * POST /api/notifications/webhook/vonage
   * Vonage webhook for incoming SMS
   * Forwards messages between riders and drivers
   */
  fastify.post<{
    Body: {
      msisdn: string;
      to: string;
      messageId: string;
      text: string;
      type?: string;
      keyword?: string;
      'message-timestamp'?: string;
    };
  }>('/webhook/vonage', async (request, reply) => {
    try {
      fastify.log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      fastify.log.info('📨 INCOMING SMS WEBHOOK RECEIVED');
      fastify.log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const { msisdn, to, messageId, text, 'message-timestamp': timestamp } = request.body;
      fastify.log.info({ from: msisdn, to, messageId, text }, '📨 Parsed webhook data');

      const senderPhone = msisdn.startsWith('+') ? msisdn : `+${msisdn}`;
      fastify.log.info({ senderPhone }, '🔍 Looking for active ride from sender');

      const allRides = await api.getRideRequests();
      const activeRides = allRides.filter((ride: any) => {
        const isActive =
          ride.rideStatus !== RIDE_STATUSES.RIDE_COMPLETE &&
          ride.rideStatus !== RIDE_STATUSES.ROUNDTRIP_COMPLETE;
        if (!isActive) return false;

        const isRider = ride.rider && ride.rider.phone === senderPhone;
        const isDriver =
          ride.driver &&
          (ride.driver.mobilePhone === senderPhone || ride.driver.phone === senderPhone);

        return isRider || isDriver;
      });

      const activeRide = activeRides.sort((a, b) => b.uuid.localeCompare(a.uuid))[0];

      if (activeRide) {
        fastify.log.info(`✅ Found active ride: #${activeRide.uuid}`);

        const isRider = activeRide.rider && activeRide.rider.phone === senderPhone;
        const isDriver =
          activeRide.driver &&
          (activeRide.driver.mobilePhone === senderPhone ||
            activeRide.driver.phone === senderPhone);

        let senderRole: SenderRole = 'unknown';

        if (isRider) {
          senderRole = 'rider';
          if (activeRide.driver) {
            const recipientPhone = activeRide.driver.mobilePhone || activeRide.driver.phone;
            const senderName = activeRide.rider?.fullName || 'Rider';
            if (recipientPhone) {
              const forwardMessage = `Message from ${senderName} (Rider):\n${text}`;

              fastify.log.info(`📤 Forwarding rider message to driver: ${recipientPhone}`);
              await notificationService.sendSMS(recipientPhone, forwardMessage);
            }
          }
        } else if (isDriver) {
          senderRole = 'driver';
          if (activeRide.rider && activeRide.rider.phone) {
            const recipientPhone = activeRide.rider.phone;
            const senderName = activeRide.driver?.fullName || 'Driver';
            const forwardMessage = `Message from ${senderName} (Driver):\n${text}`;

            fastify.log.info(`📤 Forwarding driver message to rider: ${recipientPhone}`);
            await notificationService.sendSMS(recipientPhone, forwardMessage);
          }
        }

        // Create notification record
        const notification = {
          uuid: randomUUID(),
          rideUuid: activeRide.uuid,
          notificationType: 'incoming_sms',
          direction: 'inbound' as const,
          recipientPhone: to,
          recipientName: null,
          recipientRole: senderRole,
          messageBody: text,
          twilioMessageSid: messageId,
          twilioStatus: 'received',
          sentAt: timestamp ? new Date(timestamp) : new Date(),
          deliveredAt: null,
          errorMessage: null,
        };

        await api.addNotification(notification);
      } else {
        fastify.log.warn({ senderPhone }, '❌ No active ride found for sender');
      }

      return reply.status(200).send('OK');
    } catch (error) {
      fastify.log.error(error, 'Vonage webhook error');
      return reply.status(500).send('Error processing webhook');
    }
  });

  /**
   * POST /api/notifications/webhook
   * Legacy webhook endpoint (defaults to Twilio)
   */
  fastify.post<{
    Body: {
      From: string;
      To: string;
      Body: string;
      MessageSid: string;
      SmsStatus?: string;
    };
  }>('/webhook', async (request, reply) => {
    try {
      const { From, To, Body, MessageSid } = request.body;
      fastify.log.info({ From, To, Body, MessageSid }, 'Incoming SMS webhook (legacy)');

      const notification = {
        uuid: randomUUID(),
        rideUuid: null,
        notificationType: 'incoming_sms',
        direction: 'inbound' as const,
        recipientPhone: To,
        recipientName: null,
        recipientRole: 'dispatcher',
        messageBody: Body,
        twilioMessageSid: MessageSid,
        twilioStatus: 'received',
        sentAt: new Date(),
        deliveredAt: null,
        errorMessage: null,
      };

      await api.addNotification(notification);

      reply.type('text/xml');
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>Thank you for your message. A dispatcher will review it shortly.</Message>
</Response>`;
    } catch (error) {
      fastify.log.error(error, 'Webhook error');
      return reply.status(500).send('Error processing webhook');
    }
  });

  /**
   * POST /api/notifications/status/twilio
   * Twilio delivery status callback
   */
  fastify.post<{
    Body: {
      MessageSid: string;
      MessageStatus: string;
    };
  }>('/status/twilio', async (request, reply) => {
    try {
      const { MessageSid, MessageStatus } = request.body;
      fastify.log.info({ MessageSid, MessageStatus }, 'Twilio SMS status update');

      await api.updateNotificationStatus(MessageSid, {
        status: MessageStatus,
        deliveredAt: MessageStatus === 'delivered' ? new Date() : undefined,
      });

      return reply.status(200).send();
    } catch (error) {
      fastify.log.error(error, 'Twilio status callback error');
      return reply.status(500).send('Error processing status');
    }
  });

  /**
   * POST /api/notifications/status/vonage
   * Vonage delivery receipt endpoint
   */
  fastify.post<{
    Body: {
      messageId: string;
      status: string;
      'err-code'?: string;
    };
  }>('/status/vonage', async (request, reply) => {
    try {
      const { messageId, status, 'err-code': errCode } = request.body;
      fastify.log.info({ messageId, status, errCode }, 'Vonage delivery receipt');

      const statusMap: Record<string, string> = {
        delivered: 'delivered',
        accepted: 'accepted',
        buffered: 'queued',
        failed: 'failed',
        rejected: 'failed',
        expired: 'failed',
      };

      const mappedStatus = statusMap[status] || status;

      await api.updateNotificationStatus(messageId, {
        status: mappedStatus,
        deliveredAt: status === 'delivered' ? new Date() : undefined,
      });

      return reply.status(200).send();
    } catch (error) {
      fastify.log.error(error, 'Vonage delivery receipt error');
      return reply.status(500).send('Error processing delivery receipt');
    }
  });

  /**
   * POST /api/notifications/status
   * Legacy status callback (defaults to Twilio)
   */
  fastify.post<{
    Body: {
      MessageSid: string;
      MessageStatus: string;
    };
  }>('/status', async (request, reply) => {
    try {
      const { MessageSid, MessageStatus } = request.body;
      fastify.log.info({ MessageSid, MessageStatus }, 'SMS status update (legacy)');

      await api.updateNotificationStatus(MessageSid, {
        status: MessageStatus,
        deliveredAt: MessageStatus === 'delivered' ? new Date() : undefined,
      });

      return reply.status(200).send();
    } catch (error) {
      fastify.log.error(error, 'Status callback error');
      return reply.status(500).send('Error processing status');
    }
  });
};

export default notificationRoutes;
