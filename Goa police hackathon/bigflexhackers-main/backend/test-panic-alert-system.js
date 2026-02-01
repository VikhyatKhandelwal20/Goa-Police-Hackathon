const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function testPanicAlertSystem() {
  console.log('🧪 Testing Panic Alert System...\n');

  try {
    // Step 1: Test panic alert creation
    console.log('1️⃣ Testing panic alert creation...');
    const panicResponse = await axios.post(`${API_BASE_URL}/api/alerts/panic`, {
      officerId: 'OFF_MAPUSA_PC_01',
      location: {
        lat: 15.6000,
        lon: 73.8000
      }
    });

    if (panicResponse.status === 201) {
      console.log('✅ Panic alert created successfully');
      console.log(`   Alert ID: ${panicResponse.data.alert._id}`);
      console.log(`   Officer: ${panicResponse.data.alert.officer.name}`);
      console.log(`   Status: ${panicResponse.data.alert.status}`);
      
      const alertId = panicResponse.data.alert._id;

      // Step 2: Test acknowledgment
      console.log('\n2️⃣ Testing panic alert acknowledgment...');
      const acknowledgeResponse = await axios.patch(`${API_BASE_URL}/api/alerts/acknowledge`, {
        alertId: alertId,
        supervisorId: 'SUP_PERNEM_SDPO'
      });

      if (acknowledgeResponse.status === 200) {
        console.log('✅ Panic alert acknowledged successfully');
        console.log(`   Officer: ${acknowledgeResponse.data.officerName}`);
        console.log(`   Status: ${acknowledgeResponse.data.status}`);
        console.log(`   Acknowledged At: ${acknowledgeResponse.data.acknowledgedAt}`);
      } else {
        console.log('❌ Failed to acknowledge panic alert');
      }

    } else {
      console.log('❌ Failed to create panic alert');
    }

    // Step 3: Test with different officer
    console.log('\n3️⃣ Testing panic alert with different officer...');
    const panicResponse2 = await axios.post(`${API_BASE_URL}/api/alerts/panic`, {
      officerId: 'OFF_MAPUSA_PC_02',
      location: {
        lat: 15.6000,
        lon: 73.8000
      }
    });

    if (panicResponse2.status === 201) {
      console.log('✅ Second panic alert created successfully');
      console.log(`   Alert ID: ${panicResponse2.data.alert._id}`);
      console.log(`   Officer: ${panicResponse2.data.alert.officer.name}`);
      
      // Don't acknowledge this one to test persistent alerts
      console.log('   (Leaving this alert unacknowledged for UI testing)');
    } else {
      console.log('❌ Failed to create second panic alert');
    }

    console.log('\n🎉 Panic Alert System Test Complete!');
    console.log('\n📋 Manual Testing Instructions:');
    console.log('1. Login as supervisor (SUP_PERNEM_SDPO) in browser');
    console.log('2. Check if panic alert modal appears');
    console.log('3. Verify modal shows officer details and location');
    console.log('4. Test acknowledge button functionality');
    console.log('5. Verify modal closes after acknowledgment');
    console.log('6. Test on both desktop and mobile supervisor dashboards');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testPanicAlertSystem();
