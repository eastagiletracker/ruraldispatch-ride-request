import React, { useState, useEffect } from 'react';
import { fetchNotificationsByRide, closeRideSession } from '../utils/database.jsx';

/**
 * SMSConversation Component
 * Displays SMS conversation history for a ride request
 */
const SMSConversation = ({ rideUuid, riderPhone, driverPhone }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(true);

  useEffect(() => {
    if (rideUuid) {
      loadNotifications();
      // Poll for new messages every 5 seconds
      const interval = setInterval(loadNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [rideUuid]);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotificationsByRide(rideUuid);
      setNotifications(data);

      // Check if any notifications have active sessions
      const hasActiveSession = data.some(notif => notif.sessionActive);
      setIsSessionActive(hasActiveSession);

      setLoading(false);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (window.confirm('Are you sure you want to close the SMS session for this ride?')) {
      try {
        await closeRideSession(rideUuid);
        setIsSessionActive(false);
        loadNotifications();
        alert('SMS session closed successfully');
      } catch (error) {
        console.error('Error closing session:', error);
        alert('Failed to close SMS session');
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'rider_accepted': '✅',
      'driver_assigned': '👤',
      'ride_started': '🚗',
      'rider_picked_up': '📍',
      'rider_dropped_off': '🏁',
      'ride_complete': '✔️',
      'incoming_sms': '💬',
      'custom': '📱'
    };
    return icons[type] || '📧';
  };

  const getStatusColor = (status) => {
    const colors = {
      'delivered': '#10b981',
      'sent': '#3b82f6',
      'received': '#8b5cf6',
      'queued': '#f59e0b',
      'failed': '#ef4444',
      'undelivered': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>SMS Conversation</h3>
        </div>
        <div style={styles.loading}>Loading messages...</div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>SMS Conversation</h3>
          <span style={styles.sessionBadge(isSessionActive)}>
            {isSessionActive ? 'Session Active' : 'Session Closed'}
          </span>
        </div>
        <div style={styles.emptyState}>
          No SMS messages sent for this ride yet.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>SMS Conversation ({notifications.length})</h3>
        <div style={styles.headerActions}>
          <span style={styles.sessionBadge(isSessionActive)}>
            {isSessionActive ? 'Session Active' : 'Session Closed'}
          </span>
          {isSessionActive && (
            <button onClick={handleCloseSession} style={styles.closeButton}>
              Close Session
            </button>
          )}
        </div>
      </div>

      <div style={styles.messageList}>
        {notifications.map((notif, index) => (
          <div
            key={index}
            style={{
              ...styles.messageCard,
              ...(notif.direction === 'inbound' ? styles.inboundMessage : styles.outboundMessage)
            }}
          >
            <div style={styles.messageHeader}>
              <span style={styles.notifIcon}>{getNotificationIcon(notif.notificationType)}</span>
              <span style={styles.notifType}>
                {notif.notificationType.replace(/_/g, ' ')}
              </span>
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(notif.twilioStatus)
                }}
              >
                {notif.twilioStatus}
              </span>
            </div>

            <div style={styles.messageBody}>
              {notif.messageBody}
            </div>

            <div style={styles.messageFooter}>
              <span style={styles.recipient}>
                {notif.direction === 'outbound' ? 'To:' : 'From:'} {notif.recipientPhone}
                {notif.recipientName && ` (${notif.recipientName})`}
              </span>
              <span style={styles.timestamp}>
                {formatTimestamp(notif.sentAt)}
              </span>
            </div>

            {notif.errorMessage && (
              <div style={styles.errorMessage}>
                Error: {notif.errorMessage}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={styles.contactInfo}>
        <div style={styles.contactItem}>
          <strong>Rider:</strong> {riderPhone || 'N/A'}
        </div>
        {driverPhone && (
          <div style={styles.contactItem}>
            <strong>Driver:</strong> {driverPhone}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '20px',
    marginTop: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '10px'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  sessionBadge: (isActive) => ({
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: isActive ? '#dcfce7' : '#f3f4f6',
    color: isActive ? '#166534' : '#6b7280'
  }),
  closeButton: {
    padding: '6px 14px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
    fontSize: '14px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#9ca3af',
    fontSize: '14px'
  },
  messageList: {
    maxHeight: '500px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  messageCard: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    transition: 'box-shadow 0.2s'
  },
  outboundMessage: {
    backgroundColor: '#f9fafb',
    borderLeftWidth: '3px',
    borderLeftColor: '#3b82f6'
  },
  inboundMessage: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: '3px',
    borderLeftColor: '#f59e0b'
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  notifIcon: {
    fontSize: '16px'
  },
  notifType: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
    flex: 1
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'white'
  },
  messageBody: {
    fontSize: '14px',
    color: '#1f2937',
    lineHeight: '1.5',
    marginBottom: '8px',
    whiteSpace: 'pre-wrap'
  },
  messageFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: '#6b7280'
  },
  recipient: {
    fontWeight: '500'
  },
  timestamp: {
    fontStyle: 'italic'
  },
  errorMessage: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '4px',
    fontSize: '12px'
  },
  contactInfo: {
    marginTop: '20px',
    padding: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    display: 'flex',
    gap: '20px',
    fontSize: '13px'
  },
  contactItem: {
    color: '#374151'
  }
};

export default SMSConversation;
