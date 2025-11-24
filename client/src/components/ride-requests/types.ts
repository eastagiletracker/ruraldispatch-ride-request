export interface RideRequest {
  uuid: string;
  rideRequestStatus: number;
  rideStatus?: number;
  rider: Array<{ fullName: string; phone: string }>;
  driver?: Array<{ fullName: string; mobilePhone: string }>;
  serviceUserName?: string;
  serviceUserPhone?: string;
  pickupAddress: string;
  dropOffAddress: string;
  pickupRequestedTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RideRequestsProps {
  callbackFn: (uuid: string) => void;
}
