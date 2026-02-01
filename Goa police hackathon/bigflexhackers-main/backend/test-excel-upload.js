const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3000/api';

async function testExcelUpload() {
  try {
    console.log('🧪 Testing Excel Upload Endpoint...\n');

    // Create a sample Excel file for testing
    const XLSX = require('xlsx');
    
    // Sample duty roster data with comprehensive fields
    const sampleData = [
      ['Officer ID', 'Duty Name', 'Sector', 'Zone', 'Post', 'Duty Date', 'Shift', 'Latitude', 'Longitude', 'Description'],
      ['DEMO001', 'Festival Security', 'Panaji', 'Zone A', 'Market Post', '2024-01-15', 'Morning', '15.4989', '73.8278', 'Security duty at Panaji Market during festival'],
      ['DEMO002', 'Traffic Management', 'Margao', 'Zone B', 'Bus Stand Post', '2024-01-15', 'Evening', '15.2736', '73.9589', 'Traffic control at Margao Bus Stand'],
      ['DEMO003', 'Beach Patrol', 'Vasco', 'Zone C', 'Railway Post', '2024-01-15', 'Night', '15.4989', '73.8278', 'Night patrol at Vasco Railway Station'],
      ['DEMO999', 'Unknown Officer', 'Test', 'Zone X', 'Test Post', '2024-01-16', 'Morning', '15.5000', '73.8000', 'This officer should not be found'],
      ['DEMO001', 'Second Duty', 'Panaji', 'Zone A', 'University Post', '2024-01-16', 'Evening', '15.4989', '73.8278', 'Second duty for DEMO001']
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Duty Roster');

    // Write to file
    const fileName = 'sample-duty-roster.xlsx';
    const filePath = path.join(__dirname, fileName);
    XLSX.writeFile(workbook, filePath);
    
    console.log(`✅ Created sample Excel file: ${fileName}`);

    // Test the upload endpoint
    console.log('📤 Testing upload endpoint...');
    
    const formData = new FormData();
    formData.append('dutyRoster', fs.createReadStream(filePath), {
      filename: fileName,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const response = await fetch(`${API_BASE_URL}/duties/upload`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Upload failed: ${error.error}`);
    }

    const result = await response.json();
    
    console.log('✅ Upload successful!');
    console.log('\n📊 Upload Results:');
    console.log(`   File: ${result.fileName}`);
    console.log(`   Size: ${result.fileSize} bytes`);
    console.log(`   Total Rows: ${result.totalRows}`);
    console.log(`   Successful Assignments: ${result.successfulAssignments}`);
    console.log(`   Unfound Officers: ${result.unfoundOfficerIds.length}`);
    console.log(`   Success Rate: ${result.summary.successRate}`);
    
    if (result.unfoundOfficerIds.length > 0) {
      console.log(`\n❌ Unfound Officer IDs: ${result.unfoundOfficerIds.join(', ')}`);
    }
    
    console.log('\n📋 Created Duties:');
    result.createdDuties.forEach((duty, index) => {
      console.log(`   ${index + 1}. ${duty.officerName} (${duty.officerId})`);
      console.log(`      Duty: ${duty.bandobastName}`);
      console.log(`      Sector: ${duty.sector}, Zone: ${duty.zone}, Post: ${duty.post}`);
      console.log(`      Date: ${duty.dutyDate}, Shift: ${duty.shift}`);
      console.log('');
    });

    // Clean up test file
    fs.unlinkSync(filePath);
    console.log('\n🧹 Cleaned up test file');

    console.log('\n🎉 Excel upload endpoint is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure backend server is running: npm run dev');
    console.log('2. Check if the endpoint is accessible: http://localhost:3000/api/duties/upload');
    console.log('3. Verify multer and xlsx libraries are installed');
  }
}

testExcelUpload();
