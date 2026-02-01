const fetch = require('node-fetch');

async function testCheckoutResponseErrors() {
  console.log('🧪 Testing checkout response endpoint error cases...\n');
  
  // Test 1: Missing dutyId
  console.log('❌ Test 1: Missing dutyId...');
  try {
    const response = await fetch('http://localhost:3000/api/duties/respond-checkout', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approved' })
    });
    const result = await response.json();
    console.log('Status:', response.status, 'Error:', result.error);
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 2: Invalid decision
  console.log('\n❌ Test 2: Invalid decision...');
  try {
    const response = await fetch('http://localhost:3000/api/duties/respond-checkout', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dutyId: '68cebae6e30b61f91dcbb9ea', decision: 'maybe' })
    });
    const result = await response.json();
    console.log('Status:', response.status, 'Error:', result.error);
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 3: Invalid dutyId
  console.log('\n❌ Test 3: Invalid dutyId...');
  try {
    const response = await fetch('http://localhost:3000/api/duties/respond-checkout', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dutyId: 'invalid123', decision: 'approved' })
    });
    const result = await response.json();
    console.log('Status:', response.status, 'Error:', result.error);
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 4: Duty not in Checkout Pending status
  console.log('\n❌ Test 4: Duty not in Checkout Pending status...');
  try {
    const response = await fetch('http://localhost:3000/api/duties/respond-checkout', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dutyId: '68cebae6e30b61f91dcbb9ea', decision: 'approved' })
    });
    const result = await response.json();
    console.log('Status:', response.status, 'Error:', result.error);
  } catch (error) {
    console.log('Error:', error.message);
  }

  console.log('\n✅ Error testing completed!');
}

testCheckoutResponseErrors();
