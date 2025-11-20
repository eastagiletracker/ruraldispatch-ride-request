import generateApi from '../database/prismaApi.js';

async function testLogin() {
  const api = await generateApi();

  console.log('\n🔍 Testing login for natecooper...\n');

  // Get all system users
  const allUsers = await api.getAllSystemUsers();
  console.log(`📊 Total system users in database: ${allUsers.length}`);

  // Find natecooper
  const nate = allUsers.find(u => u.username === 'natecooper');
  if (nate) {
    console.log('\n✅ User found:');
    console.log(`   Username: ${nate.username}`);
    console.log(`   Full Name: ${nate.fullName}`);
    console.log(`   Role: ${nate.role}`);
    console.log(`   Active: ${nate.isActive}`);
    console.log(`   Password Hash: ${nate.passwordHash.substring(0, 20)}...`);
  } else {
    console.log('\n❌ User natecooper NOT FOUND in database');
    console.log('\nAvailable users:');
    allUsers.forEach(u => console.log(`   - ${u.username} (${u.role})`));
  }

  // Test authentication
  console.log('\n🔐 Testing authentication...\n');
  const result = await api.authenticateSystemUser('natecooper', 'natecooper123');

  if (result.success) {
    console.log('✅ Authentication SUCCESS');
    console.log('   User:', result.user.fullName);
    console.log('   Role:', result.user.role);
  } else {
    console.log('❌ Authentication FAILED');
    console.log('   Message:', result.message);
  }

  process.exit(0);
}

testLogin().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
