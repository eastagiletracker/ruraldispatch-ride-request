/**
 * API Request/Response Types
 * Types for HTTP endpoints
 */

import type { SystemRole } from '../middleware/permissions.js';
import type { RideWithRelations, SystemUserPublic } from './database.types.js';

// Common response wrappers
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode?: number;
  validation?: unknown;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// Auth API types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: true;
  user: SystemUserPublic;
  message: string;
}

export interface AuthenticatedUser {
  uuid: string;
  username: string;
  fullName: string;
  role: SystemRole;
  isActive: boolean;
}

// Ride API types
export interface CreateRideRequest {
  // Rider info
  riderUuid?: string;
  serviceUserUuid?: string; // Backward compat
  riderName?: string;
  serviceUserName?: string; // Backward compat
  riderPhone?: string;
  serviceUserPhone?: string; // Backward compat

  // Driver/Vehicle
  driverUuid?: string;
  assignedDriverUuid?: string; // Backward compat
  vehicleUuid?: string;
  assignedVehicleUuid?: string; // Backward compat

  // Addresses
  pickupAddress: string;
  dropOffAddress: string;

  // Timing
  pickupRequestedTime: string | Date;
  dropOffRequestedTime?: string | Date;

  // Trip details
  roundTrip?: boolean;
  purpose?: string;
  notes?: string;

  // Accessibility
  walkerAccessible?: boolean;
  wheelchairAccessible?: boolean;
  serviceAnimalFriendly?: boolean;
  oxygenTankAccessible?: boolean;

  // Status
  rideStatus?: number;
  rideRequestStatus?: number;
}

export interface UpdateRideRequest {
  // All fields optional for partial updates
  riderUuid?: string;
  serviceUserUuid?: string;
  riderName?: string;
  riderPhone?: string;

  driverUuid?: string;
  assignedDriverUuid?: string;
  vehicleUuid?: string;
  assignedVehicleUuid?: string;

  pickupAddress?: string;
  dropOffAddress?: string;

  pickupRequestedTime?: string | Date;
  dropOffRequestedTime?: string | Date;
  rideStartedActualTime?: string | Date;
  pickupActualTime?: string | Date;
  dropOffActualTime?: string | Date;
  rideCompleteRequestedTime?: string | Date;
  rideCompleteActualTime?: string | Date;

  rideStatus?: number;
  rideRequestStatus?: number;
  requestStatus?: number; // Backward compat

  roundTrip?: boolean;
  purpose?: string;
  notes?: string;

  walkerAccessible?: boolean;
  wheelchairAccessible?: boolean;
  serviceAnimalFriendly?: boolean;
  oxygenTankAccessible?: boolean;
}

export interface GetRideResponse {
  ride: RideWithRelations;
}

export interface GetRidesResponse {
  rides: RideWithRelations[];
  total: number;
}

// User API types
export interface CreateUserRequest {
  fullName: string;
  phone: string;
  email?: string;
  role?: string;
  smsConsentGiven?: boolean;
}

export interface UpdateUserSMSConsentRequest {
  phone: string;
  consentGiven: boolean;
  ipAddress?: string;
}

export interface FuzzySearchRequest {
  searchTerm: string;
}

// Provider API types
export interface CreateProviderRequest {
  fullName: string;
  phone?: string;
  mobilePhone?: string;
  title?: string;
  organizationId?: number;
  role?: string;
}

// Vehicle API types
export interface CreateVehicleRequest {
  displayName: string;
  fleetId?: string;
  model?: string;
  year?: number;
  color?: string;
  licensePlate?: string;
  capacity?: number;
  serviceArea?: string;
  walkerAccessible?: boolean;
  wheelchairAccessible?: boolean;
  serviceAnimalFriendly?: boolean;
  oxygenTankAccessible?: boolean;
}

// System User API types
export interface CreateSystemUserRequest {
  username: string;
  password: string;
  fullName: string;
  role: SystemRole;
  isActive?: boolean;
}

export interface UpdateSystemUserRequest {
  fullName?: string;
  role?: SystemRole;
  isActive?: boolean;
  password?: string;
}

// Notification API types
export interface NotificationStatsResponse {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  failed: number;
  lastSentAt: Date | null;
}

// Google Maps API types
export interface CalculateTravelTimeRequest {
  origin: string;
  destination: string;
}

export interface CalculateTravelTimeResponse {
  durationMinutes: number;
  durationText: string;
  durationSeconds: number;
  distanceText: string;
  distanceMeters: number;
  origin: string;
  destination: string;
}

// Pagination types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Filter types
export interface RideFilters {
  rideStatus?: number;
  rideRequestStatus?: number;
  riderUuid?: string;
  driverUuid?: string;
  vehicleUuid?: string;
  fromDate?: string | Date;
  toDate?: string | Date;
  roundTrip?: boolean;
}
