const fetch = require('node-fetch');

async function testOfficerCheckoutFlow() {
  console.log('🧪 Testing complete officer checkout flow...\n');
  
  try {
    // Step 1: Officer requests checkout
    console.log('📋 Step 1: Officer requests checkout...');
    const requestResponse = await fetch('http://localhost:3000/api/duties/request-checkout', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ officerId: 'DEMO003' })
    });

    const requestResult = await requestResponse.json();
    console.log('Request Status:', requestResponse.status);
    console.log('Request Result:', JSON.stringify(requestResult, null, 2));
    
    if (!requestResponse.ok) {
      console.log('❌ Checkout request failed:', requestResult.error);
      return;
    }

    console.log('✅ Checkout request submitted successfully!');
    console.log(`📋 Duty ID: ${requestResult.dutyId}`);
    console.log(`📋 Officer: ${requestResult.officerName}`);
    console.log(`📋 Status: ${requestResult.status}`);
    
    console.log('\n' + '='.repeat(50) + '\n');

    // Step 2: Supervisor approves checkout
    console.log('📋 Step 2: Supervisor approves checkout...');
    const approveResponse = await fetch('http://localhost:3000/api/duties/respond-checkout', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        dutyId: requestResult.dutyId, 
        decision: 'approved' 
      })
    });

    const approveResult = await approveResponse.json();
    console.log('Approval Status:', approveResponse.status);
    console.log('Approval Result:', JSON.stringify(approveResult, null, 2));
    
    if (approveResponse.ok) {
      console.log('✅ Checkout approved successfully!');
      console.log(`📋 Final Status: ${approveResult.status}`);
      console.log(`📋 Check-out Time: ${approveResult.checkOutTime}`);
      console.log('\n📢 Check officer dashboard for Socket.IO notifications!');
    } else {
      console.log('❌ Checkout approval failed:', approveResult.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOfficerCheckoutFlow();
