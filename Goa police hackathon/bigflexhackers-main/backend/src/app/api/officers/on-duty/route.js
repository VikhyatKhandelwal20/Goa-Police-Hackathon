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
    
    // Get supervisorId from query parameters
    const { searchParams } = new URL(request.url);
    const supervisorId = searchParams.get('supervisorId');
    
    if (!supervisorId) {
      return NextResponse.json(
        { error: 'Supervisor ID is required as query parameter' },
        { status: 400, headers }
      );
    }

    // Find the supervisor
    const supervisor = await Officer.findOne({ officerId: supervisorId, role: 'Supervisor' });
    if (!supervisor) {
      return NextResponse.json(
        { error: 'Supervisor not found' },
        { status: 404, headers }
      );
    }

    // Find duties assigned by this supervisor that are currently active
    const activeDuties = await Duty.find({ 
      assignedBy: supervisor._id,
      status: 'Active'
    }).populate('officer', 'officerId name rank homePoliceStation currentStatus currentLocation');

    // Extract officers from active duties
    const onDutyOfficers = activeDuties.map(duty => duty.officer).filter(officer => 
      officer && officer.currentStatus === 'On-Duty'
    );
    
    console.log(`🗺️  Supervisor ${supervisor.name} can see ${onDutyOfficers.length} officers on map`);
    
    return NextResponse.json({
      message: 'On-duty officers retrieved successfully',
      supervisorId: supervisorId,
      supervisorName: supervisor.name,
      count: onDutyOfficers.length,
      officers: onDutyOfficers
    }, { headers });

  } catch (error) {
    console.error('Error fetching on-duty officers:', error);
    
    // Return empty array instead of error to prevent frontend crashes
    return NextResponse.json({
      message: 'Database connection issue - returning empty list',
      count: 0,
      officers: []
    }, { status: 200, headers });
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
