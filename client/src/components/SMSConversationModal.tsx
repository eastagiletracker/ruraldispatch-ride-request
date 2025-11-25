import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Phone,
  User,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Notification, TwilioStatus } from '@/types';
import { formatLocalDate, formatLocalTime } from '@/utils/dateUtils';
import { closeRideSession, fetchNotificationsByRide } from '../utils/database';

interface SMSConversationModalProps {
  rideUuid: string;
  riderPhone: string;
  driverPhone: string;
  riderName?: string;
}

/**
 * SMSConversationModal Component
 * Chat-style SMS conversation display optimized for modal view
 */
const SMSConversationModal: React.FC<SMSConversationModalProps> = ({
  rideUuid,
  riderPhone,
  driverPhone,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(true);
  const [showCloseConfirm, setShowCloseConfirm] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchNotificationsByRide(rideUuid);
      setNotifications(data);

      // Check if any notifications have active sessions
      const hasActiveSession = data.some((notif) => notif.sessionActive);
      setIsSessionActive(hasActiveSession);

      setLoading(false);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load messages');
      setLoading(false);
    }
  }, [rideUuid]);

  useEffect(() => {
    if (rideUuid) {
      loadNotifications();
      // Poll for new messages every 20 seconds
      const interval = setInterval(loadNotifications, 20000);
      return () => clearInterval(interval);
    }
  }, [rideUuid, loadNotifications]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const handleCloseSession = async () => {
    try {
      await closeRideSession(rideUuid);
      setIsSessionActive(false);
      setShowCloseConfirm(false);
      loadNotifications();
      toast.success('SMS session closed successfully');
    } catch (error) {
      console.error('Error closing session:', error);
      toast.error('Failed to close SMS session');
    }
  };

  // Using imported formatLocalTime and formatLocalDate from @/utils/dateUtils
  const formatTime = (timestamp: string | Date): string => {
    return formatLocalTime(String(timestamp));
  };

  const formatDate = (timestamp: string | Date): string => {
    return formatLocalDate(String(timestamp));
  };

  const getStatusIcon = (status: TwilioStatus, isScheduledMessage: boolean = false) => {
    // For scheduled messages with 'accepted' status, show scheduled icon
    if (isScheduledMessage && status === 'accepted') {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Clock className="h-3 w-3 cursor-help text-amber-600" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Scheduled - Message scheduled to be sent at specified time</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    switch (status) {
      case 'scheduled':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Clock className="h-3 w-3 cursor-help text-amber-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Scheduled - Message scheduled to be sent at specified time</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'queued':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Clock className="h-3 w-3 cursor-help text-blue-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Queued - Message queued to be sent out</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'sending':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Clock className="h-3 w-3 cursor-help text-blue-500 animate-pulse" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Sending - Dispatching message to carrier</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'sent':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <CheckCircle2 className="h-3 w-3 cursor-help text-blue-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Sent - Carrier accepted message, awaiting delivery confirmation</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'delivered':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <CheckCircle2 className="h-3 w-3 cursor-help text-green-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Delivered - Message delivered to recipient's device</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'receiving':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Clock className="h-3 w-3 cursor-help text-blue-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Receiving - Incoming message being processed</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'received':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <CheckCircle2 className="h-3 w-3 cursor-help text-blue-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Received - Incoming message received and processed</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'accepted':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Clock className="h-3 w-3 cursor-help text-blue-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Accepted - API request received, selecting sender</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'read':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <CheckCircle2 className="h-3 w-3 cursor-help text-green-700" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Read - Recipient opened the message</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'failed':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <XCircle className="h-3 w-3 cursor-help text-red-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Failed - Message failed to send (queue overflow, suspension, or media error)</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'undelivered':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <XCircle className="h-3 w-3 cursor-help text-red-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Undelivered - Carrier could not deliver (filtering or device unavailable)</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'canceled':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertCircle className="h-3 w-3 cursor-help text-gray-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Canceled - Scheduled message was canceled</p>
            </TooltipContent>
          </Tooltip>
        );
      default:
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Unknown status{status ? `: ${status}` : ''}</p>
            </TooltipContent>
          </Tooltip>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Header Section */}
        <div className="border-b bg-muted/30 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={isSessionActive ? 'default' : 'secondary'} className="text-xs">
                {isSessionActive ? '● Active' : 'Closed'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {notifications.length} message{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
            {isSessionActive && (
              <Button onClick={() => setShowCloseConfirm(true)} variant="destructive" size="sm">
                Close Session
              </Button>
            )}
          </div>
        </div>

        {/* Close Session Confirmation Dialog */}
        <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Close SMS Session?
              </DialogTitle>
              <DialogDescription>
                This will close the SMS session for this ride. No more messages will be sent or
                received. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setShowCloseConfirm(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleCloseSession}
                className="w-full sm:w-auto"
              >
                Yes, Close Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Messages Area */}
        {notifications.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <div className="text-center text-muted-foreground">
              <Phone className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p className="text-sm">No SMS messages sent for this ride yet.</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
            <div className="space-y-4">
              {notifications.map((notif, index) => {
                const isInbound = notif.direction === 'inbound';
                const isScheduled = notif.isScheduled === true;
                const prevNotif = index > 0 ? notifications[index - 1] : null;
                const showDateDivider =
                  !prevNotif || formatDate(notif.sentAt) !== formatDate(prevNotif.sentAt);

                return (
                  <React.Fragment key={notif.uuid}>
                    {showDateDivider && (
                      <div className="my-4 flex items-center gap-2">
                        <Separator className="flex-1" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatDate(notif.sentAt)}
                        </span>
                        <Separator className="flex-1" />
                      </div>
                    )}

                    <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] ${isInbound ? 'mr-auto' : 'ml-auto'}`}>
                        {/* Message bubble */}
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            isInbound
                              ? 'bg-muted text-foreground rounded-tl-none'
                              : isScheduled
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 rounded-tr-none border border-amber-300 dark:border-amber-700'
                                : 'bg-primary text-primary-foreground rounded-tr-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {notif.messageBody}
                          </p>
                        </div>

                        {/* Message metadata */}
                        <div
                          className={`flex items-center gap-2 mt-1 px-2 ${isInbound ? '' : 'justify-end'}`}
                        >
                          {isScheduled && (
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                              Scheduled
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notif.sentAt)}
                          </span>
                          {!isInbound && getStatusIcon(notif.twilioStatus, isScheduled)}
                        </div>

                        {/* Error message */}
                        {notif.errorMessage && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {notif.errorMessage}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Footer Section */}
        <div className="border-t bg-muted/30 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span>Rider: {riderPhone}</span>
            </div>
            {driverPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>Driver: {driverPhone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SMSConversationModal;
