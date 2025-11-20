/**
 * Ride Requests Seed
 */

import { PrismaClient } from '../generated/client/client.js';
import { v7 as uuidv7 } from 'uuid';

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
    // READY TO START - Assigned and confirmed
    {
      riderIndex: 2, // Emily Chen
      driverIndex: 0, // Michael Chen
      vehicleIndex: 0,
      pickupAddress: '555 Broadway, Manhattan, NY 10012',
      dropOffAddress: '777 Amsterdam Ave, Manhattan, NY 10025',
      pickupRequestedTime: createDateTime(16, 30),
      roundTrip: false,
      rideStatus: 100, // RIDE_CONFIRMED
      rideRequestStatus: 1000, // READY_TO_RIDE
      purpose: 'Physical Therapy Appointment',
      notes: 'Driver assigned and ride confirmed.',
    },
    {
      riderIndex: 3, // Robert Taylor
      driverIndex: 1, // Patricia Smith
      vehicleIndex: 1,
      pickupAddress: '888 Park Ave, Manhattan, NY 10075',
      dropOffAddress: '999 5th Ave, Manhattan, NY 10021',
      pickupRequestedTime: createDateTime(18, 0),
      roundTrip: false,
      rideStatus: 100, // RIDE_CONFIRMED
      rideRequestStatus: 1000, // READY_TO_RIDE
      purpose: 'Grocery Shopping',
      notes: 'Wheelchair accessible vehicle required.',
    },
    // ACTIVE RIDES - Currently in progress
    {
      riderIndex: 0, // Maria Rodriguez
      driverIndex: 2, // David Martinez
      vehicleIndex: 2,
      pickupAddress: '100 Park Ave, Manhattan, NY 10017',
      dropOffAddress: '200 Madison Ave, Manhattan, NY 10016',
      pickupRequestedTime: createDateTime(11, 0),
      roundTrip: false,
      rideStatus: 300, // RIDER_PICKED_UP
      rideRequestStatus: 1000, // READY_TO_RIDE
      purpose: 'Medical Appointment',
      notes: 'Driver en route to drop-off location.',
      rideStartedActualTime: createDateTime(11, 5),
      pickupActualTime: createDateTime(11, 10),
    },
    {
      riderIndex: 1, // James Wilson
      driverIndex: 3, // Jennifer Lee
      vehicleIndex: 3,
      pickupAddress: '333 Lexington Ave, Manhattan, NY 10016',
      dropOffAddress: '444 3rd Ave, Manhattan, NY 10016',
      pickupRequestedTime: createDateTime(13, 0),
      roundTrip: false,
      rideStatus: 200, // RIDE_STARTED
      rideRequestStatus: 1000, // READY_TO_RIDE
      purpose: 'Doctor Visit',
      notes: 'Driver en route to pickup location.',
      rideStartedActualTime: createDateTime(13, 2),
    },
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
    // UNASSIGNED - Needs driver/vehicle
    {
      riderIndex: 5, // David Martinez
      driverIndex: null,
      vehicleIndex: null,
      pickupAddress: '123 Main St, Manhattan, NY 10001',
      dropOffAddress: '456 Elm St, Manhattan, NY 10002',
      pickupRequestedTime: createDateTime(15, 0),
      roundTrip: false,
      rideStatus: 0, // REQUEST_IN_PROGRESS
      rideRequestStatus: 200, // DRIVER_NEEDED
      purpose: 'Dentist Appointment',
      notes: 'Waiting for driver assignment.',
    },
  ];

  let createdRidesCount = 0;
  for (const rideData of demoRides) {
    const riderUuid = riders[rideData.riderIndex].uuid;
    const driverUuid =
      rideData.driverIndex !== null ? drivers[rideData.driverIndex].uuid : null;
    const vehicleUuid =
      rideData.vehicleIndex !== null ? vehicles[rideData.vehicleIndex].uuid : null;

    const displayId = `RIDE-${displayIdCounter++}`;

    // Use upsert to avoid duplicate creation
    await prisma.ride.upsert({
      where: { displayId },
      update: {},
      create: {
        uuid: uuidv7(),
        displayId,
        riderUuid,
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
