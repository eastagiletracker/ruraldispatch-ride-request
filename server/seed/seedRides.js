/**
 * Seed script to create demo ride requests with various statuses
 * Run this script to populate the ride-requests collection with demo data
 *
 * Usage: node server/database/seedRides.js
 *
 * Ride statuses included:
 * - Unassigned Rides (waiting for driver/vehicle)
 * - Active Rides (currently in progress)
 * - Completed Rides (finished today)
 */

require('dotenv').config({ path: '../../.env' });
const generateApi = require('../database/api');
const { v4: uuidv4 } = require('uuid');

// Import ride status constants
const RIDE_STATUSES = {
  REQUEST_IN_PROGRESS: 0,
  RIDE_CONFIRMED: 100,
  RIDE_CANCELED_BY_RIDER: 109,
  RIDE_STARTED: 200,
  RIDER_PICKED_UP: 300,
  RIDER_DROPPED_OFF: 400,
  RIDE_COMPLETE: 500,
  RIDE_INCOMPLETE: 509
};

const RIDE_REQUEST_STATUSES = {
  ALL_RIDE_REQUEST_OPEN: 100,
  DRIVER_NEEDED: 200,
  VEHICLE_NEEDED: 300,
  RIDE_CONFIRMATION_NEEDED: 400,
  READY_FOR_PICKUP: 500,
  EN_ROUTE_TO_PICKUP: 510,
  RIDER_PICKED_UP_CONFIRMED: 600,
  EN_ROUTE_TO_DROPOFF: 610,
  RIDER_DROPPED_OFF_CONFIRMED: 700,
  RIDE_COMPLETED_SUCCESSFULLY: 800,
  ALL_RIDE_REQUEST_READY_TO_RIDE: 1000,
  ALL_RIDE_REQUEST_CLOSED: 1100
};

/**
 * Demo rides organized by status
 * Mix of unassigned, active, and completed rides
 */
// Helper function to create dates for today
const getToday = () => new Date().toISOString().split('T')[0];
const createDateTime = (hour, minute) => new Date(new Date().setHours(hour, minute, 0)).toISOString();

