/**
 * Ride Repository
 * Handles all ride/ride-request database operations
 */

import type {
  Notification,
  PrismaClient,
  Ride,
  ServiceProvider,
  User,
  Vehicle,
} from '@prisma/client';
import { generateRideDisplayId } from '../displayId.js';

// ==================== TYPE DEFINITIONS ====================

/**
 * Ride with joined relationships
 */
type RideWithRelations = Ride & {
  rider: User | null;
  driver: ServiceProvider | null;
  vehicle: Vehicle | null;
  notifications?: Notification[];
};

/**
 * Input types for creating/updating entities
 */
interface RideRequestInput {
  uuid: string;
  displayId?: string;
  serviceUserUuid?: string | null;
  riderUuid?: string | null;
  riderName?: string | null;
  serviceUserName?: string | null;
  riderPhone?: string | null;
  serviceUserPhone?: string | null;
  caseManagerName?: string | null;
  caseManagerPhone?: string | null;
  assignedDriverUuid?: string | null;
  driverUuid?: string | null;
  assignedVehicleUuid?: string | null;
  vehicleUuid?: string | null;
  pickupAddress: string;
  dropOffAddress: string;
  pickupRequestedTime: Date | string;
  dropOffRequestedTime?: Date | string | null;
  rideStartedActualTime?: Date | string | null;
  pickupActualTime?: Date | string | null;
  dropOffActualTime?: Date | string | null;
  rideCompleteRequestedTime?: Date | string | null;
  rideCompleteActualTime?: Date | string | null;
  rideStatus?: number;
  rideRequestStatus?: number;
  roundTrip?: boolean;
  purpose?: string | null;
  notes?: string | null;
  estimatedTravelTime?: number;
  estimatedDistance?: number;
  walkerAccessible?: boolean;
  wheelchairAccessible?: boolean;
  serviceAnimalFriendly?: boolean;
  oxygenTankAccessible?: boolean;
}

interface RideRequestUpdateInput {
  assignedDriverUuid?: string | null;
  assignedVehicleUuid?: string | null;
  driverUuid?: string | null;
  vehicleUuid?: string | null;
  serviceUserUuid?: string | null;
  pickupAddress?: string;
  dropOffAddress?: string;
  pickupRequestedTime?: Date | string;
  dropOffRequestedTime?: Date | string | null;
  rideStartedActualTime?: Date | string | null;
  pickupActualTime?: Date | string | null;
  dropOffActualTime?: Date | string | null;
  rideCompleteRequestedTime?: Date | string | null;
  rideCompleteActualTime?: Date | string | null;
  rideStatus?: number;
  rideRequestStatus?: number;
  requestStatus?: number;
  roundTrip?: boolean;
  purpose?: string | null;
  notes?: string | null;
  estimatedTravelTime?: number;
  estimatedDistance?: number;
  walkerAccessible?: boolean;
  wheelchairAccessible?: boolean;
  serviceAnimalFriendly?: boolean;
  oxygenTankAccessible?: boolean;
}

// ==================== REPOSITORY ====================

