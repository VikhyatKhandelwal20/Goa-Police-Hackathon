const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Demo Excel Upload...\n');

// Check if demo file exists
const demoFile = path.join(__dirname, 'demo-duty-roster.xlsx');
if (!fs.existsSync(demoFile)) {
  console.log('❌ Demo file not found. Please create it first.');
  process.exit(1);
}

// Get file stats
const stats = fs.statSync(demoFile);
console.log('📁 Demo file found:');
console.log(`   File: ${path.basename(demoFile)}`);
console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
console.log(`   Created: ${stats.birthtime.toLocaleString()}\n`);

// Test upload endpoint
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUpload() {
  try {
    console.log('📤 Testing upload endpoint...');
    
    const formData = new FormData();
    formData.append('dutyRoster', fs.createReadStream(demoFile));
    
    const response = await fetch('http://localhost:3000/api/duties/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Upload successful!');
      console.log(`   📊 Total rows: ${result.totalRows}`);
      console.log(`   ✅ Successful: ${result.successfulAssignments}`);
      console.log(`   ❌ Failed: ${result.unfoundOfficerIds.length}`);
      console.log(`   📈 Success rate: ${result.summary.successRate}`);
      
      if (result.unfoundOfficerIds.length > 0) {
        console.log(`   ⚠️  Unfound officers: ${result.unfoundOfficerIds.join(', ')}`);
      }
      
      console.log('\n📋 Created duties:');
      result.createdDuties.forEach((duty, index) => {
        console.log(`   ${index + 1}. ${duty.officerName} (${duty.officerId})`);
        console.log(`      Duty: ${duty.bandobastName}`);
        console.log(`      Location: ${duty.sector}, ${duty.zone}, ${duty.post}`);
        console.log(`      Date: ${duty.dutyDate} (${duty.shift})`);
        console.log('');
      });
      
    } else {
      const error = await response.text();
      console.log('❌ Upload failed:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${error}`);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure backend server is running: npm run dev');
    console.log('2. Check if the endpoint is accessible: http://localhost:3000/api/duties/upload');
    console.log('3. Verify demo officers exist in database');
  }
}

// Run the test
testUpload();
