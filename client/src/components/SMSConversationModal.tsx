import React, { useState, useEffect, useRef } from 'react';
import { fetchNotificationsByRide, closeRideSession } from '../utils/database';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, CheckCircle2, Clock, XCircle, Phone, User, AlertTriangle, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import type { Notification, TwilioStatus } from "@/types";

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
  riderName 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(true);
  const [showCloseConfirm, setShowCloseConfirm] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rideUuid) {
      loadNotifications();
      // Poll for new messages every 20 seconds
      const interval = setInterval(loadNotifications, 20000);
      return () => clearInterval(interval);
    }
  }, [rideUuid]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notifications]);

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
      toast.error('Failed to load messages');
      setLoading(false);
    }
  };

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

  const formatTime = (timestamp: string | Date): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string | Date): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status: TwilioStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <CheckCircle2 className="h-3 w-3 text-green-600 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Delivered - Message successfully delivered to recipient</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'sent':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <CheckCircle2 className="h-3 w-3 text-blue-600 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Sent - Message sent to carrier, awaiting delivery confirmation</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'received':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <CheckCircle2 className="h-3 w-3 text-blue-600 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Received - Incoming message received</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'queued':
      case 'sending':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Clock className="h-3 w-3 text-orange-600 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Pending - Message queued or sending</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'failed':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <XCircle className="h-3 w-3 text-red-600 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Failed - Message failed to send</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'undelivered':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <XCircle className="h-3 w-3 text-red-600 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Undelivered - Message sent but not delivered to recipient</p>
            </TooltipContent>
          </Tooltip>
        );
      default:
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="px-6 py-3 bg-muted/30 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant={isSessionActive ? "default" : "secondary"} className="text-xs">
              {isSessionActive ? '● Active' : 'Closed'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {notifications.length} message{notifications.length !== 1 ? 's' : ''}
            </span>
          </div>
          {isSessionActive && (
            <Button
              onClick={() => setShowCloseConfirm(true)}
              variant="destructive"
              size="sm"
            >
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
              This will close the SMS session for this ride. No more messages will be sent or received.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
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
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No SMS messages sent for this ride yet.</p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {notifications.map((notif, index) => {
              const isInbound = notif.direction === 'inbound';
              const prevNotif = index > 0 ? notifications[index - 1] : null;
              const showDateDivider = !prevNotif || 
                formatDate(notif.sentAt) !== formatDate(prevNotif.sentAt);

              return (
                <React.Fragment key={index}>
                  {showDateDivider && (
                    <div className="flex items-center gap-2 my-4">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground font-medium">
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
                            : 'bg-primary text-primary-foreground rounded-tr-none'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {notif.messageBody}
                        </p>
                      </div>

                      {/* Message metadata */}
                      <div className={`flex items-center gap-2 mt-1 px-2 ${isInbound ? '' : 'justify-end'}`}>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notif.sentAt)}
                        </span>
                        {!isInbound && getStatusIcon(notif.twilioStatus)}
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
      <div className="px-6 py-3 bg-muted/30 border-t">
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
