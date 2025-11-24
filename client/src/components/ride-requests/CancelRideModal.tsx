import { MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { RideRequest } from './types';
import { getRiderName } from './helpers';

interface CancelRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideRequest: RideRequest | null;
  onConfirm: (rideRequest: RideRequest) => void;
}

export function CancelRideModal({ isOpen, onClose, rideRequest, onConfirm }: CancelRideModalProps) {
  if (!rideRequest) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cancel Ride Request</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this ride request? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Rider</p>
              <p className="text-sm text-muted-foreground">
                {getRiderName(rideRequest)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium">Pickup</p>
              <p className="text-sm text-muted-foreground">{rideRequest.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-red-600" />
            <div>
              <p className="text-sm font-medium">Dropoff</p>
              <p className="text-sm text-muted-foreground">{rideRequest.dropOffAddress}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Keep Request
          </Button>
          <Button type="button" variant="destructive" onClick={() => onConfirm(rideRequest)}>
            Cancel Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
