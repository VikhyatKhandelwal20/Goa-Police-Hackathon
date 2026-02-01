const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Duty = require('@/schemas/Duty');
const Officer = require('@/schemas/Officer');

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

    // Find all duties assigned by this supervisor with status 'Active' and populate officer details
    const activeDuties = await Duty.find({ 
      assignedBy: supervisor._id,
      status: 'Active' 
    })
      .populate('officer', 'officerId name rank role homePoliceStation currentStatus isActive')
      .sort({ createdAt: -1 }); // Sort by most recent first
    
    console.log(`👮 Supervisor ${supervisor.name} has ${activeDuties.length} active duties`);
    
    return NextResponse.json({
      message: 'Active duties retrieved successfully',
      supervisorId: supervisorId,
      supervisorName: supervisor.name,
      count: activeDuties.length,
      duties: activeDuties
    }, { headers });

  } catch (error) {
    console.error('Error fetching active duties:', error);
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
