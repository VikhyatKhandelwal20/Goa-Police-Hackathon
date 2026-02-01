#!/bin/bash

echo "🧪 Testing Excel Upload Endpoint with curl"
echo "=========================================="
echo ""

# Create a simple test Excel file
echo "📊 Creating test Excel file..."
node -e "
const XLSX = require('xlsx');
const sampleData = [
  ['Officer ID', 'Duty Name', 'Sector', 'Zone', 'Post', 'Duty Date', 'Shift', 'Latitude', 'Longitude', 'Description'],
  ['DEMO001', 'Festival Security', 'Panaji', 'Zone A', 'Market Post', '2024-01-15', 'Morning', '15.4989', '73.8278', 'Security duty at Panaji Market'],
  ['DEMO002', 'Traffic Management', 'Margao', 'Zone B', 'Bus Stand Post', '2024-01-15', 'Evening', '15.2736', '73.9589', 'Traffic control at Margao Bus Stand'],
  ['DEMO003', 'Beach Patrol', 'Vasco', 'Zone C', 'Railway Post', '2024-01-15', 'Night', '15.4989', '73.8278', 'Night patrol at Vasco Railway Station']
];
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
XLSX.utils.book_append_sheet(workbook, worksheet, 'Duty Roster');
XLSX.writeFile(workbook, 'test-duty-roster.xlsx');
console.log('✅ Test Excel file created: test-duty-roster.xlsx');
"

echo ""
echo "📤 Testing upload endpoint..."
echo ""

# Test the upload endpoint
curl -X POST http://localhost:3000/api/duties/upload \
  -F "dutyRoster=@test-duty-roster.xlsx" \
  -H "Content-Type: multipart/form-data" \
  | jq '.'

echo ""
echo "🧹 Cleaning up test file..."
rm -f test-duty-roster.xlsx
echo "✅ Test completed!"
