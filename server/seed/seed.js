#!/usr/bin/env node

/**
 * Master seed script - Runs all database seeds in sequence
 *
 * This script seeds user and vehicle collections:
 * 1. Admins (admin role - system management)
 * 2. Dispatchers (dispatcher role - ride coordination)
 * 3. Case Managers (case_manager role - ride requests)
 * 4. Riders (service users - requesting transportation)
 * 5. Caregivers (service users - managing rides for others)
 * 6. Drivers (service providers - providing transportation)
 * 7. Vehicles (fleet of vehicles with capabilities)
 *
 * NOTE: Ride requests are NOT seeded - add manually via web interface
 *
 * Usage:
 *   npm run seed              # Run all seeds in sequence
 *   npm run seed:admins       # Run only admins seed
 *   npm run seed:dispatchers  # Run only dispatchers seed
 *   npm run seed:case-managers # Run only case managers seed
 *   npm run seed:riders       # Run only riders seed
 *   npm run seed:caregivers   # Run only caregivers seed
 *   npm run seed:drivers      # Run only drivers seed
 *   npm run seed:vehicles     # Run only vehicles seed
 *   npm run seed:rides        # Run only rides seed (if needed)
 */

const { spawn } = require('child_process');
const path = require('path');

// Define the seed scripts to run in order - organized by role
const seeds = [
    {
        name: 'Admins',
        script: 'seedAdmins.js',
        description: 'System administrators (full access)',
        role: 'admin'
    },
    {
        name: 'Dispatchers',
        script: 'seedDispatchers.js',
        description: 'Dispatch staff (coordinate rides)',
        role: 'dispatcher'
    },
    {
        name: 'Case Managers',
        script: 'seedCaseManagers.js',
        description: 'Case managers (request rides)',
        role: 'case_manager'
    },
    {
        name: 'Riders',
        script: 'seedRiders.js',
        description: 'Service users requesting rides',
        role: 'rider'
    },
    {
        name: 'Caregivers',
        script: 'seedCaregivers.js',
        description: 'Relatives/guardians managing rides',
        role: 'caregiver'
    },
    {
        name: 'Drivers',
        script: 'seedDrivers.js',
        description: 'Service providers (transportation)',
        role: 'driver'
    },
    {
        name: 'Vehicles',
        script: 'seedVehicles.js',
        description: 'Fleet of vehicles with capabilities',
        role: 'vehicle'
    }
    // Ride Requests removed - no seed data
    // {
    //     name: 'Ride Requests',
    //     script: 'seedRides.js',
    //     description: 'Demo rides (unassigned, active, completed)',
    //     role: 'ride'
    // }
];

let currentSeedIndex = 0;

function runSeed(seedIndex) {
    if (seedIndex >= seeds.length) {
        console.log('\n' + '═'.repeat(80));
        console.log('✨ ALL SEEDS COMPLETED SUCCESSFULLY!');
        console.log('═'.repeat(80));
        console.log('\n📚 Demo Credentials Quick Reference:\n');
        
        console.log('ADMINS (Full System Access):');
        console.log('  Username: natecooper          Password: natecooper123');
        console.log('  Username: cassiebrinen        Password: cassiebrinen123');
        console.log('  Username: dominiquemorris     Password: dominiquemorris123\n');
        
        console.log('DISPATCHERS (Coordinate Rides):');
        console.log('  Username: dispatcher          Password: dispatch123\n');
        
        console.log('CASE MANAGERS (Request Rides):');
        console.log('  Username: johanguse           Password: johanguse123\n');
        
        console.log('RIDERS:');
        console.log('  - Maria Rodriguez (+12125551234)');
        console.log('  - James Wilson (+14155554444)\n');
        
        console.log('CAREGIVERS:');
        console.log('  - Sarah Johnson (+14155552222)');
        console.log('  - Emily Chen (+16465551111)\n');

        console.log('DRIVERS:');
        console.log('  - Michael Chen (Wheelchair, Long distance)');
        console.log('  - Patricia Smith (Medical appointments, Senior care)');
        console.log('  - David Martinez (Medical appointments, Bilingual)\n');

        console.log('NOTE: No ride requests seeded - add manually via the web interface.\n');
        console.log('For full details, check AUTHENTICATION.md\n');
        process.exit(0);
        return;
    }

    const seed = seeds[seedIndex];
    const seedPath = path.join(__dirname, seed.script);

    console.log('\n' + '═'.repeat(80));
    console.log(`📦 Running Seed [${seedIndex + 1}/${seeds.length}]: ${seed.name}`);
    console.log(`   ${seed.description}`);
    console.log('═'.repeat(80));

    const child = spawn('node', [seedPath], {
        stdio: 'inherit',
        cwd: __dirname
    });

    child.on('close', (code) => {
        if (code === 0) {
            console.log(`\n✅ ${seed.name} seed completed successfully\n`);
            // Run next seed
            runSeed(seedIndex + 1);
        } else {
            console.error(`\n❌ ${seed.name} seed failed with exit code ${code}`);
            process.exit(1);
        }
    });

    child.on('error', (error) => {
        console.error(`\n❌ Error running ${seed.name} seed:`, error);
        process.exit(1);
    });
}

function main() {
    console.log('\n');
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' '.repeat(20) + '🌱 DATABASE SEEDING SCRIPT 🌱' + ' '.repeat(29) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');
    console.log('\nThis script will seed user and vehicle collections (NO ride data):\n');

    seeds.forEach((seed, index) => {
        console.log(`${index + 1}. ${seed.name.padEnd(20)} - ${seed.description}`);
    });

    console.log('\n⚠️  WARNING: All existing data will be cleared before seeding.\n');
    console.log('Starting in 6 seconds...\n');

    setTimeout(() => {
        runSeed(0);
    }, 6000);
}

// Run the master seed script
main();