export function createRideRepository(prisma: PrismaClient) {
  return {
    /**
     * Get a single ride request with joined user/driver/vehicle data
     */
    getRideRequest: async (uuid: string): Promise<RideWithRelations | null> => {
      const ride = await prisma.ride.findUnique({
        where: { uuid },
        include: {
          rider: true,
          driver: true,
          vehicle: true,
          notifications: true,
        },
      });

      return ride;
    },

    /**
     * Get all ride requests with joined data
     */
    getRideRequests: async (): Promise<RideWithRelations[]> => {
      const rides = await prisma.ride.findMany({
        include: {
          rider: true,
          driver: true,
          vehicle: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return rides;
    },

    /**
     * Add a new ride request
     */
    addRideRequest: async (rideReq: RideRequestInput): Promise<Ride> => {
      return await prisma.ride.create({
        data: {
          uuid: rideReq.uuid,
          displayId: rideReq.displayId || generateRideDisplayId(),
          riderUuid: rideReq.serviceUserUuid || rideReq.riderUuid || null,
          riderName: rideReq.serviceUserName || null,
          riderPhone: rideReq.serviceUserPhone || null,
          caseManagerName: rideReq.caseManagerName || null,
          caseManagerPhone: rideReq.caseManagerPhone || null,
          driverUuid: rideReq.assignedDriverUuid || rideReq.driverUuid || null,
          vehicleUuid: rideReq.assignedVehicleUuid || rideReq.vehicleUuid || null,
          pickupAddress: rideReq.pickupAddress,
          dropOffAddress: rideReq.dropOffAddress,
          pickupRequestedTime: new Date(rideReq.pickupRequestedTime),
          dropOffRequestedTime: rideReq.dropOffRequestedTime
            ? new Date(rideReq.dropOffRequestedTime)
            : null,
          rideStartedActualTime: rideReq.rideStartedActualTime
            ? new Date(rideReq.rideStartedActualTime)
            : null,
          pickupActualTime: rideReq.pickupActualTime ? new Date(rideReq.pickupActualTime) : null,
          dropOffActualTime: rideReq.dropOffActualTime ? new Date(rideReq.dropOffActualTime) : null,
          rideCompleteRequestedTime: rideReq.rideCompleteRequestedTime
            ? new Date(rideReq.rideCompleteRequestedTime)
            : null,
          rideCompleteActualTime: rideReq.rideCompleteActualTime
            ? new Date(rideReq.rideCompleteActualTime)
            : null,
          rideStatus: rideReq.rideStatus || 0,
          rideRequestStatus: rideReq.rideRequestStatus || 100,
          roundTrip: rideReq.roundTrip || false,
          purpose: rideReq.purpose || null,
          notes: rideReq.notes || null,
          estimatedTravelTime: rideReq.estimatedTravelTime || null,
          estimatedDistance: rideReq.estimatedDistance || null,
          walkerAccessible: rideReq.walkerAccessible || false,
          wheelchairAccessible: rideReq.wheelchairAccessible || false,
          serviceAnimalFriendly: rideReq.serviceAnimalFriendly || false,
          oxygenTankAccessible: rideReq.oxygenTankAccessible || false,
        },
      });
    },

    /**
     * Update a ride request
     */
    updateRideRequest: async (
      uuid: string,
      replacementFields: RideRequestUpdateInput
    ): Promise<Ride> => {
      // Map MongoDB field names to Prisma schema
      const updates: any = {
        ...(replacementFields.driverUuid !== undefined && {
          driverUuid: replacementFields.driverUuid,
        }),
        ...(replacementFields.assignedDriverUuid !== undefined && {
          driverUuid: replacementFields.assignedDriverUuid,
        }),
        ...(replacementFields.vehicleUuid !== undefined && {
          vehicleUuid: replacementFields.vehicleUuid,
        }),
        ...(replacementFields.assignedVehicleUuid !== undefined && {
          vehicleUuid: replacementFields.assignedVehicleUuid,
        }),
        ...(replacementFields.serviceUserUuid !== undefined && {
          riderUuid: replacementFields.serviceUserUuid,
        }),
        ...(replacementFields.pickupAddress !== undefined && {
          pickupAddress: replacementFields.pickupAddress,
        }),
        ...(replacementFields.dropOffAddress !== undefined && {
          dropOffAddress: replacementFields.dropOffAddress,
        }),
        ...(replacementFields.pickupRequestedTime !== undefined && {
          pickupRequestedTime: new Date(replacementFields.pickupRequestedTime),
        }),
        ...(replacementFields.dropOffRequestedTime !== undefined && {
          dropOffRequestedTime: replacementFields.dropOffRequestedTime
            ? new Date(replacementFields.dropOffRequestedTime)
            : null,
        }),
        ...(replacementFields.rideStartedActualTime !== undefined && {
          rideStartedActualTime: replacementFields.rideStartedActualTime
            ? new Date(replacementFields.rideStartedActualTime)
            : null,
        }),
        ...(replacementFields.pickupActualTime !== undefined && {
          pickupActualTime: replacementFields.pickupActualTime
            ? new Date(replacementFields.pickupActualTime)
            : null,
        }),
        ...(replacementFields.dropOffActualTime !== undefined && {
          dropOffActualTime: replacementFields.dropOffActualTime
            ? new Date(replacementFields.dropOffActualTime)
            : null,
        }),
        ...(replacementFields.rideCompleteRequestedTime !== undefined && {
          rideCompleteRequestedTime: replacementFields.rideCompleteRequestedTime
            ? new Date(replacementFields.rideCompleteRequestedTime)
            : null,
        }),
        ...(replacementFields.rideCompleteActualTime !== undefined && {
          rideCompleteActualTime: replacementFields.rideCompleteActualTime
            ? new Date(replacementFields.rideCompleteActualTime)
            : null,
        }),
        ...(replacementFields.rideStatus !== undefined && {
          rideStatus: replacementFields.rideStatus,
        }),
        ...(replacementFields.rideRequestStatus !== undefined && {
          rideRequestStatus: replacementFields.rideRequestStatus,
        }),
        ...(replacementFields.requestStatus !== undefined && {
          rideRequestStatus: replacementFields.requestStatus,
        }),
        ...(replacementFields.roundTrip !== undefined && {
          roundTrip: replacementFields.roundTrip,
        }),
        ...(replacementFields.purpose !== undefined && {
          purpose: replacementFields.purpose,
        }),
        ...(replacementFields.notes !== undefined && {
          notes: replacementFields.notes,
        }),
        ...(replacementFields.estimatedTravelTime !== undefined && {
          estimatedTravelTime: replacementFields.estimatedTravelTime,
        }),
        ...(replacementFields.estimatedDistance !== undefined && {
          estimatedDistance: replacementFields.estimatedDistance,
        }),
        ...(replacementFields.walkerAccessible !== undefined && {
          walkerAccessible: replacementFields.walkerAccessible,
        }),
        ...(replacementFields.wheelchairAccessible !== undefined && {
          wheelchairAccessible: replacementFields.wheelchairAccessible,
        }),
        ...(replacementFields.serviceAnimalFriendly !== undefined && {
          serviceAnimalFriendly: replacementFields.serviceAnimalFriendly,
        }),
        ...(replacementFields.oxygenTankAccessible !== undefined && {
          oxygenTankAccessible: replacementFields.oxygenTankAccessible,
        }),
      };

      return await prisma.ride.update({
        where: { uuid },
        data: updates,
      });
    },
  };
}

export type RideRepository = ReturnType<typeof createRideRepository>;
