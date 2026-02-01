require('dotenv').config({ path: './.env.local' });
const connectDB = require('./src/lib/mongodb');
const PanicAlert = require('./src/schemas/PanicAlert');
const Officer = require('./src/schemas/Officer');
const mongoose = require('mongoose');

async function testAcknowledgePanicAlert() {
  await connectDB();
  console.log('🔧 Testing Panic Alert Acknowledge Endpoint...\n');

  try {
    // Find the most recent panic alert
    const recentAlert = await PanicAlert.findOne({ status: 'Active' }).populate('officer', 'officerId name rank homePoliceStation email currentStatus');
    
    if (!recentAlert) {
      console.log('❌ No active panic alerts found. Please trigger a panic alert first.');
      return;
    }

    console.log('📋 Found active panic alert:');
    console.log(`   Alert ID: ${recentAlert._id}`);
    console.log(`   Officer: ${recentAlert.officer.name} (${recentAlert.officer.officerId})`);
    console.log(`   Status: ${recentAlert.status}`);
    console.log(`   Location: ${recentAlert.location.lat}, ${recentAlert.location.lon}`);
    console.log(`   Triggered At: ${recentAlert.createdAt}\n`);

    // Test the acknowledge endpoint
    const response = await fetch('http://localhost:3000/api/alerts/acknowledge', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alertId: recentAlert._id.toString()
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Panic alert acknowledged successfully!');
      console.log('📋 Response:');
      console.log(`   Alert ID: ${data.alertId}`);
      console.log(`   Officer: ${data.officerName} (${data.officerId})`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Acknowledged At: ${data.acknowledgedAt}`);
    } else {
      console.log('❌ Failed to acknowledge panic alert:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error}`);
    }

    // Verify the alert was updated in the database
    const updatedAlert = await PanicAlert.findById(recentAlert._id);
    console.log('\n🔍 Database verification:');
    console.log(`   Status: ${updatedAlert.status}`);
    console.log(`   Acknowledged By: ${updatedAlert.acknowledgedBy || 'Not specified'}`);

  } catch (error) {
    console.error('❌ Error testing acknowledge endpoint:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testAcknowledgePanicAlert();