const demoRides = [
  // READY TO START - Assigned and confirmed, waiting for driver to start
  {
    status: 'READY_TO_START',
    serviceUserUuid: 'placeholder',
    serviceUserName: 'Emily Chen',
    serviceUserRole: 'rider',
    pickupAddress: '555 Broadway, Manhattan, NY 10012',
    dropOffAddress: '777 Amsterdam Ave, Manhattan, NY 10025',
    assignedVehicleUuid: null,
    assignedDriverUuid: null,
    roundTrip: false,
    pickupRequestedTime: createDateTime(16, 30),
    dropOffRequestedTime: createDateTime(17, 15),
    rideStartedActualTime: null,
    pickupActualTime: null,
    dropOffActualTime: null,
    rideCompleteRequestedTime: createDateTime(17, 15),
    rideCompleteActualTime: null,
    rideStatus: RIDE_STATUSES.RIDE_CONFIRMED,
    rideRequestStatus: RIDE_REQUEST_STATUSES.ALL_RIDE_REQUEST_READY_TO_RIDE,
    purpose: 'Physical Therapy Appointment',
    notes: 'Driver assigned and ride confirmed. Ready to start when driver clicks "Start Ride".'
  },
  {
    status: 'READY_TO_START',
    serviceUserUuid: 'placeholder',
    serviceUserName: 'Robert Taylor',
    serviceUserRole: 'rider',
    pickupAddress: '888 Park Ave, Manhattan, NY 10075',
    dropOffAddress: '999 5th Ave, Manhattan, NY 10021',
    assignedVehicleUuid: null,
    assignedDriverUuid: null,
    roundTrip: false,
    pickupRequestedTime: createDateTime(18, 0),
    dropOffRequestedTime: createDateTime(18, 45),
    rideStartedActualTime: null,
    pickupActualTime: null,
    dropOffActualTime: null,
    rideCompleteRequestedTime: createDateTime(18, 45),
    rideCompleteActualTime: null,
    rideStatus: RIDE_STATUSES.RIDE_CONFIRMED,
    rideRequestStatus: RIDE_REQUEST_STATUSES.ALL_RIDE_REQUEST_READY_TO_RIDE,
    purpose: 'Grocery Shopping',
    notes: 'Driver assigned. Wheelchair accessible vehicle required.'
  },
  // ACTIVE RIDES - Currently in progress
  {
    status: 'ACTIVE',
    serviceUserUuid: 'placeholder',
    serviceUserName: 'Maria Rodriguez',
    serviceUserRole: 'rider',
    pickupAddress: '100 Park Ave, Manhattan, NY 10017',
    dropOffAddress: '200 Madison Ave, Manhattan, NY 10016',
    assignedVehicleUuid: null,
    assignedDriverUuid: null,
    roundTrip: false,
    pickupRequestedTime: createDateTime(11, 0),
    dropOffRequestedTime: createDateTime(11, 45),
    rideStartedActualTime: createDateTime(11, 5),
    pickupActualTime: createDateTime(11, 10),
    dropOffActualTime: null,
    rideCompleteRequestedTime: createDateTime(11, 45),
    rideCompleteActualTime: null,
    rideStatus: RIDE_STATUSES.RIDER_PICKED_UP,
    rideRequestStatus: RIDE_REQUEST_STATUSES.EN_ROUTE_TO_DROPOFF,
    purpose: 'Medical Appointment',
    notes: 'Driver en route to drop-off location. Estimated arrival in 15 minutes.'
  },
  {
    status: 'ACTIVE',
    serviceUserUuid: 'placeholder',
    serviceUserName: 'James Wilson',
    serviceUserRole: 'rider',
    pickupAddress: '333 Lexington Ave, Manhattan, NY 10016',
    dropOffAddress: '444 3rd Ave, Manhattan, NY 10016',
    assignedVehicleUuid: null,
    assignedDriverUuid: null,
    roundTrip: false,
    pickupRequestedTime: createDateTime(13, 0),
    dropOffRequestedTime: createDateTime(13, 30),
    rideStartedActualTime: createDateTime(13, 2),
    pickupActualTime: null,
    dropOffActualTime: null,
    rideCompleteRequestedTime: createDateTime(13, 30),
    rideCompleteActualTime: null,
    rideStatus: RIDE_STATUSES.RIDE_STARTED,
    rideRequestStatus: RIDE_REQUEST_STATUSES.EN_ROUTE_TO_PICKUP,
    purpose: 'Doctor Visit',
    notes: 'Driver en route to pick up location. ETA 5 minutes.'
  },
  {
    status: 'ACTIVE',
    serviceUserUuid: 'placeholder',
    serviceUserName: 'Sarah Johnson',
    serviceUserRole: 'rider',
    pickupAddress: '111 Wall St, Manhattan, NY 10005',
    dropOffAddress: '222 Church St, Manhattan, NY 10007',
    assignedVehicleUuid: null,
    assignedDriverUuid: null,
    roundTrip: true,
    pickupRequestedTime: createDateTime(15, 0),
    dropOffRequestedTime: createDateTime(16, 0),
    rideStartedActualTime: createDateTime(15, 5),
    pickupActualTime: createDateTime(15, 8),
    dropOffActualTime: createDateTime(15, 45),
    rideCompleteRequestedTime: createDateTime(17, 0),
    rideCompleteActualTime: null,
    rideStatus: RIDE_STATUSES.RIDER_DROPPED_OFF,
    rideRequestStatus: RIDE_REQUEST_STATUSES.RIDER_DROPPED_OFF_CONFIRMED,
    purpose: 'Shopping Trip',
    notes: 'Round trip. Waiting for return trip. Will pick up at 4:00 PM.'
  },

  // COMPLETED RIDES - Finished today
  {
    status: 'COMPLETED',
    serviceUserUuid: 'placeholder',
    serviceUserName: 'Maria Rodriguez',
    serviceUserRole: 'rider',
    pickupAddress: '777 Madison Ave, Manhattan, NY 10065',
    dropOffAddress: '888 5th Ave, Manhattan, NY 10028',
    assignedVehicleUuid: null,
    assignedDriverUuid: null,
    roundTrip: false,
    pickupRequestedTime: createDateTime(8, 0),
    dropOffRequestedTime: createDateTime(9, 0),
    rideStartedActualTime: createDateTime(8, 2),
    pickupActualTime: createDateTime(8, 5),
    dropOffActualTime: createDateTime(8, 58),
    rideCompleteRequestedTime: createDateTime(9, 0),
    rideCompleteActualTime: createDateTime(8, 58),
    rideStatus: RIDE_STATUSES.RIDE_COMPLETE,
    rideRequestStatus: RIDE_REQUEST_STATUSES.RIDE_COMPLETED_SUCCESSFULLY,
    purpose: 'Breakfast Meeting',
    notes: 'Ride completed successfully. No issues.'
  },
  {
    status: 'COMPLETED',
    serviceUserUuid: 'placeholder',
    serviceUserName: 'James Wilson',
    serviceUserRole: 'rider',
    pickupAddress: '666 Park Ave, Manhattan, NY 10065',
    dropOffAddress: '777 Broadway, Manhattan, NY 10003',
    assignedVehicleUuid: null,
    assignedDriverUuid: null,
    roundTrip: false,
    pickupRequestedTime: createDateTime(9, 0),
    dropOffRequestedTime: createDateTime(10, 0),
    rideStartedActualTime: createDateTime(9, 3),
    pickupActualTime: createDateTime(9, 7),
    dropOffActualTime: createDateTime(9, 58),
    rideCompleteRequestedTime: createDateTime(10, 0),
    rideCompleteActualTime: createDateTime(9, 58),
    rideStatus: RIDE_STATUSES.RIDE_COMPLETE,
    rideRequestStatus: RIDE_REQUEST_STATUSES.RIDE_COMPLETED_SUCCESSFULLY,
    purpose: 'Work Commute',
    notes: 'Completed on time. Rider very satisfied.'
  },
  {
    status: 'COMPLETED',
    serviceUserUuid: 'placeholder',
    serviceUserName: 'Emily Chen',
    serviceUserRole: 'rider',
    pickupAddress: '999 2nd Ave, Manhattan, NY 10017',
    dropOffAddress: '111 E 42nd St, Manhattan, NY 10017',
    assignedVehicleUuid: null,
    assignedDriverUuid: null,
    roundTrip: false,
    pickupRequestedTime: createDateTime(7, 0),
    dropOffRequestedTime: createDateTime(8, 0),
    rideStartedActualTime: createDateTime(7, 2),
    pickupActualTime: createDateTime(7, 4),
    dropOffActualTime: createDateTime(7, 58),
    rideCompleteRequestedTime: createDateTime(8, 0),
    rideCompleteActualTime: createDateTime(7, 58),
    rideStatus: RIDE_STATUSES.RIDE_COMPLETE,
    rideRequestStatus: RIDE_REQUEST_STATUSES.RIDE_COMPLETED_SUCCESSFULLY,
    purpose: 'Doctor Appointment',
    notes: 'Early morning appointment completed successfully.'
  },
  {
    status: 'COMPLETED',
    serviceUserUuid: 'placeholder',
    serviceUserName: 'Maria Rodriguez',
    serviceUserRole: 'rider',
    pickupAddress: '444 Lexington Ave, Manhattan, NY 10017',
    dropOffAddress: '555 Madison Ave, Manhattan, NY 10022',
    assignedVehicleUuid: null,
    assignedDriverUuid: null,
    roundTrip: false,
    pickupRequestedTime: createDateTime(14, 0),
    dropOffRequestedTime: createDateTime(15, 0),
    rideStartedActualTime: createDateTime(14, 2),
    pickupActualTime: createDateTime(14, 5),
    dropOffActualTime: createDateTime(14, 59),
    rideCompleteRequestedTime: createDateTime(15, 0),
    rideCompleteActualTime: createDateTime(14, 59),
    rideStatus: RIDE_STATUSES.RIDE_COMPLETE,
    rideRequestStatus: RIDE_REQUEST_STATUSES.RIDE_COMPLETED_SUCCESSFULLY,
    purpose: 'Legal Appointment',
    notes: 'Completed successfully. On time.'
  }
];

