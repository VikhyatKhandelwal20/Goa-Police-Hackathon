const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function setupShowcaseData() {
  try {
    console.log('🎬 Setting up showcase data for project demonstration...\n');

    // Step 1: Reset database
    console.log('🗑️  Step 1: Resetting database...');
    const resetResponse = await axios.get(`${API_BASE_URL}/api/debug/reset-database`);
    console.log(`✅ Database reset: ${resetResponse.data.message}`);

    // Step 2: Seed officers
    console.log('\n👮 Step 2: Seeding officers...');
    const seedResponse = await axios.get(`${API_BASE_URL}/api/debug/seed-officers`);
    console.log(`✅ Officers seeded: ${seedResponse.data.count} officers created`);

    // Step 3: Upload duty roster
    console.log('\n📋 Step 3: Uploading duty roster...');
    const FormData = require('form-data');
    const fs = require('fs');
    
    const formData = new FormData();
    formData.append('dutyRoster', fs.createReadStream('../showcase_duty_roster.xlsx'));
    formData.append('supervisorId', 'SUP_PERNEM_SDPO');

    const uploadResponse = await axios.post(`${API_BASE_URL}/api/duties/upload`, formData, {
      headers: formData.getHeaders()
    });
    console.log(`✅ Duty roster uploaded: ${uploadResponse.data.message}`);

    // Step 4: Clock in some officers
    console.log('\n⏰ Step 4: Clocking in officers...');
    const officersToClockIn = [
      'OFF_MOPA_PI_01',
      'OFF_MAPUSA_PC_01', 
      'OFF_MAPUSA_PC_02',
      'OFF_PERNEM_PC_01',
      'OFF_PANAJI_PC_01'
    ];

    for (const officerId of officersToClockIn) {
      try {
        await axios.patch(`${API_BASE_URL}/api/duties/clock-in`, {
          officerId: officerId
        });
        console.log(`✅ ${officerId} clocked in successfully`);
      } catch (error) {
        console.log(`⚠️  ${officerId} clock-in failed: ${error.response?.data?.error || error.message}`);
      }
    }

    // Step 5: Create some checkout requests
    console.log('\n📝 Step 5: Creating checkout requests...');
    const officersForCheckout = ['OFF_MAPUSA_PC_02', 'OFF_PANAJI_PC_01'];
    
    for (const officerId of officersForCheckout) {
      try {
        await axios.patch(`${API_BASE_URL}/api/duties/request-checkout`, {
          officerId: officerId
        });
        console.log(`✅ ${officerId} checkout request created`);
      } catch (error) {
        console.log(`⚠️  ${officerId} checkout request failed: ${error.response?.data?.error || error.message}`);
      }
    }

    // Step 6: Update officer locations
    console.log('\n📍 Step 6: Updating officer locations...');
    const locationUpdates = [
      { officerId: 'OFF_MOPA_PI_01', lat: 15.2736, lon: 73.9589 },
      { officerId: 'OFF_MAPUSA_PC_01', lat: 15.6000, lon: 73.8000 },
      { officerId: 'OFF_MAPUSA_PC_02', lat: 15.6000, lon: 73.8000 },
      { officerId: 'OFF_PERNEM_PC_01', lat: 15.4989, lon: 73.8278 },
      { officerId: 'OFF_PANAJI_PC_01', lat: 15.4909, lon: 73.8279 }
    ];

    for (const update of locationUpdates) {
      try {
        await axios.post(`${API_BASE_URL}/api/location/update`, {
          officerId: update.officerId,
          lat: update.lat,
          lon: update.lon
        });
        console.log(`✅ ${update.officerId} location updated`);
      } catch (error) {
        console.log(`⚠️  ${update.officerId} location update failed: ${error.response?.data?.error || error.message}`);
      }
    }

    console.log('\n🎉 SHOWCASE DATA SETUP COMPLETE!');
    console.log('\n📋 Testing Credentials:');
    console.log('👮 SUPERVISORS:');
    console.log('   • Rakesh Kumar (SUP_PERNEM_SDPO) - admin123');
    console.log('   • Priya Sharma (SUP_MAPUSA_SDPO) - admin123');
    console.log('\n👮 OFFICERS:');
    console.log('   • Anjali Sharma (OFF_MOPA_PI_01) - police123');
    console.log('   • Suresh Patil (OFF_MAPUSA_PC_01) - police123');
    console.log('   • Rajesh Kumar (OFF_MAPUSA_PC_02) - police123');
    console.log('   • Amit Verma (OFF_PERNEM_PC_01) - police123');
    console.log('   • Vikram Joshi (OFF_PANAJI_PC_01) - police123');
    console.log('\n🚀 Ready for showcase demonstration!');

  } catch (error) {
    console.error('❌ Setup failed:', error.response ? error.response.data : error.message);
  }
}

setupShowcaseData();
