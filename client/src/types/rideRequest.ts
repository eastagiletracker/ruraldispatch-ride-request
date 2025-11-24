// Ride Request types
export interface RideRequest {
  uuid: number | string;
  serviceUserUuid: string;
  serviceUserRole: string;
  pickupAddress: string;
  dropOffAddress: string;
  roundTrip: boolean;
  pickupRequestedTime: string;
  dropOffRequestedTime: string;
  rideStartedActualTime: Date | string;
  pickupActualTime: Date | string;
  dropOffActualTime: Date | string;
  rideCompleteRequestedTime: Date | string;
  rideCompleteActualTime: Date | string;
  rideStatus: number;
  purpose: string;
  rideRequestStatus: number;
  notes: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type RideRequestType = 'Standard' | 'Emergency' | 'Medical' | 'Shopping';
