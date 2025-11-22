/**
 * Database Types
 * Re-exports and extends Prisma-generated types
 */

import type {
  Notification,
  Organization,
  Prisma,
  Ride,
  ServiceProvider,
  SystemUser,
  User,
  Vehicle,
} from '@prisma/client';

// Re-export Prisma types
export type {
  Ride,
  User,
  ServiceProvider,
  Vehicle,
  Notification,
  SystemUser,
  Organization,
  Prisma,
};

// Ride with optional scheduling fields
export type RideWithSchedulingFields = Ride & {
  estimatedTravelTime?: number | null;
  estimatedWaitingTime?: number | null;
};

// Rides with relations
export type RideWithRelations = Ride & {
  rider: User | null;
  driver: ServiceProvider | null;
  vehicle: Vehicle | null;
  notifications?: Notification[];
};

export type RideWithFullDetails = Ride & {
  rider: User | null;
  driver: ServiceProvider | null;
  vehicle: Vehicle | null;
  notifications: Notification[];
};

// Users with relations
export type UserWithRides = User & {
  ridesAsRider: Ride[];
};

// Providers with relations
export type ServiceProviderWithRelations = ServiceProvider & {
  ridesAsDriver: Ride[];
  organization: Organization | null;
};

// Vehicles with relations
export type VehicleWithRides = Vehicle & {
  rides: Ride[];
};

// Notification with ride details
export type NotificationWithRide = Notification & {
  ride: Ride | null;
};

// System user without sensitive data
export type SystemUserPublic = Omit<SystemUser, 'passwordHash'>;

// Create/Update input types
export type CreateRideInput = Omit<Ride, 'uuid' | 'createdAt' | 'updatedAt' | 'displayId'> & {
  displayId?: string;
};

export type UpdateRideInput = Partial<Omit<Ride, 'uuid' | 'createdAt' | 'updatedAt' | 'displayId'>>;

export type CreateUserInput = Omit<User, 'uuid' | 'createdAt' | 'updatedAt'>;

export type UpdateUserInput = Partial<Omit<User, 'uuid' | 'createdAt' | 'updatedAt'>>;

export type CreateServiceProviderInput = Omit<ServiceProvider, 'uuid' | 'createdAt' | 'updatedAt'>;

export type UpdateServiceProviderInput = Partial<
  Omit<ServiceProvider, 'uuid' | 'createdAt' | 'updatedAt'>
>;

export type CreateVehicleInput = Omit<Vehicle, 'uuid' | 'createdAt' | 'updatedAt'>;

export type UpdateVehicleInput = Partial<Omit<Vehicle, 'uuid' | 'createdAt' | 'updatedAt'>>;

export type CreateNotificationInput = Omit<Notification, 'uuid' | 'createdAt' | 'updatedAt'>;

export type UpdateNotificationInput = Partial<
  Omit<Notification, 'uuid' | 'createdAt' | 'updatedAt'>
>;

export type CreateSystemUserInput = Omit<SystemUser, 'uuid' | 'createdAt' | 'updatedAt'>;

export type UpdateSystemUserInput = Partial<
  Omit<SystemUser, 'uuid' | 'createdAt' | 'updatedAt' | 'passwordHash'>
>;

// Backward compatibility types (MongoDB-style field names)
export type RideRequestLegacy = Ride & {
  serviceUserUuid?: string | null;
  serviceUserName?: string | null;
  serviceUserPhone?: string | null;
  assignedDriverUuid?: string | null;
  assignedVehicleUuid?: string | null;
  rider?: User[];
  driver?: ServiceProvider[];
};
