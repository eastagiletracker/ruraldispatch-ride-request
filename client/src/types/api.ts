import type { Notification } from './notification';
import type { RideRequest } from './rideRequest';
import type { ServiceProvider } from './serviceProvider';
import type { User } from './user';
import type { Vehicle } from './vehicle';

// API Response types
export interface ApiResponse<T = unknown> {
  ok: boolean;
  json: () => Promise<T>;
  status: number;
  statusText: string;
}

// Union type for all document types
export type Document = User | ServiceProvider | Vehicle | RideRequest | Notification;
