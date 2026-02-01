const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function testPersistentPanicAlert() {
  console.log('🧪 Testing Persistent Panic Alert Modal...\n');

  try {
    // Create a panic alert
    console.log('1️⃣ Creating panic alert...');
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

      console.log('\n📋 Manual Testing Instructions:');
      console.log('1. Login as supervisor (SUP_PERNEM_SDPO) in browser');
      console.log('2. Check that panic alert modal appears and STAYS on screen');
      console.log('3. Try clicking outside the modal - it should NOT close');
      console.log('4. Try pressing ESC key - it should NOT close');
      console.log('5. Verify the modal has flashing red border and alarm sound');
      console.log('6. Check that modal shows warning: "This alert will remain on screen until acknowledged"');
      console.log('7. Test acknowledge button - modal should close only after acknowledgment');
      console.log('8. Test on both desktop and mobile supervisor dashboards');

      console.log('\n🎯 Expected Behavior:');
      console.log('✅ Modal appears immediately when panic alert is triggered');
      console.log('✅ Modal stays visible and cannot be dismissed by clicking outside or ESC');
      console.log('✅ Modal shows clear warning about persistence');
      console.log('✅ Modal only closes when "Acknowledge Alert" button is clicked');
      console.log('✅ Alarm sound plays continuously until acknowledged');
      console.log('✅ Modal works identically on desktop and mobile');

      console.log('\n⚠️  DO NOT acknowledge the alert yet - test the persistence first!');
      console.log(`   Alert ID: ${alertId}`);

    } else {
      console.log('❌ Failed to create panic alert');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testPersistentPanicAlert();
