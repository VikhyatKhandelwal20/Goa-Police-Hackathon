const fetch = require('node-fetch');

async function testCheckoutRequest() {
  console.log('🧪 Testing checkout request endpoint...\n');
  
  try {
    // Test with DEMO003 (Amit Patel) who should have an active duty
    const response = await fetch('http://localhost:3000/api/duties/request-checkout', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        officerId: 'INVALID'
      })
    });

    const result = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Checkout request submitted successfully!');
      console.log(`📋 Officer: ${result.officerName} (${result.officerId})`);
      console.log(`📋 Duty ID: ${result.dutyId}`);
      console.log(`📋 Status: ${result.status}`);
      console.log(`📋 Requested At: ${result.requestedAt}`);
      console.log('\n📢 Check your supervisor dashboard for the Socket.IO notification!');
    } else {
      console.log('\n❌ Checkout request failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCheckoutRequest();
