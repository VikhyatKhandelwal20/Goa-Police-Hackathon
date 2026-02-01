const { NextResponse } = require('next/server');
const XLSX = require('xlsx');
const connectDB = require('@/lib/mongodb');
const Officer = require('@/schemas/Officer');
const Duty = require('@/schemas/Duty');
const Notification = require('@/schemas/Notification');
const { sendDutyNotificationEmail } = require('@/config/email');
const { Server } = require('socket.io');

async function POST(request) {
  // Handle CORS
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  try {
    // Get form data from Next.js request
    const formData = await request.formData();
    const file = formData.get('dutyRoster');
    const supervisorId = formData.get('supervisorId');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded. Please provide a file with field name "dutyRoster"' },
        { status: 400, headers }
      );
    }

    if (!supervisorId) {
      return NextResponse.json(
        { error: 'Supervisor ID is required. Please provide supervisorId in form data.' },
        { status: 400, headers }
      );
    }

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Only Excel files (.xlsx, .xls) are allowed' },
        { status: 400, headers }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    
    // Parse Excel file using xlsx
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert worksheet to JSON array
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Use first row as headers
      defval: '', // Default value for empty cells
      raw: false // Convert all values to strings
    });

    // If we have data, use first row as headers and convert to objects
    let parsedData = [];
    if (jsonData.length > 0) {
      const headers = jsonData[0];
      parsedData = jsonData.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          if (header) { // Only include non-empty headers
            obj[header] = row[index] || '';
          }
        });
        return obj;
      });
    }

    console.log(`✅ Successfully parsed Excel file: ${file.name}`);
    console.log(`📊 Found ${parsedData.length} rows of data`);
    console.log(`📋 Headers: ${Object.keys(parsedData[0] || {}).join(', ')}`);

    // Connect to database
    await connectDB();

    // Find the supervisor who is making the assignment
    const supervisor = await Officer.findOne({ officerId: supervisorId, role: 'Supervisor' });
    if (!supervisor) {
      return NextResponse.json(
        { error: 'Supervisor not found or invalid supervisor ID' },
        { status: 404, headers }
      );
    }

    console.log(`👮 Supervisor ${supervisor.name} (${supervisor.officerId}) is assigning duties`);

    // Initialize Socket.IO server (reuse existing instance if available)
    let io;
    try {
      // Try to get existing Socket.IO instance from global
      io = global.io;
      if (!io) {
        console.log('⚠️  Socket.IO server not available for notifications');
      }
    } catch (error) {
      console.log('⚠️  Socket.IO server not available for notifications');
    }

    // Process each row and create duty assignments
    let successfulAssignments = 0;
    let unfoundOfficerIds = [];
    let createdDuties = [];

    console.log('\n🔄 Processing duty assignments...');

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      
      // Skip empty rows
      if (!row || Object.keys(row).length === 0) {
        continue;
      }

      // Extract officerId from the row (assuming it's in the first column or has a specific key)
      const officerId = row['Officer ID'] || row['officerId'] || row['OfficerID'] || Object.values(row)[0];
      
      if (!officerId) {
        console.log(`⚠️  Row ${i + 1}: No officer ID found, skipping`);
        continue;
      }

      try {
        // Find the officer in the database
        const officer = await Officer.findOne({ officerId: officerId.toString() });
        
        if (!officer) {
          console.log(`❌ Officer not found: ${officerId}`);
          unfoundOfficerIds.push(officerId);
          continue;
        }

        // Create duty assignment data
        const dutyData = {
          officer: officer._id,
          assignedBy: supervisor._id, // Add the supervisor who assigned this duty
          status: 'Assigned',
          bandobastName: row['Duty Name'] || row['Bandobast'] || row['Event'] || 'Duty Assignment',
          sector: row['Sector'] || row['Area'] || 'General',
          zone: row['Zone'] || row['District'] || 'Zone A',
          post: row['Post'] || row['Location'] || row['Station'] || 'Post 1',
          currentLocation: {
            lat: parseFloat(row['Latitude'] || row['Lat'] || '15.4989'),
            lon: parseFloat(row['Longitude'] || row['Lon'] || '73.8278')
          },
          dutyDate: row['Duty Date'] || row['Date'] || new Date().toISOString().split('T')[0],
          shift: row['Shift'] || row['Time'] || 'General',
          description: row['Description'] || row['Notes'] || '',
          isOutsideGeofence: false,
          timeOutsideGeofenceInSeconds: 0,
          lastLocationTimestamp: new Date()
        };

        // Create and save the duty
        const newDuty = new Duty(dutyData);
        await newDuty.save();
        
        // Create notification for the officer
        try {
          const notificationData = {
            recipient: officer._id,
            type: 'New Duty',
            message: `New duty assigned: ${dutyData.post} in ${dutyData.zone}`,
            isRead: false
          };
          
          const newNotification = new Notification(notificationData);
          await newNotification.save();
          
          // Emit Socket.IO event to the specific officer
          if (io) {
            io.emit('new-notification', {
              notificationId: newNotification._id,
              recipient: officer.officerId,
              type: newNotification.type,
              message: newNotification.message,
              isRead: newNotification.isRead,
              createdAt: newNotification.createdAt
            });
            console.log(`📢 Socket.IO notification sent to officer ${officerId}`);
          }
          
          // Send email notification
          try {
            const emailResult = await sendDutyNotificationEmail(
              officer.name,
              officer.email,
              dutyData
            );
            
            if (emailResult.success) {
              console.log(`📧 Email notification sent to ${officer.email}`);
            } else {
              console.log(`⚠️  Email notification failed for ${officer.email}: ${emailResult.error}`);
            }
          } catch (emailError) {
            console.log(`⚠️  Email notification error for ${officer.email}: ${emailError.message}`);
          }
          
        } catch (notificationError) {
          console.error(`⚠️  Failed to create notification for officer ${officerId}:`, notificationError.message);
          // Don't fail the entire process if notification creation fails
        }
        
        createdDuties.push({
          dutyId: newDuty._id,
          officerId: officerId,
          officerName: officer.name,
          bandobastName: dutyData.bandobastName,
          sector: dutyData.sector,
          zone: dutyData.zone,
          post: dutyData.post,
          dutyDate: dutyData.dutyDate,
          shift: dutyData.shift
        });

        successfulAssignments++;
        console.log(`✅ Created duty for ${officer.name} (${officerId}): ${dutyData.bandobastName}`);

      } catch (error) {
        console.error(`❌ Error creating duty for officer ${officerId}:`, error.message);
        unfoundOfficerIds.push(officerId);
      }
    }

    console.log(`\n📊 Processing complete:`);
    console.log(`   ✅ Successful assignments: ${successfulAssignments}`);
    console.log(`   ❌ Unfound officers: ${unfoundOfficerIds.length}`);
    console.log(`   📋 Unfound officer IDs: ${unfoundOfficerIds.join(', ')}`);

    return NextResponse.json({
      message: 'Duty assignments processed successfully',
      fileName: file.name,
      fileSize: file.size,
      totalRows: parsedData.length,
      successfulAssignments: successfulAssignments,
      unfoundOfficerIds: unfoundOfficerIds,
      createdDuties: createdDuties,
      summary: {
        totalProcessed: parsedData.length,
        successful: successfulAssignments,
        failed: unfoundOfficerIds.length,
        successRate: `${Math.round((successfulAssignments / parsedData.length) * 100)}%`
      }
    }, { headers });

  } catch (error) {
    console.error('Error parsing Excel file:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to parse Excel file',
        details: error.message
      },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS request for CORS
async function OPTIONS(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return new NextResponse(null, { status: 200, headers });
}

module.exports = { POST, OPTIONS };
