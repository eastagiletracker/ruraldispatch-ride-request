/**
 * Vehicle Repository
 * Handles all vehicle database operations
 */

import type { PrismaClient, Vehicle } from '@prisma/client';

// ==================== TYPE DEFINITIONS ====================

/**
 * Vehicle with accessibility features string
 */
interface VehicleWithFeatures extends Vehicle {
  accessibilityFeatures: string;
}

/**
 * Vehicle input for creating new vehicles
 */
interface VehicleInput {
  uuid: string;
  displayName: string;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  licensePlate?: string | null;
  walkerAccessible?: boolean;
  wheelchairAccessible?: boolean;
  serviceAnimalFriendly?: boolean;
  oxygenTankAccessible?: boolean;
}

// ==================== REPOSITORY ====================

export function createVehicleRepository(prisma: PrismaClient) {
  return {
    /**
     * Get a single vehicle by UUID with formatted accessibility features
     */
    getVehicle: async (uuid: string): Promise<VehicleWithFeatures | null> => {
      const vehicle = await prisma.vehicle.findUnique({
        where: { uuid },
      });

      if (!vehicle) return null;

      // Transform accessibility booleans into comma-separated string
      const features: string[] = [];
      if (vehicle.wheelchairAccessible) features.push('Wheelchair');
      if (vehicle.walkerAccessible) features.push('Walker');
      if (vehicle.serviceAnimalFriendly) features.push('Service Animal');
      if (vehicle.oxygenTankAccessible) features.push('Oxygen Tank');

      return {
        ...vehicle,
        accessibilityFeatures: features.length > 0 ? features.join(', ') : 'None',
      };
    },

    /**
     * Get all vehicles with formatted accessibility features
     */
    getVehicles: async (): Promise<VehicleWithFeatures[]> => {
      const vehicles = await prisma.vehicle.findMany({
        orderBy: {
          displayName: 'asc',
        },
      });

      // Transform accessibility booleans into comma-separated string for each vehicle
      return vehicles.map((vehicle: Vehicle) => {
        const features: string[] = [];
        if (vehicle.wheelchairAccessible) features.push('Wheelchair');
        if (vehicle.walkerAccessible) features.push('Walker');
        if (vehicle.serviceAnimalFriendly) features.push('Service Animal');
        if (vehicle.oxygenTankAccessible) features.push('Oxygen Tank');

        return {
          ...vehicle,
          accessibilityFeatures: features.length > 0 ? features.join(', ') : 'None',
        };
      });
    },

    /**
     * Add a new vehicle
     */
    addVehicle: async (vehicle: VehicleInput): Promise<Vehicle> => {
      return await prisma.vehicle.create({
        data: {
          uuid: vehicle.uuid,
          displayName: vehicle.displayName,
          model: vehicle.model || null,
          year: vehicle.year || null,
          color: vehicle.color || null,
          licensePlate: vehicle.licensePlate || null,
          walkerAccessible: vehicle.walkerAccessible || false,
          wheelchairAccessible: vehicle.wheelchairAccessible || false,
          serviceAnimalFriendly: vehicle.serviceAnimalFriendly || false,
          oxygenTankAccessible: vehicle.oxygenTankAccessible || false,
        },
      });
    },

    /**
     * Delete a vehicle
     */
    deleteVehicle: async (uuid: string): Promise<Vehicle> => {
      return await prisma.vehicle.delete({
        where: { uuid },
      });
    },

    /**
     * Fuzzy search for vehicles by name, license plate, or model
     */
    fuzzyVehicleSearch: async (searchTerm: string): Promise<Vehicle[]> => {
      return await prisma.vehicle.findMany({
        where: {
          OR: [
            { displayName: { contains: searchTerm, mode: 'insensitive' } },
            { licensePlate: { contains: searchTerm, mode: 'insensitive' } },
            { model: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        orderBy: {
          displayName: 'asc',
        },
      });
    },
  };
}

export type VehicleRepository = ReturnType<typeof createVehicleRepository>;
