require('dotenv').config({ path: './.env.local' });
const connectDB = require('./src/lib/mongodb');
const Duty = require('./src/schemas/Duty');
const Officer = require('./src/schemas/Officer');

async function createPendingRequests() {
  await connectDB();
  console.log('🔄 Creating pending checkout requests for testing...\n');

  try {
    // Find some officers to create pending requests for
    const officers = await Officer.find({ 
      role: 'Officer', 
      currentStatus: 'On-Duty' 
    }).limit(3);

    if (officers.length === 0) {
      console.log('❌ No officers found with On-Duty status. Please clock in some officers first.');
      return;
    }

    console.log(`📋 Found ${officers.length} officers to create pending requests for:\n`);

    for (const officer of officers) {
      // Create a new duty for each officer
      const dutyData = {
        officer: officer._id,
        status: 'Checkout Pending', // Set directly to Checkout Pending for testing
        checkInTime: new Date(Date.now() - Math.random() * 3600000), // Random time within last hour
        bandobastName: `Test Duty for ${officer.name}`,
        sector: `Sector ${Math.floor(Math.random() * 5) + 1}`,
        zone: `Zone ${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`,
        post: `Post ${Math.floor(Math.random() * 10) + 1}`,
        currentLocation: {
          lat: 15.4989 + (Math.random() - 0.5) * 0.01,
          lon: 73.8278 + (Math.random() - 0.5) * 0.01
        },
        dutyDate: new Date().toISOString().split('T')[0],
        shift: ['Morning', 'Afternoon', 'Night'][Math.floor(Math.random() * 3)],
        description: `Test duty assignment for ${officer.name}`,
        isOutsideGeofence: Math.random() > 0.7, // 30% chance of being outside geofence
        timeOutsideGeofenceInSeconds: Math.floor(Math.random() * 1800), // Random time up to 30 minutes
        lastLocationTimestamp: new Date()
      };

      const newDuty = new Duty(dutyData);
      await newDuty.save();

      console.log(`✅ Created pending request for ${officer.name} (${officer.officerId})`);
      console.log(`   Duty: ${dutyData.bandobastName}`);
      console.log(`   Location: ${dutyData.post}, ${dutyData.zone}`);
      console.log(`   Check-in: ${dutyData.checkInTime.toLocaleString()}`);
      console.log(`   Duty ID: ${newDuty._id}\n`);
    }

    console.log('🎉 Successfully created pending checkout requests!');
    console.log('💡 Now you can test the /api/duties/pending-requests endpoint.');

  } catch (error) {
    console.error('❌ Error creating pending requests:', error.message);
  } finally {
    process.exit(0);
  }
}

createPendingRequests();
