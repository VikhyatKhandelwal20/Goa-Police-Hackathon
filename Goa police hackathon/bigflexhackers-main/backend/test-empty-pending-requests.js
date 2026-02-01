const fetch = require('node-fetch');

async function testEmptyPendingRequests() {
  console.log('🧪 Testing pending requests endpoint with empty result...\n');
  
  try {
    // First, let's clear all pending requests
    console.log('🔄 Clearing all pending requests...');
    const clearResponse = await fetch('http://localhost:3000/api/duties/clear-pending', {
      method: 'DELETE'
    });
    console.log('Clear response status:', clearResponse.status);
    
    // Now test the endpoint
    const response = await fetch('http://localhost:3000/api/duties/pending-requests', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Empty result handled correctly!');
      console.log(`📋 Total pending requests: ${result.count}`);
      
      if (result.count === 0) {
        console.log('✅ Correctly returned empty array when no pending requests exist.');
      } else {
        console.log('⚠️  Expected 0 pending requests but got:', result.count);
      }
    } else {
      console.log('\n❌ Failed to retrieve pending requests:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmptyPendingRequests();
