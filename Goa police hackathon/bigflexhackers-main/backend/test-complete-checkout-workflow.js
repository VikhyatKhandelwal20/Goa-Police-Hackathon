const fetch = require('node-fetch');

async function testCompleteCheckoutWorkflow() {
  console.log('🧪 Testing complete checkout workflow...\n');
  
  try {
    // Step 1: Check current pending requests
    console.log('📋 Step 1: Checking current pending requests...');
    const pendingResponse = await fetch('http://localhost:3000/api/duties/pending-requests');
    const pendingData = await pendingResponse.json();
    
    console.log(`Found ${pendingData.count} pending requests`);
    if (pendingData.count > 0) {
      console.log('Pending requests:');
      pendingData.pendingRequests.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.officerName} (${req.officerId}) - ${req.dutyDetails.post}`);
      });
    }
    
    console.log('\n' + '='.repeat(50) + '\n');

    // Step 2: Create a new checkout request
    console.log('📋 Step 2: Creating new checkout request...');
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

    // Step 3: Verify the request appears in pending requests
    console.log('📋 Step 3: Verifying request appears in pending list...');
    const updatedPendingResponse = await fetch('http://localhost:3000/api/duties/pending-requests');
    const updatedPendingData = await updatedPendingResponse.json();
    
    console.log(`Now found ${updatedPendingData.count} pending requests`);
    const newRequest = updatedPendingData.pendingRequests.find(req => req.dutyId === requestResult.dutyId);
    
    if (newRequest) {
      console.log('✅ Request found in pending list!');
      console.log(`   Officer: ${newRequest.officerName}`);
      console.log(`   Post: ${newRequest.dutyDetails.post}`);
      console.log(`   Status: ${newRequest.dutyDetails.status}`);
    } else {
      console.log('❌ Request not found in pending list');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');

    // Step 4: Supervisor approves the request
    console.log('📋 Step 4: Supervisor approves the request...');
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
    } else {
      console.log('❌ Checkout approval failed:', approveResult.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Step 5: Verify request is no longer in pending list
    console.log('📋 Step 5: Verifying request is removed from pending list...');
    const finalPendingResponse = await fetch('http://localhost:3000/api/duties/pending-requests');
    const finalPendingData = await finalPendingResponse.json();
    
    console.log(`Final pending requests count: ${finalPendingData.count}`);
    const removedRequest = finalPendingData.pendingRequests.find(req => req.dutyId === requestResult.dutyId);
    
    if (!removedRequest) {
      console.log('✅ Request successfully removed from pending list!');
    } else {
      console.log('❌ Request still in pending list');
    }

    console.log('\n🎉 Complete checkout workflow test completed!');
    console.log('📢 Check supervisor dashboard for real-time updates!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteCheckoutWorkflow();
