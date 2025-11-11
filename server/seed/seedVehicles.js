/**
 * Seed script to create demo vehicles
 * Run this script to populate the vehicles collection with demo data
 *
 * Usage: node server/database/seedVehicles.js
 */

require('dotenv').config({ path: '../../.env' });
const generateApi = require('../database/api');

/**
 * Demo vehicles using the new schema:
 * - displayName: Friendly name for the vehicle
 * - fleetId: Internal fleet identifier
 * - capacity: Passenger capacity
 * - serviceArea: Geographic service area
 * - accessibilityFeatures: Comma-separated list of accessibility features
 */
const demoVehicles = [
    {
        displayName: '2023 Toyota Sienna (Silver) - XYZ1234',
        fleetId: 'FLEET-001',
        capacity: 8,
        serviceArea: 'Northeast Connecticut',
        accessibilityFeatures: 'Wheelchair Accessible, Walker Accessible, Oxygen Tank Accessible'
    },
    {
        displayName: '2022 Honda Odyssey (Black) - ABC5678',
        fleetId: 'FLEET-002',
        capacity: 7,
        serviceArea: 'Northeast Connecticut',
        accessibilityFeatures: 'Wheelchair Accessible'
    },
    {
        displayName: '2021 Toyota Camry (Blue) - GHI3456',
        fleetId: 'FLEET-003',
        capacity: 5,
        serviceArea: 'Northeast Connecticut',
        accessibilityFeatures: 'None'
    },
    {
        displayName: '2023 Ford Transit (White) - DEF9012',
        fleetId: 'FLEET-004',
        capacity: 15,
        serviceArea: 'Eastern Connecticut',
        accessibilityFeatures: 'Wheelchair Accessible, Walker Accessible'
    },
    {
        displayName: '2022 Chevrolet Equinox (Gray) - JKL7890',
        fleetId: 'FLEET-005',
        capacity: 5,
        serviceArea: 'Eastern Connecticut',
        accessibilityFeatures: 'None'
    },
    {
        displayName: '2023 Mercedes-Benz Sprinter (White) - MNO1234',
        fleetId: 'FLEET-006',
        capacity: 12,
        serviceArea: 'Central Connecticut',
        accessibilityFeatures: 'Wheelchair Accessible, Oxygen Tank Accessible'
    },
    {
        displayName: '2021 Nissan NV200 (White) - PQR5678',
        fleetId: 'FLEET-007',
        capacity: 8,
        serviceArea: 'Central Connecticut',
        accessibilityFeatures: 'Wheelchair Accessible'
    },
    {
        displayName: '2022 Hyundai H350 (Green) - STU9012',
        fleetId: 'FLEET-008',
        capacity: 10,
        serviceArea: 'Statewide',
        accessibilityFeatures: 'Wheelchair Accessible, Walker Accessible'
    },
    {
        displayName: '2023 Kia Carnival (Red) - VWX3456',
        fleetId: 'FLEET-009',
        capacity: 9,
        serviceArea: 'Statewide',
        accessibilityFeatures: 'Wheelchair Accessible'
    }
];

async function seedVehicles() {
    try {
        console.log('\n🌱 Starting vehicles seed...\n');
        console.log('═'.repeat(90));

        const api = await generateApi();

        // RESET: Delete all existing vehicles
        console.log('\n🗑️  Clearing existing vehicles...');
        const existingVehicles = await api.getVehicles();

        if (existingVehicles.length > 0) {
            console.log(`   Found ${existingVehicles.length} existing vehicle(s)`);

            for (const vehicle of existingVehicles) {
                await api.deleteVehicle(vehicle.uuid);
                console.log(`   ✓ Deleted: ${vehicle.displayName || 'Unknown Vehicle'}`);
            }

            console.log(`\n   ✅ Successfully cleared ${existingVehicles.length} vehicle(s)\n`);
        } else {
            console.log('   No existing vehicles found\n');
        }

        // Create new vehicles
        console.log('🚗 Creating fresh demo vehicles...\n');

        const createdVehicles = [];
        const failedVehicles = [];

        for (const vehicleData of demoVehicles) {
            try {
                // Add UUID - using timestamp-based numeric UUID for consistency
                const vehicleWithUuid = {
                    ...vehicleData,
                    uuid: Date.now() + Math.floor(Math.random() * 1000)
                };

                // Create the vehicle
                const result = await api.addVehicle(vehicleWithUuid);

                createdVehicles.push(vehicleData);
                const accessible = vehicleData.accessibilityFeatures !== 'None' ? '♿' : '  ';
                console.log(`✅ ${accessible} ${vehicleData.displayName.padEnd(50)} | ${vehicleData.fleetId} | Cap: ${vehicleData.capacity}`);

            } catch (error) {
                failedVehicles.push({
                    vehicle: vehicleData.displayName,
                    error: error.message
                });
                console.error(`❌ Failed: ${vehicleData.displayName} | ${error.message}`);
            }
        }

        // Print summary
        console.log('\n' + '═'.repeat(90));
        console.log('📊 SEED SUMMARY\n');
        console.log(`✅ Successfully created: ${createdVehicles.length} vehicle(s)`);
        if (failedVehicles.length > 0) {
            console.log(`❌ Failed: ${failedVehicles.length} vehicle(s)\n`);
            failedVehicles.forEach(f => console.log(`   - ${f.vehicle}: ${f.error}`));
        }

        // Print fleet summary
        console.log('\n📋 FLEET DETAILS\n');
        console.log('═'.repeat(90));

        const accessibleCount = createdVehicles.filter(v => v.accessibilityFeatures !== 'None').length;
        const standardCount = createdVehicles.length - accessibleCount;
        const totalCapacity = createdVehicles.reduce((sum, v) => sum + v.capacity, 0);

        console.log(`\n📈 FLEET STATISTICS:`);
        console.log(`  Total vehicles:           ${createdVehicles.length}`);
        console.log(`  Accessible vehicles:      ${accessibleCount}`);
        console.log(`  Standard vehicles:        ${standardCount}`);
        console.log(`  Total passenger capacity: ${totalCapacity} passengers`);

        // Count by service area
        const vehiclesByArea = {};
        createdVehicles.forEach(v => {
            const area = v.serviceArea;
            if (!vehiclesByArea[area]) {
                vehiclesByArea[area] = [];
            }
            vehiclesByArea[area].push(v);
        });

        console.log(`\n📍 VEHICLES BY SERVICE AREA:\n`);
        Object.entries(vehiclesByArea).forEach(([area, vehicles]) => {
            const totalCap = vehicles.reduce((sum, v) => sum + v.capacity, 0);
            const accessibleCap = vehicles.filter(v => v.accessibilityFeatures !== 'None').length;
            console.log(`  ${area.padEnd(25)} - ${vehicles.length} vehicle(s) (${accessibleCap} accessible, ${totalCap} total capacity)`);
            vehicles.forEach(v => {
                const accessible = v.accessibilityFeatures !== 'None' ? '♿' : '';
                console.log(`      • ${v.fleetId} - ${v.displayName} - ${v.capacity} seats ${accessible}`);
            });
        });

        console.log(`\n📝 DETAILED VEHICLE LIST:\n`);
        createdVehicles.forEach((vehicle, index) => {
            console.log(`${index + 1}. ${vehicle.displayName}`);
            console.log(`   Fleet ID:       ${vehicle.fleetId}`);
            console.log(`   Capacity:       ${vehicle.capacity} passengers`);
            console.log(`   Service Area:   ${vehicle.serviceArea}`);
            console.log(`   Accessibility:  ${vehicle.accessibilityFeatures}\n`);
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
seedVehicles();
