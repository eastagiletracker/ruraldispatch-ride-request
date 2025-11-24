/**
 * Ride Requests Seed
 */

import { v7 as uuidv7 } from 'uuid';
import type { PrismaClient } from '../../node_modules/.prisma/client/index.js';

// Helper to create datetime for today
const createDateTime = (hour: number, minute: number) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
};

export async function seedRides(
  prisma: PrismaClient,
  riders: any[],
  drivers: any[],
  vehicles: any[]
) {
  console.log('\n🚕 Seeding Ride Requests...');

  // Display ID counter
  let displayIdCounter = 1001;

  const demoRides = [
    // COMPLETED RIDES
    {
      riderIndex: 0, // Maria Rodriguez
      driverIndex: 0, // Michael Chen
      vehicleIndex: 0,
      pickupAddress: '777 Madison Ave, Manhattan, NY 10065',
      dropOffAddress: '888 5th Ave, Manhattan, NY 10028',
      pickupRequestedTime: createDateTime(8, 0),
      roundTrip: false,
      rideStatus: 500, // RIDE_COMPLETE
      rideRequestStatus: 1100, // CLOSED
      purpose: 'Breakfast Meeting',
      notes: 'Ride completed successfully.',
      rideStartedActualTime: createDateTime(8, 2),
      pickupActualTime: createDateTime(8, 5),
      dropOffActualTime: createDateTime(8, 58),
      rideCompleteActualTime: createDateTime(8, 58),
    },
    {
      riderIndex: 1, // James Wilson
      driverIndex: 1, // Patricia Smith
      vehicleIndex: 1,
      pickupAddress: '666 Park Ave, Manhattan, NY 10065',
      dropOffAddress: '777 Broadway, Manhattan, NY 10003',
      pickupRequestedTime: createDateTime(9, 0),
      roundTrip: false,
      rideStatus: 500, // RIDE_COMPLETE
      rideRequestStatus: 1100, // CLOSED
      purpose: 'Work Commute',
      notes: 'Completed on time.',
      rideStartedActualTime: createDateTime(9, 3),
      pickupActualTime: createDateTime(9, 7),
      dropOffActualTime: createDateTime(9, 58),
      rideCompleteActualTime: createDateTime(9, 58),
    },
  ];

  let createdRidesCount = 0;
  for (const rideData of demoRides) {
    const riderUuid = riders[rideData.riderIndex].uuid;
    const driverUuid = rideData.driverIndex !== null ? drivers[rideData.driverIndex].uuid : null;
    const vehicleUuid =
      rideData.vehicleIndex !== null ? vehicles[rideData.vehicleIndex].uuid : null;

    const displayId = `RIDE-${displayIdCounter++}`;

    // Get rider info for optional fields
    const rider = riders[rideData.riderIndex];

    // Use upsert to avoid duplicate creation
    await prisma.ride.upsert({
      where: { displayId },
      update: {},
      create: {
        uuid: uuidv7(),
        displayId,
        riderUuid,
        riderName: rider.fullName,
        riderPhone: rider.phone,
        caseManagerName: 'John Doe',
        caseManagerPhone: '+18777804236',
        driverUuid,
        vehicleUuid,
        pickupAddress: rideData.pickupAddress,
        dropOffAddress: rideData.dropOffAddress,
        pickupRequestedTime: rideData.pickupRequestedTime,
        roundTrip: rideData.roundTrip,
        rideStatus: rideData.rideStatus,
        rideRequestStatus: rideData.rideRequestStatus,
        purpose: rideData.purpose || null,
        notes: rideData.notes || null,
        estimatedTravelTime: 25,
        estimatedDistance: 5.5,
        walkerAccessible: false,
        wheelchairAccessible: false,
        serviceAnimalFriendly: true,
        oxygenTankAccessible: false,
        rideStartedActualTime: (rideData as any).rideStartedActualTime || null,
        pickupActualTime: (rideData as any).pickupActualTime || null,
        dropOffActualTime: (rideData as any).dropOffActualTime || null,
        rideCompleteActualTime: (rideData as any).rideCompleteActualTime || null,
      },
    });

    const riderName = riders[rideData.riderIndex].fullName;
    const statusName =
      rideData.rideStatus === 0
        ? 'UNASSIGNED'
        : rideData.rideStatus === 100
          ? 'CONFIRMED'
          : rideData.rideStatus === 200
            ? 'STARTED'
            : rideData.rideStatus === 300
              ? 'PICKED_UP'
              : rideData.rideStatus === 500
                ? 'COMPLETE'
                : 'UNKNOWN';

    console.log(`  ✅ Created ride: ${riderName.padEnd(20)} | ${statusName}`);
    createdRidesCount++;
  }

  console.log(`\n  📊 Total: ${createdRidesCount} ride requests`);

  return createdRidesCount;
}
