const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Officer = require('@/schemas/Officer');
const Duty = require('@/schemas/Duty');

async function GET(request) {
  // Handle CORS
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  try {
    await connectDB();
    
    // Query 1: Count all active officers (isActive: true)
    const activeOfficersCount = await Officer.countDocuments({ isActive: true });
    
    // Query 2: Count all officers currently on duty
    const onDutyOfficersCount = await Officer.countDocuments({ currentStatus: 'On-Duty' });
    
    // Query 3: Count distinct sectors in Duties collection
    const distinctSectorsCount = await Duty.distinct('sector').then(sectors => sectors.length);
    
    // Query 4: Count distinct zones in Duties collection
    const distinctZonesCount = await Duty.distinct('zone').then(zones => zones.length);
    
    // Return the four counts in a single JSON object
    return NextResponse.json({
      activeOfficers: activeOfficersCount,
      onDutyOfficers: onDutyOfficersCount,
      distinctSectors: distinctSectorsCount,
      distinctZones: distinctZonesCount
    }, { headers });

  } catch (error) {
    console.error('Stats supervisor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS request for CORS
async function OPTIONS(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return new NextResponse(null, { status: 200, headers });
}

module.exports = { GET, OPTIONS };
