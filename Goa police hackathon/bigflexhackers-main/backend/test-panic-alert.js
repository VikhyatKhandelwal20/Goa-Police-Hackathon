require('dotenv').config({ path: './.env.local' });

const testPanicAlert = async () => {
  console.log('🚨 Testing Panic Alert Endpoint...\n');

  const testData = {
    officerId: 'OFF003', // Using Vikram Patel as test officer
    location: {
      lat: 15.4989,
      lon: 73.8278
    }
  };

  try {
    const response = await fetch('http://localhost:3000/api/alerts/panic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Panic alert created successfully!');
      console.log('📋 Alert Details:');
      console.log(`   Alert ID: ${result.alert.alertId}`);
      console.log(`   Officer: ${result.alert.officer.name} (${result.alert.officer.officerId})`);
      console.log(`   Rank: ${result.alert.officer.rank}`);
      console.log(`   Location: ${result.alert.location.lat}, ${result.alert.location.lon}`);
      console.log(`   Status: ${result.alert.status}`);
      console.log(`   Triggered At: ${result.alert.triggeredAt}`);
      console.log('\n📡 Socket.IO event "panic-alert-triggered" should have been broadcasted to supervisors');
    } else {
      console.error('❌ Failed to create panic alert:');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${result.error}`);
      if (result.details) {
        console.error(`   Details: ${result.details}`);
      }
    }

  } catch (error) {
    console.error('❌ Error testing panic alert:', error.message);
  }
};

// Test with invalid data
const testInvalidPanicAlert = async () => {
  console.log('\n🧪 Testing with invalid data...\n');

  const invalidData = {
    officerId: 'INVALID_OFFICER',
    location: {
      lat: 15.4989,
      lon: 73.8278
    }
  };

  try {
    const response = await fetch('http://localhost:3000/api/alerts/panic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.log('✅ Invalid data properly rejected:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error}`);
    } else {
      console.log('❌ Invalid data was not properly rejected');
    }

  } catch (error) {
    console.error('❌ Error testing invalid panic alert:', error.message);
  }
};

// Test with missing location
const testMissingLocation = async () => {
  console.log('\n🧪 Testing with missing location...\n');

  const invalidData = {
    officerId: 'OFF003',
    location: {
      lat: 15.4989
      // Missing lon
    }
  };

  try {
    const response = await fetch('http://localhost:3000/api/alerts/panic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.log('✅ Missing location properly rejected:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error}`);
    } else {
      console.log('❌ Missing location was not properly rejected');
    }

  } catch (error) {
    console.error('❌ Error testing missing location:', error.message);
  }
};

// Run all tests
const runTests = async () => {
  await testPanicAlert();
  await testInvalidPanicAlert();
  await testMissingLocation();
  
  console.log('\n🎉 Panic alert testing completed!');
  console.log('\n📝 Note: Make sure the backend server is running on port 3000');
  console.log('📝 Note: Supervisors should receive Socket.IO "panic-alert-triggered" events');
};

runTests();
