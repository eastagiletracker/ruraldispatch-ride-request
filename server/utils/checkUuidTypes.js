require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const generateApi = require('../database/api');

async function checkUUIDs() {
    const api = await generateApi();

    console.log('\n=== UUID Format Check ===\n');

    const vehicles = await api.getVehicles();
    const providers = await api.getProviders();
    const rides = await api.getRideRequests();

    console.log('Vehicles:');
    vehicles.slice(0, 3).forEach(v => {
        const name = v.displayName ? v.displayName.substring(0, 30) : 'N/A';
        console.log(`  ${name} - UUID: ${v.uuid} (${typeof v.uuid})`);
    });

    console.log('\nProviders:');
    providers.slice(0, 3).forEach(p => {
        console.log(`  ${p.fullName} - UUID: ${p.uuid} (${typeof p.uuid})`);
    });

    console.log('\nRides:');
    rides.slice(0, 3).forEach(r => {
        console.log(`  Ride - UUID: ${r.uuid} (${typeof r.uuid}), Display: ${r.displayId || 'N/A'}`);
    });

    const hasNumeric = [...vehicles, ...providers, ...rides].some(item => typeof item.uuid === 'number');
    const hasString = [...vehicles, ...providers, ...rides].some(item => typeof item.uuid === 'string');

    console.log('\n=== Summary ===');
    console.log(`Has numeric UUIDs: ${hasNumeric}`);
    console.log(`Has string UUIDs: ${hasString}`);
    console.log(`Mixed formats: ${hasNumeric && hasString ? 'YES - PROBLEM!' : 'NO'}`);

    if (hasNumeric && hasString) {
        console.log('\n⚠️  SOLUTION: Run "npm run seed:reset && npm run seed:all" to fix');
    }

    process.exit(0);
}

checkUUIDs().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
