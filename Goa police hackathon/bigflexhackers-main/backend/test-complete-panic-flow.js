require('dotenv').config({ path: './.env.local' });
const { io } = require('socket.io-client');

console.log('🚨 Testing Complete Panic Alert Flow...\n');

// Test Socket.IO connection
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server');
  
  // Test panic alert creation
  testPanicAlert();
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from Socket.IO server');
});

socket.on('connect_error', (error) => {
  console.log('❌ Socket.IO connection error:', error.message);
});

// Listen for panic alert events
socket.on('panic-alert-triggered', (data) => {
  console.log('📡 Received panic-alert-triggered event:');
  console.log(`   Alert ID: ${data.alertId}`);
  console.log(`   Officer: ${data.officer.name} (${data.officer.officerId})`);
  console.log(`   Location: ${data.location.lat}, ${data.location.lon}`);
  console.log(`   Status: ${data.status}`);
  console.log(`   Priority: ${data.priority}`);
  console.log(`   Triggered At: ${data.triggeredAt}`);
  
  // Test acknowledge after receiving the event
  setTimeout(() => {
    testAcknowledgeAlert(data.alertId);
  }, 2000);
});

async function testPanicAlert() {
  try {
    console.log('🚨 Triggering panic alert...');
    
    const response = await fetch('http://localhost:3000/api/alerts/panic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        officerId: 'OFF003',
        location: {
          lat: 15.4989,
          lon: 73.8278
        }
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Panic alert created successfully!');
      console.log(`   Alert ID: ${data.alertId}`);
      console.log(`   Officer: ${data.officer.name}`);
      console.log(`   Status: ${data.status}`);
    } else {
      console.log('❌ Failed to create panic alert:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.error('❌ Error creating panic alert:', error.message);
  }
}

async function testAcknowledgeAlert(alertId) {
  try {
    console.log('\n🔧 Testing acknowledge alert...');
    
    const response = await fetch('http://localhost:3000/api/alerts/acknowledge', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alertId: alertId
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Panic alert acknowledged successfully!');
      console.log(`   Alert ID: ${data.alertId}`);
      console.log(`   Officer: ${data.officerName}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Acknowledged At: ${data.acknowledgedAt}`);
    } else {
      console.log('❌ Failed to acknowledge panic alert:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error}`);
    }
    
    // Close socket and exit
    setTimeout(() => {
      socket.disconnect();
      console.log('\n🎉 Complete panic alert flow test finished!');
      process.exit(0);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error acknowledging panic alert:', error.message);
    socket.disconnect();
    process.exit(1);
  }
}

// Set timeout to prevent hanging
setTimeout(() => {
  console.log('⏰ Test timeout - closing connection');
  socket.disconnect();
  process.exit(1);
}, 10000);
