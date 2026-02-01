const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function createTestPanicAlert() {
  console.log('🚨 Creating new test panic alert...\n');

  try {
    const panicResponse = await axios.post(`${API_BASE_URL}/api/alerts/panic`, {
      officerId: 'OFF_MAPUSA_PC_01',
      location: {
        lat: 15.6000,
        lon: 73.8000
      }
    });

    if (panicResponse.status === 201) {
      console.log('✅ New panic alert created successfully!');
      console.log(`   Alert ID: ${panicResponse.data.alert._id}`);
      console.log(`   Officer: ${panicResponse.data.alert.officer.name}`);
      console.log(`   Status: ${panicResponse.data.alert.status}`);
      console.log(`   Triggered At: ${new Date(panicResponse.data.alert.triggeredAt).toLocaleString()}`);
      
      console.log('\n📋 Now you can test the modal:');
      console.log('1. Refresh the supervisor dashboard page');
      console.log('2. The modal should appear with this new alert');
      console.log('3. Test if it still flashes with animate-pulse');
      console.log('4. Test the acknowledge button');
      
      return panicResponse.data.alert._id;
    } else {
      console.log('❌ Failed to create panic alert');
    }

  } catch (error) {
    console.error('❌ Error creating panic alert:', error.response?.data || error.message);
  }
}

// Run the function
createTestPanicAlert();
