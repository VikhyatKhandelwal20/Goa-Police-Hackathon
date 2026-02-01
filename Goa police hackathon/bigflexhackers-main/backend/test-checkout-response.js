const fetch = require('node-fetch');

async function testCheckoutResponse() {
  console.log('🧪 Testing checkout response endpoint...\n');
  
  // First, let's get a duty that's in 'Checkout Pending' status
  console.log('📋 Testing with a duty in Checkout Pending status...\n');
  
  try {
    // Test approval
    console.log('✅ Testing APPROVAL...');
    const approveResponse = await fetch('http://localhost:3000/api/duties/respond-checkout', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dutyId: '68ce9b90f90c29adc0aafa4d', // This was the duty ID from our previous test
        decision: 'approved'
      })
    });

    const approveResult = await approveResponse.json();
    
    console.log('Approval Response Status:', approveResponse.status);
    console.log('Approval Response Body:', JSON.stringify(approveResult, null, 2));
    
    if (approveResponse.ok) {
      console.log('\n✅ Checkout request approved successfully!');
      console.log(`📋 Officer: ${approveResult.officerName} (${approveResult.officerId})`);
      console.log(`📋 Duty ID: ${approveResult.dutyId}`);
      console.log(`📋 Status: ${approveResult.status}`);
      console.log(`📋 Check-out Time: ${approveResult.checkOutTime}`);
      console.log('\n📢 Check officer dashboard for the Socket.IO notification!');
    } else {
      console.log('\n❌ Checkout approval failed:', approveResult.error);
    }
    
  } catch (error) {
    console.error('❌ Approval test failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test denial with a different duty
  try {
    console.log('❌ Testing DENIAL...');
    const denyResponse = await fetch('http://localhost:3000/api/duties/respond-checkout', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dutyId: '68cebae6e30b61f91dcbb9ea', // This was the other duty ID from our previous test
        decision: 'denied',
        reason: 'Please complete additional patrol rounds before checkout'
      })
    });

    const denyResult = await denyResponse.json();
    
    console.log('Denial Response Status:', denyResponse.status);
    console.log('Denial Response Body:', JSON.stringify(denyResult, null, 2));
    
    if (denyResponse.ok) {
      console.log('\n❌ Checkout request denied successfully!');
      console.log(`📋 Officer: ${denyResult.officerName} (${denyResult.officerId})`);
      console.log(`📋 Duty ID: ${denyResult.dutyId}`);
      console.log(`📋 Status: ${denyResult.status}`);
      console.log(`📋 Reason: ${denyResult.reason}`);
      console.log('\n📢 Check officer dashboard for the Socket.IO notification!');
    } else {
      console.log('\n❌ Checkout denial failed:', denyResult.error);
    }
    
  } catch (error) {
    console.error('❌ Denial test failed:', error.message);
  }
}

testCheckoutResponse();
