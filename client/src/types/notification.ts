// Notification types
export type NotificationType =
  | 'rider_accepted'
  | 'driver_assigned'
  | 'ride_started'
  | 'rider_picked_up'
  | 'rider_dropped_off'
  | 'ride_complete'
  | 'ride_cancelled'
  | 'dispatcher_update'
  | 'incoming_sms'
  | 'custom';

export type MessageDirection = 'outbound' | 'inbound';

export type RecipientRole = 'rider' | 'driver' | 'dispatcher' | 'staff' | 'unknown';

export type TwilioStatus =
  | 'accepted'
  | 'scheduled'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'undelivered'
  | 'failed'
  | 'receiving'
  | 'received'
  | 'read'
  | 'canceled'
  | 'partially_delivered';

export interface Notification {
  uuid: string;
  rideRequestUuid: string;
  notificationType: NotificationType;
  direction: MessageDirection;
  recipientPhone: string;
  recipientName?: string;
  recipientRole: RecipientRole;
  messageBody: string;
  twilioMessageSid?: string;
  twilioStatus: TwilioStatus;
  isScheduled?: boolean;
  scheduledSendAt?: Date | string;
  scheduledMessageSid?: string;
  errorMessage?: string;
  sentAt: Date | string;
  deliveredAt?: Date | string;
  sessionActive: boolean;
  sessionClosedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface NotificationStats {
  totalNotifications: number;
  deliveredCount: number;
  failedCount: number;
  pendingCount: number;
}

export interface CloseSessionResponse {
  success: boolean;
  message: string;
  closedCount?: number;
}
