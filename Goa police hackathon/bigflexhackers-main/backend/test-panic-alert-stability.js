const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function testPanicAlertStability() {
  console.log('🧪 Testing Panic Alert Stability Fix...\n');

  try {
    // Step 1: Create multiple panic alerts to test duplicate prevention
    console.log('1️⃣ Creating multiple panic alerts to test stability...');
    
    const alerts = [];
    for (let i = 0; i < 3; i++) {
      try {
        const panicResponse = await axios.post(`${API_BASE_URL}/api/alerts/panic`, {
          officerId: 'OFF_MAPUSA_PC_01',
          location: {
            lat: 15.6000 + (i * 0.001),
            lon: 73.8000 + (i * 0.001)
          }
        });

        if (panicResponse.status === 201) {
          alerts.push(panicResponse.data.alert._id);
          console.log(`✅ Alert ${i + 1} created: ${panicResponse.data.alert._id}`);
        }
      } catch (error) {
        console.log(`❌ Alert ${i + 1} failed:`, error.response?.data || error.message);
      }
    }

    console.log(`\n📊 Created ${alerts.length} alerts total`);

    // Step 2: Test acknowledgment
    if (alerts.length > 0) {
      console.log('\n2️⃣ Testing acknowledgment of first alert...');
      const acknowledgeResponse = await axios.patch(`${API_BASE_URL}/api/alerts/acknowledge`, {
        alertId: alerts[0],
        supervisorId: 'SUP_PERNEM_SDPO'
      });

      if (acknowledgeResponse.status === 200) {
        console.log('✅ First alert acknowledged successfully');
        console.log(`   Officer: ${acknowledgeResponse.data.officerName}`);
        console.log(`   Status: ${acknowledgeResponse.data.status}`);
      } else {
        console.log('❌ Failed to acknowledge first alert');
      }
    }

    console.log('\n📋 Manual Testing Instructions:');
    console.log('1. Login as supervisor (SUP_PERNEM_SDPO) in browser');
    console.log('2. Check browser console for these messages:');
    console.log('   - "Received panic alert: [data]"');
    console.log('   - "Alert already being processed, ignoring duplicate" (for subsequent alerts)');
    console.log('   - "🚨 PANIC ALERT MODAL IS NOW VISIBLE - MUST BE ACKNOWLEDGED TO DISMISS"');
    console.log('3. Verify modal appears ONCE and stays stable');
    console.log('4. Verify modal does NOT flicker or disappear/reappear');
    console.log('5. Test acknowledge button - modal should close cleanly');
    console.log('6. Check console for: "✅ Panic alert acknowledged and cleared"');

    console.log('\n🎯 Expected Behavior:');
    console.log('✅ Modal appears once and stays visible');
    console.log('✅ No flickering or re-render loops');
    console.log('✅ Duplicate alerts are ignored');
    console.log('✅ Modal only closes on acknowledgment');
    console.log('✅ Map remains visible behind modal');
    console.log('✅ Console shows proper state management logs');

    console.log('\n⚠️  If you see multiple "Received panic alert" messages without "ignoring duplicate",');
    console.log('   the fix may not be working properly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testPanicAlertStability();
