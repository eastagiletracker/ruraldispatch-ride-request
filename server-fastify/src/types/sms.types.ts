/**
 * SMS/Notification Types
 * Types for Twilio, Vonage, and notification system
 */

// SMS Provider types
export type SMSProvider = 'twilio' | 'vonage';

export interface SMSResult {
  success: boolean;
  provider: SMSProvider;
  messageSid?: string;
  messageId?: string;
  to: string;
  body: string;
  status?: string;
  error?: string;
  timestamp: Date;
}

export interface SMSMetadata {
  rideUuid?: string;
  messageType?: string;
  recipientRole?: 'rider' | 'driver' | 'case_manager' | 'dispatcher';
  sessionActive?: boolean;
}

// Twilio types
export interface TwilioWebhookPayload {
  From: string;
  To: string;
  Body: string;
  MessageSid: string;
  AccountSid?: string;
  MessagingServiceSid?: string;
  NumMedia?: string;
  FromCity?: string;
  FromState?: string;
  FromZip?: string;
  FromCountry?: string;
  SmsStatus?: string;
  ApiVersion?: string;
}

export interface TwilioStatusCallback {
  MessageSid: string;
  MessageStatus: 'queued' | 'sending' | 'sent' | 'delivered' | 'undelivered' | 'failed';
  ErrorCode?: string;
  ErrorMessage?: string;
  To?: string;
  From?: string;
  AccountSid?: string;
}

export interface TwilioMessageOptions {
  to: string;
  body: string;
  from?: string;
  messagingServiceSid?: string;
  statusCallback?: string;
}

// Vonage types
export interface VonageWebhookPayload {
  msisdn: string; // From number
  to: string; // To number
  messageId: string;
  text: string;
  type: 'text' | 'unicode';
  keyword?: string;
  'message-timestamp': string;
  timestamp?: string;
  'api-key'?: string;
}

export interface VonageDeliveryReceipt {
  messageId: string;
  to: string;
  msisdn?: string;
  'network-code'?: string;
  status: 'delivered' | 'expired' | 'failed' | 'rejected' | 'accepted' | 'buffered' | 'unknown';
  'err-code'?: string;
  price?: string;
  scts?: string;
  'message-timestamp'?: string;
}

export interface VonageMessageOptions {
  to: string;
  from: string;
  text: string;
  type?: 'text' | 'unicode';
  callback?: string;
}

// SMS Response Handler types
export type SMSResponseAction =
  | 'UPDATE_RIDE_STATUS'
  | 'SEND_NOTIFICATION'
  | 'SCHEDULE_NOTIFICATION'
  | 'SCHEDULE_STATUS_CHANGE'
  | 'UNKNOWN'
  | 'INVALID';

export interface SMSResponseContext {
  rideUuid: string;
  currentRideStatus: number;
  currentRequestStatus: number;
  senderRole: 'rider' | 'driver' | 'unknown';
}

export interface SMSResponseResult {
  success: boolean;
  action: SMSResponseAction;
  message: string;
  rideUuid?: string;
  updates?: {
    rideStatus?: number;
    rideRequestStatus?: number;
  };
  notifications?: Array<{
    recipient: string;
    template: string;
    data?: Record<string, unknown>;
  }>;
  scheduleNotification?: {
    recipient: string;
    template: string;
    delayMinutes: number;
    data?: Record<string, unknown>;
  };
  scheduleStatusChange?: {
    status: number;
    delayMinutes: number;
  };
}

export interface ParsedSMSResponse {
  originalText: string;
  normalizedText: string;
  responseType: 'yes' | 'no' | 'cancel' | 'unknown';
  numericCode?: 1 | 2 | 3;
}

// SMS Template types
export type SMSTemplateType =
  | 'ride_confirmed'
  | 'ride_assigned'
  | 'driver_on_way'
  | 'driver_arrived'
  | 'pickup_reminder'
  | 'ride_started'
  | 'ride_complete'
  | 'ride_canceled'
  | 'confirmation_request'
  | 'driver_assignment_notification'
  | 'roundtrip_return_reminder';

export interface SMSTemplateData {
  riderName?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleInfo?: string;
  pickupAddress?: string;
  dropOffAddress?: string;
  pickupTime?: string;
  appointmentTime?: string;
  estimatedArrival?: string;
  displayId?: string;
  [key: string]: unknown;
}

// Notification Service types
export interface NotificationServiceConfig {
  primaryProvider: SMSProvider;
  fallbackProvider?: SMSProvider;
  enableFallback: boolean;
  retryAttempts: number;
  retryDelay: number;
}

export interface BulkNotificationRequest {
  recipients: Array<{
    phone: string;
    name?: string;
    role?: 'rider' | 'driver' | 'case_manager' | 'dispatcher';
  }>;
  template: SMSTemplateType;
  data: SMSTemplateData;
  rideUuid?: string;
}

export interface BulkNotificationResult {
  total: number;
  successful: number;
  failed: number;
  results: SMSResult[];
}

// Provider status types
export interface ProviderStatus {
  provider: SMSProvider;
  available: boolean;
  configured: boolean;
  lastUsed?: Date;
  lastError?: string;
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  successRate: number;
}

export interface NotificationSystemStatus {
  twilio: ProviderStatus;
  vonage: ProviderStatus;
  currentProvider: SMSProvider;
  failoverEnabled: boolean;
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  totalMessagesFailed: number;
  overallSuccessRate: number;
}
