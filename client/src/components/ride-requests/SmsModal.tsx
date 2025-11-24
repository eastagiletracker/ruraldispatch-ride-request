import { MessageSquare, Phone, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import SMSConversationModal from '../SMSConversationModal';
import { getDriver, getRider, getRiderName, getRiderPhone } from './helpers';
import type { RideRequest } from './types';

interface SmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: RideRequest | null;
}

export function SmsModal({ isOpen, onClose, ride }: SmsModalProps) {
  if (!ride) return null;

  const rider = getRider(ride);
  const driver = getDriver(ride);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[85vh] flex-col p-0 sm:max-w-[700px]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <MessageSquare className="h-6 w-6 text-primary" />
            SMS Conversation
          </DialogTitle>
          <DialogDescription asChild>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <User className="h-4 w-4" />
                {getRiderName(ride)}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                {getRiderPhone(ride)}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <SMSConversationModal
            rideUuid={ride.uuid}
            riderPhone={getRiderPhone(ride)}
            driverPhone={driver?.mobilePhone || ''}
            riderName={getRiderName(ride)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
