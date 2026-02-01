const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Officer = require('@/schemas/Officer');
const Duty = require('@/schemas/Duty');

async function PATCH(request) {
  // Handle CORS
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  try {
    await connectDB();
    
    const { officerId } = await request.json();
    
    if (!officerId) {
      return NextResponse.json(
        { error: 'Officer ID is required' },
        { status: 400, headers }
      );
    }

    // Find the officer and update their status to 'On-Duty'
    const officer = await Officer.findOne({ officerId, isActive: true });
    if (!officer) {
      return NextResponse.json(
        { error: 'Officer not found or inactive' },
        { status: 404, headers }
      );
    }

    // Check if officer already has an 'Active' duty
    const activeDuty = await Duty.findOne({ 
      officer: officer._id, 
      status: 'Active' 
    });

    if (activeDuty) {
      return NextResponse.json(
        { 
          error: 'Officer is already on active duty',
          details: `Currently active on: ${activeDuty.post} in ${activeDuty.zone}`,
          activeDuty: {
            post: activeDuty.post,
            zone: activeDuty.zone,
            checkInTime: activeDuty.checkInTime
          }
        },
        { status: 400, headers }
      );
    }

    // Update officer's current status to 'On-Duty'
    await Officer.updateOne(
      { officerId },
      { currentStatus: 'On-Duty' }
    );

    // Find the most recent 'Assigned' duty for this officer
    const assignedDuty = await Duty.findOne({ 
      officer: officer._id, 
      status: 'Assigned' 
    }).sort({ createdAt: -1 });

    if (!assignedDuty) {
      return NextResponse.json(
        { error: 'No assigned duty found for this officer' },
        { status: 404, headers }
      );
    }

    // Update the duty status to 'Active' and set checkInTime
    const currentTime = new Date();
    const updatedDuty = await Duty.findByIdAndUpdate(
      assignedDuty._id,
      { 
        status: 'Active',
        checkInTime: currentTime
      },
      { new: true }
    ).populate('officer', 'name officerId rank role');

    return NextResponse.json({
      message: 'Clock-in successful',
      duty: updatedDuty
    }, { headers });

  } catch (error) {
    console.error('Clock-in error:', error);
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
  headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return new NextResponse(null, { status: 200, headers });
}

module.exports = { PATCH, OPTIONS };
