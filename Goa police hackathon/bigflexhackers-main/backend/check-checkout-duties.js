require('dotenv').config({ path: './.env.local' });
const connectDB = require('./src/lib/mongodb');
const Duty = require('./src/schemas/Duty');
const Officer = require('./src/schemas/Officer');

async function checkCheckoutDuties() {
  await connectDB();
  console.log('🔍 Checking duties in Checkout Pending status...\n');

  try {
    const checkoutPendingDuties = await Duty.find({ status: 'Checkout Pending' })
      .populate('officer', 'officerId name rank role currentStatus');

    console.log(`📋 Found ${checkoutPendingDuties.length} duties in Checkout Pending status:\n`);

    if (checkoutPendingDuties.length === 0) {
      console.log('❌ No duties in Checkout Pending status found.');
      console.log('\n💡 To test checkout response:');
      console.log('1. Have an officer request checkout first');
      console.log('2. Then run the checkout response test');
      return;
    }

    checkoutPendingDuties.forEach((duty, index) => {
      console.log(`${index + 1}. Duty ID: ${duty._id}`);
      console.log(`   Officer: ${duty.officer.name} (${duty.officer.officerId})`);
      console.log(`   Duty: ${duty.bandobastName}`);
      console.log(`   Location: ${duty.post}, ${duty.zone}`);
      console.log(`   Check-in Time: ${duty.checkInTime}`);
      console.log(`   Status: ${duty.status}`);
      console.log(`   Officer Status: ${duty.officer.currentStatus}`);
      console.log('');
    });

    console.log('✅ Ready to test checkout response!');
    console.log('💡 Use any of the duty IDs above to test the endpoint.');

  } catch (error) {
    console.error('❌ Error checking checkout pending duties:', error.message);
  } finally {
    process.exit(0);
  }
}

checkCheckoutDuties();
