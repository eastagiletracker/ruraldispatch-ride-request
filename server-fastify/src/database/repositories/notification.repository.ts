/**
 * Notification Repository
 * Handles all notification/SMS database operations
 */

import type { PrismaClient } from '../../../../prisma/generated/client/client.js';
import type { Notification } from '../../../../prisma/generated/client/client.js';

// ==================== TYPE DEFINITIONS ====================

/**
 * Notification statistics
 */
interface NotificationStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
}

/**
 * Notification input for creating new notifications
 */
interface NotificationInput {
  uuid: string;
  rideRequestUuid?: string | null;
  rideUuid?: string | null;
  notificationType: string;
  direction: string;
  recipientPhone: string;
  recipientName?: string | null;
  recipientRole: string;
  messageBody: string;
  twilioMessageSid?: string | null;
  twilioStatus?: string;
  errorMessage?: string | null;
  sentAt?: Date | string;
  deliveredAt?: Date | string | null;
  sessionActive?: boolean;
  sessionClosedAt?: Date | string | null;
}

/**
 * Notification status update data
 */
interface NotificationStatusUpdate {
  status: string;
  errorMessage?: string | null;
  deliveredAt?: Date | string | null;
}

// ==================== REPOSITORY ====================

export function createNotificationRepository(prisma: PrismaClient) {
  return {
    /**
     * Get all notifications for a specific ride
     */
    getNotificationsByRide: async (rideRequestUuid: string): Promise<Notification[]> => {
      return await prisma.notification.findMany({
        where: { rideUuid: rideRequestUuid },
        orderBy: {
          sentAt: 'asc',
        },
      });
    },

    /**
     * Get all notifications for a specific phone number
     */
    getNotificationsByPhone: async (phone: string): Promise<Notification[]> => {
      return await prisma.notification.findMany({
        where: { recipientPhone: phone },
        orderBy: {
          sentAt: 'desc',
        },
      });
    },

    /**
     * Get active session notifications for a ride
     */
    getActiveSessionNotifications: async (rideRequestUuid: string): Promise<Notification[]> => {
      return await prisma.notification.findMany({
        where: {
          rideUuid: rideRequestUuid,
          sessionActive: true,
        },
        orderBy: {
          sentAt: 'desc',
        },
      });
    },

    /**
     * Add a new notification
     */
    addNotification: async (notification: NotificationInput): Promise<Notification> => {
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
          sessionActive:
            notification.sessionActive !== undefined ? notification.sessionActive : true,
          sessionClosedAt: notification.sessionClosedAt
            ? new Date(notification.sessionClosedAt)
            : null,
        },
      });
    },

    /**
     * Update notification delivery status
     */
    updateNotificationStatus: async (
      twilioMessageSid: string,
      statusData: NotificationStatusUpdate
    ): Promise<Notification> => {
      return await prisma.notification.update({
        where: { twilioMessageSid },
        data: {
          twilioStatus: statusData.status,
          errorMessage: statusData.errorMessage || null,
          deliveredAt: statusData.deliveredAt ? new Date(statusData.deliveredAt) : null,
        },
      });
    },

    /**
     * Close all active sessions for a ride
     */
    closeRideSession: async (rideRequestUuid: string): Promise<{ count: number }> => {
      return await prisma.notification.updateMany({
        where: {
          rideUuid: rideRequestUuid,
          sessionActive: true,
        },
        data: {
          sessionActive: false,
          sessionClosedAt: new Date(),
        },
      });
    },

    /**
     * Get notification by Twilio message SID
     */
    getNotificationByMessageSid: async (twilioMessageSid: string): Promise<Notification | null> => {
      return await prisma.notification.findUnique({
        where: { twilioMessageSid },
      });
    },

    /**
     * Get all notifications with optional limit
     */
    getAllNotifications: async (limit = 100): Promise<Notification[]> => {
      return await prisma.notification.findMany({
        orderBy: {
          sentAt: 'desc',
        },
        take: limit,
      });
    },

    /**
     * Get notification statistics for a ride
     */
    getRideNotificationStats: async (rideRequestUuid: string): Promise<NotificationStats> => {
      const notifications = await prisma.notification.findMany({
        where: { rideUuid: rideRequestUuid },
      });

      return {
        total: notifications.length,
        sent: notifications.filter((n: Notification) => n.twilioStatus === 'sent').length,
        delivered: notifications.filter((n: Notification) => n.twilioStatus === 'delivered').length,
        failed: notifications.filter((n: Notification) => n.twilioStatus === 'failed').length,
      };
    },
  };
}

export type NotificationRepository = ReturnType<typeof createNotificationRepository>;
