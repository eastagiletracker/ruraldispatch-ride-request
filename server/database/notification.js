/**
 * Notification Database Layer
 * Handles CRUD operations for notification tracking
 */

/**
 * Get all notifications for a specific ride request
 */
async function getNotificationsByRide(collection, rideRequestUuid) {
  const filter = { rideRequestUuid: parseInt(rideRequestUuid) };
  return await collection.find(filter).sort({ sentAt: 1 }).toArray();
}

/**
 * Get all notifications for a specific phone number
 */
async function getNotificationsByPhone(collection, phone) {
  const filter = { recipientPhone: phone };
  return await collection.find(filter).sort({ sentAt: 1 }).toArray();
}

/**
 * Get active session notifications
 */
async function getActiveSessionNotifications(collection, rideRequestUuid) {
  const filter = {
    rideRequestUuid: parseInt(rideRequestUuid),
    sessionActive: true
  };
  return await collection.find(filter).sort({ sentAt: 1 }).toArray();
}

/**
 * Add a new notification
 */
async function addNotification(collection, notificationData) {
  return await collection.insertOne(notificationData);
}

/**
 * Update notification status (e.g., when delivery status changes)
 */
async function updateNotificationStatus(collection, twilioMessageSid, statusData) {
  const filter = { twilioMessageSid };
  const update = { $set: statusData };
  return await collection.updateOne(filter, update);
}

/**
 * Close all notifications for a ride session
 */
async function closeRideSession(collection, rideRequestUuid) {
  const filter = {
    rideRequestUuid: parseInt(rideRequestUuid),
    sessionActive: true
  };
  const update = {
    $set: {
      sessionActive: false,
      sessionClosedAt: new Date()
    }
  };
  return await collection.updateMany(filter, update);
}

/**
 * Get notification by Twilio Message SID
 */
async function getNotificationByMessageSid(collection, twilioMessageSid) {
  return await collection.findOne({ twilioMessageSid });
}

/**
 * Get all notifications (with optional limit)
 */
async function getAllNotifications(collection, limit = 100) {
  return await collection.find({})
    .sort({ sentAt: -1 })
    .limit(limit)
    .toArray();
}

/**
 * Get notification statistics for a ride
 */
async function getRideNotificationStats(collection, rideRequestUuid) {
  const pipeline = [
    { $match: { rideRequestUuid: parseInt(rideRequestUuid) } },
    {
      $group: {
        _id: '$notificationType',
        count: { $sum: 1 },
        successful: {
          $sum: {
            $cond: [
              { $in: ['$twilioStatus', ['sent', 'delivered', 'received']] },
              1,
              0
            ]
          }
        },
        failed: {
          $sum: {
            $cond: [
              { $in: ['$twilioStatus', ['failed', 'undelivered']] },
              1,
              0
            ]
          }
        }
      }
    }
  ];

  return await collection.aggregate(pipeline).toArray();
}

module.exports = {
  getNotificationsByRide,
  getNotificationsByPhone,
  getActiveSessionNotifications,
  addNotification,
  updateNotificationStatus,
  closeRideSession,
  getNotificationByMessageSid,
  getAllNotifications,
  getRideNotificationStats
};
