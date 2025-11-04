const mongoose = require('mongoose');

/**
 * Notification Schema
 * Tracks all SMS notifications sent during ride lifecycle
 */
const notificationSchema = new mongoose.Schema({
  // Unique identifier
  uuid: {
    type: Number,
    required: true,
    unique: true
  },

  // Associated ride request
  rideRequestUuid: {
    type: Number,
    required: true,
    index: true
  },

  // Notification type
  notificationType: {
    type: String,
    required: true,
    enum: [
      'rider_accepted',
      'driver_assigned',
      'ride_started',
      'rider_picked_up',
      'rider_dropped_off',
      'ride_complete',
      'ride_cancelled',
      'dispatcher_update',
      'incoming_sms',
      'custom'
    ]
  },

  // Direction of message
  direction: {
    type: String,
    required: true,
    enum: ['outbound', 'inbound'],
    default: 'outbound'
  },

  // Recipient information
  recipientPhone: {
    type: String,
    required: true,
    index: true
  },

  recipientName: {
    type: String
  },

  recipientRole: {
    type: String,
    enum: ['rider', 'driver', 'dispatcher', 'staff', 'unknown'],
    default: 'unknown'
  },

  // Message content
  messageBody: {
    type: String,
    required: true
  },

  // Twilio metadata
  twilioMessageSid: {
    type: String,
    index: true
  },

  twilioStatus: {
    type: String,
    enum: ['queued', 'sending', 'sent', 'delivered', 'undelivered', 'failed', 'received'],
    default: 'queued'
  },

  // Error tracking
  errorMessage: {
    type: String
  },

  // Timestamps
  sentAt: {
    type: Date,
    default: Date.now
  },

  deliveredAt: {
    type: Date
  },

  // Session tracking
  sessionActive: {
    type: Boolean,
    default: true
  },

  sessionClosedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ rideRequestUuid: 1, createdAt: -1 });
notificationSchema.index({ recipientPhone: 1, createdAt: -1 });
notificationSchema.index({ twilioMessageSid: 1 });
notificationSchema.index({ sessionActive: 1 });

// Virtual for checking if notification was successful
notificationSchema.virtual('isSuccessful').get(function() {
  return ['sent', 'delivered', 'received'].includes(this.twilioStatus);
});

// Instance method to close session
notificationSchema.methods.closeSession = function() {
  this.sessionActive = false;
  this.sessionClosedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