async function seedRides() {
    try {
        console.log('\n🌱 Starting ride requests seed...\n');
        console.log('═'.repeat(90));

        const api = await generateApi();

        // RESET: Delete all existing rides
        console.log('\n🗑️  Clearing existing ride requests...');
        const existingRides = await api.getRideRequests();
        
        if (existingRides && existingRides.length > 0) {
            console.log(`   Found ${existingRides.length} existing ride(s)`);
            
            for (const ride of existingRides) {
                try {
                    await api.updateRideRequest(ride.uuid, { deleted: true });
                    // Or use deleteRideRequest if available
                    console.log(`   ✓ Deleted: Ride for ${ride.serviceUserName || 'Unknown'}`);
                } catch (error) {
                    console.log(`   ⚠️  Could not delete ride: ${error.message}`);
                }
            }
            
            console.log(`\n   ✅ Successfully cleared ${existingRides.length} ride(s)\n`);
        } else {
            console.log('   No existing rides found\n');
        }

        // First, get all existing users to map their UUIDs
        console.log('\n👥 Fetching service users for ride mapping...');
        const existingUsers = await api.getUsers();
        
        const userMap = {};
        if (existingUsers && existingUsers.length > 0) {
            existingUsers.forEach(user => {
                userMap[user.fullName] = user.uuid;
            });
            console.log(`   ✓ Found ${existingUsers.length} service users\n`);
        } else {
            console.log(`   ⚠️  No service users found. Please run seedUsers.js first!\n`);
            return;
        }

        // Fetch service providers (drivers)
        console.log('🚗 Fetching service providers for driver assignment...');
        const providers = await api.getProviders();
        
        const driverMap = {};
        const availableDrivers = [];
        if (providers && providers.length > 0) {
            providers.forEach(provider => {
                // Filter for drivers only
                if (provider.serviceProviderRole === 'Driver') {
                    driverMap[provider.fullName] = provider.uuid;
                    availableDrivers.push(provider);
                }
            });
            console.log(`   ✓ Found ${availableDrivers.length} driver(s)\n`);
        } else {
            console.log(`   ⚠️  No drivers found. Please run seedProviders.js first!\n`);
            return;
        }

        // Fetch vehicles
        console.log('🚙 Fetching vehicles for assignment...');
        const vehicles = await api.getVehicles();
        
        const availableVehicles = [];
        if (vehicles && vehicles.length > 0) {
            vehicles.forEach(vehicle => {
                availableVehicles.push(vehicle);
            });
            console.log(`   ✓ Found ${availableVehicles.length} vehicle(s)\n`);
        } else {
            console.log(`   ⚠️  No vehicles found. Please run seedVehicles.js first!\n`);
            return;
        }

        // Create new rides
        console.log('🚗 Creating fresh demo ride requests...\n');

        const createdRides = [];
        const failedRides = [];
        const ridesByStatus = {};

        let driverIndex = 0; // For round-robin driver assignment
        let vehicleIndex = 0; // For round-robin vehicle assignment

        for (const rideData of demoRides) {
            try {
                // Map serviceUserName to actual UUID
                const actualUserUuid = userMap[rideData.serviceUserName];
                
                if (!actualUserUuid) {
                    failedRides.push({ 
                        rider: rideData.serviceUserName, 
                        status: rideData.status,
                        error: `Service user "${rideData.serviceUserName}" not found in database` 
                    });
                    console.error(`❌ Skipped: ${rideData.serviceUserName.padEnd(20)} | User not found in database`);
                    continue;
                }

                // Assign driver round-robin (only for ACTIVE and COMPLETED rides, not UNASSIGNED)
                let assignedDriver = null;
                let assignedDriverUuid = null;
                
                if (rideData.status !== 'UNASSIGNED' && availableDrivers.length > 0) {
                    assignedDriver = availableDrivers[driverIndex % availableDrivers.length];
                    assignedDriverUuid = assignedDriver.uuid;
                    driverIndex++;
                }

                // Assign vehicle round-robin (only for ACTIVE and COMPLETED rides, not UNASSIGNED)
                let assignedVehicle = null;
                let assignedVehicleUuid = null;
                
                if (rideData.status !== 'UNASSIGNED' && availableVehicles.length > 0) {
                    assignedVehicle = availableVehicles[vehicleIndex % availableVehicles.length];
                    assignedVehicleUuid = assignedVehicle.uuid;
                    vehicleIndex++;
                }

                // Create ride request with proper rider array structure
                const rideWithUuid = {
                    ...rideData,
                    uuid: Date.now() + Math.floor(Math.random() * 10000),
                    serviceUserUuid: actualUserUuid, // Use actual UUID from database
                    assignedDriverUuid: assignedDriverUuid, // Assign actual driver UUID
                    assignedVehicleUuid: assignedVehicleUuid, // Assign actual vehicle UUID
                    // Transform serviceUser fields to rider array for UI compatibility
                    rider: rideData.serviceUserName ? [{
                        fullName: rideData.serviceUserName,
                        phone: '555-0100', // Default phone for demo riders
                        uuid: actualUserUuid
                    }] : [],
                    driver: assignedDriver ? [{
                        fullName: assignedDriver.fullName,
                        mobilePhone: assignedDriver.phone || '555-0200',
                        uuid: assignedDriver.uuid
                    }] : [],
                    vehicle: assignedVehicle ? [{
                        uuid: assignedVehicle.uuid,
                        displayName: assignedVehicle.displayName,
                        model: assignedVehicle.model
                    }] : []
                };

                const result = await api.addRideRequest(rideWithUuid);

                createdRides.push(rideData);

                // Group by status for summary
                if (!ridesByStatus[rideData.status]) {
                    ridesByStatus[rideData.status] = [];
                }
                ridesByStatus[rideData.status].push(rideData);

                const driverDisplay = assignedDriver ? `Driver: ${assignedDriver.fullName}` : 'No Driver';
                const vehicleDisplay = assignedVehicle ? `Vehicle: ${assignedVehicle.displayName || assignedVehicle.fleetId}` : 'No Vehicle';
                console.log(`✅ Created: ${rideData.serviceUserName.padEnd(20)} | ${rideData.status.padEnd(12)} | ${driverDisplay.padEnd(30)} | ${vehicleDisplay}`);

            } catch (error) {
                failedRides.push({ 
                    rider: rideData.serviceUserName, 
                    status: rideData.status,
                    error: error.message 
                });
                console.error(`❌ Failed: ${rideData.serviceUserName.padEnd(20)} | ${error.message}`);
            }
        }

        // Print summary
        console.log('\n' + '═'.repeat(90));
        console.log('📊 SEED SUMMARY\n');
        console.log(`✅ Successfully created: ${createdRides.length} ride(s)`);
        if (failedRides.length > 0) {
            console.log(`❌ Failed: ${failedRides.length} ride(s)\n`);
            failedRides.forEach(f => console.log(`   - ${f.rider} (${f.status}): ${f.error}`));
        }

        // Print statistics
        console.log('\n📈 RIDE STATISTICS\n');
        console.log('─'.repeat(90));

        const totalRiders = new Set(createdRides.map(r => r.serviceUserUuid)).size;
        const unassignedCount = ridesByStatus['UNASSIGNED']?.length || 0;
        const activeCount = ridesByStatus['ACTIVE']?.length || 0;
        const completedCount = ridesByStatus['COMPLETED']?.length || 0;
        const roundTripCount = createdRides.filter(r => r.roundTrip).length;

        console.log(`Total Rides Created........... ${createdRides.length}`);
        console.log(`Unique Riders................. ${totalRiders}`);
        console.log(`Round Trip Rides.............. ${roundTripCount}`);
        console.log(`One-way Rides................. ${createdRides.length - roundTripCount}`);
        console.log('');
        console.log(`Unassigned Rides.............. ${unassignedCount} 🚨`);
        console.log(`Active Rides (In Progress).... ${activeCount} 🚗`);
        console.log(`Completed Rides (Today)....... ${completedCount} ✅`);

        // Print detailed breakdown
        console.log('\n📋 RIDES BY STATUS\n');
        console.log('─'.repeat(90));

        Object.entries(ridesByStatus).forEach(([status, rides]) => {
            console.log(`\n${status}:`);
            console.log('─'.repeat(90));
            rides.forEach(ride => {
                const assigned = ride.assignedDriverUuid ? '✓' : '✗';
                console.log(`  [${assigned}] ${ride.serviceUserName.padEnd(20)} | ${ride.pickupAddress.substring(0, 40)}`);
                console.log(`       → ${ride.dropOffAddress.substring(0, 40)}`);
                console.log(`       Purpose: ${ride.purpose.padEnd(25)} Notes: ${ride.notes.substring(0, 40)}...\n`);
            });
        });

        console.log('═'.repeat(90));
        console.log('\n✨ Seed completed successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

// Run the seed
seedRides();
