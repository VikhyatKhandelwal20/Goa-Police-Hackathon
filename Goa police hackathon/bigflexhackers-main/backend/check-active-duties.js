require('dotenv').config({ path: './.env.local' });
const connectDB = require('./src/lib/mongodb');
const Duty = require('./src/schemas/Duty');
const Officer = require('./src/schemas/Officer');

async function checkActiveDuties() {
  await connectDB();
  console.log('🔍 Checking for active duties...\n');

  try {
    const activeDuties = await Duty.find({ status: 'Active' })
      .populate('officer', 'officerId name rank role');

    console.log(`📋 Found ${activeDuties.length} active duties:\n`);

    if (activeDuties.length === 0) {
      console.log('❌ No active duties found. Officers need to clock in first.');
      console.log('\n💡 To test checkout request:');
      console.log('1. Have an officer clock in for a duty');
      console.log('2. Then run the checkout request test');
      return;
    }

    activeDuties.forEach((duty, index) => {
      console.log(`${index + 1}. Officer: ${duty.officer.name} (${duty.officer.officerId})`);
      console.log(`   Duty: ${duty.bandobastName}`);
      console.log(`   Location: ${duty.post}, ${duty.zone}`);
      console.log(`   Check-in Time: ${duty.checkInTime}`);
      console.log(`   Status: ${duty.status}`);
      console.log('');
    });

    console.log('✅ Ready to test checkout request!');
    console.log('💡 Use any of the officer IDs above to test the endpoint.');

  } catch (error) {
    console.error('❌ Error checking active duties:', error.message);
  } finally {
    process.exit(0);
  }
}

checkActiveDuties();
