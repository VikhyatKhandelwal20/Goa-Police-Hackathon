const fetch = require('node-fetch');

async function testPendingRequests() {
  console.log('🧪 Testing pending checkout requests endpoint...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/duties/pending-requests', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Pending requests retrieved successfully!');
      console.log(`📋 Total pending requests: ${result.count}`);
      
      if (result.pendingRequests && result.pendingRequests.length > 0) {
        console.log('\n📋 Pending Requests Details:');
        result.pendingRequests.forEach((request, index) => {
          console.log(`\n${index + 1}. Officer: ${request.officerName} (${request.officerId})`);
          console.log(`   Rank: ${request.officerRank}`);
          console.log(`   Duty: ${request.dutyDetails.bandobastName}`);
          console.log(`   Location: ${request.dutyDetails.post}, ${request.dutyDetails.zone}`);
          console.log(`   Check-in Time: ${request.dutyDetails.checkInTime}`);
          console.log(`   Requested At: ${request.requestedAt}`);
          console.log(`   Duty ID: ${request.dutyId}`);
        });
      } else {
        console.log('\n📋 No pending checkout requests found.');
      }
    } else {
      console.log('\n❌ Failed to retrieve pending requests:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPendingRequests();
