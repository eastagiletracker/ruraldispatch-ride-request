import React, { useState, useEffect } from 'react';
import { fetchNotificationsByRide, closeRideSession } from '../utils/database';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";
import type { Notification, NotificationType, TwilioStatus } from "@/types";

interface SMSConversationProps {
  rideUuid: string;
  riderPhone: string;
  driverPhone: string;
}

/**
 * SMSConversation Component
 * Displays SMS conversation history for a ride request
 */
const SMSConversation: React.FC<SMSConversationProps> = ({ rideUuid, riderPhone, driverPhone }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(true);

  useEffect(() => {
    if (rideUuid) {
      loadNotifications();
      // Poll for new messages every 20 seconds
      const interval = setInterval(loadNotifications, 20000);
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

  const formatTimestamp = (timestamp: string | Date): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type: NotificationType): string => {
    const icons: Record<NotificationType, string> = {
      'rider_accepted': '✅',
      'driver_assigned': '👤',
      'ride_started': '🚗',
      'rider_picked_up': '📍',
      'rider_dropped_off': '🏁',
      'ride_complete': '✔️',
      'ride_cancelled': '❌',
      'dispatcher_update': '📢',
      'incoming_sms': '💬',
      'custom': '📱'
    };
    return icons[type] || '📧';
  };

  const getStatusVariant = (status: TwilioStatus): "default" | "secondary" | "outline" | "destructive" => {
    const variants: Record<TwilioStatus, "default" | "secondary" | "outline" | "destructive"> = {
      'delivered': 'default',
      'sent': 'secondary',
      'received': 'secondary',
      'queued': 'outline',
      'sending': 'outline',
      'failed': 'destructive',
      'undelivered': 'destructive'
    };
    return variants[status] || 'outline';
  };

  if (loading) {
    return (
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>SMS Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            Loading messages...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="mt-5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle>SMS Conversation</CardTitle>
          <Badge variant={isSessionActive ? "default" : "secondary"}>
            {isSessionActive ? 'Session Active' : 'Session Closed'}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            No SMS messages sent for this ride yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle>SMS Conversation ({notifications.length})</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={isSessionActive ? "default" : "secondary"}>
            {isSessionActive ? 'Session Active' : 'Session Closed'}
          </Badge>
          {isSessionActive && (
            <Button
              onClick={handleCloseSession}
              variant="destructive"
              size="sm"
            >
              Close Session
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ScrollArea className="h-[500px] pr-4">
          <div className="flex flex-col gap-3">
            {notifications.map((notif, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-shadow ${
                  notif.direction === 'inbound'
                    ? 'bg-amber-50 border-l-4 border-l-amber-500'
                    : 'bg-gray-50 border-l-4 border-l-blue-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{getNotificationIcon(notif.notificationType)}</span>
                  <span className="text-sm font-semibold text-gray-700 capitalize flex-1">
                    {notif.notificationType.replace(/_/g, ' ')}
                  </span>
                  <Badge variant={getStatusVariant(notif.twilioStatus)} className="text-xs">
                    {notif.twilioStatus}
                  </Badge>
                </div>

                <div className="text-sm text-gray-900 leading-relaxed mb-2 whitespace-pre-wrap">
                  {notif.messageBody}
                </div>

                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span className="font-medium">
                    {notif.direction === 'outbound' ? 'To:' : 'From:'} {notif.recipientPhone}
                    {notif.recipientName && ` (${notif.recipientName})`}
                  </span>
                  <span className="italic">
                    {formatTimestamp(notif.sentAt)}
                  </span>
                </div>

                {notif.errorMessage && (
                  <div className="mt-2 p-2 bg-red-50 text-red-900 rounded text-xs flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Error: {notif.errorMessage}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex gap-5 p-3 bg-gray-50 rounded-md text-sm">
          <div className="text-gray-700">
            <strong>Rider:</strong> {riderPhone || 'N/A'}
          </div>
          {driverPhone && (
            <div className="text-gray-700">
              <strong>Driver:</strong> {driverPhone}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SMSConversation;
