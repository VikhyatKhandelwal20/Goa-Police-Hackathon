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

    // Find the officer and update their status to 'Off-Duty'
    const officer = await Officer.findOne({ officerId, isActive: true });
    if (!officer) {
      return NextResponse.json(
        { error: 'Officer not found or inactive' },
        { status: 404, headers }
      );
    }

    // Update officer's current status to 'Off-Duty' and clear location
    await Officer.updateOne(
      { officerId },
      { 
        currentStatus: 'Off-Duty',
        currentLocation: null
      }
    );

    // Find the most recent 'Active' duty for this officer
    const activeDuty = await Duty.findOne({ 
      officer: officer._id, 
      status: 'Active' 
    }).sort({ updatedAt: -1 });

    if (!activeDuty) {
      return NextResponse.json(
        { error: 'No active duty found for this officer' },
        { status: 404, headers }
      );
    }

    // Update the duty status to 'Completed' and set checkOutTime
    const currentTime = new Date();
    const updatedDuty = await Duty.findByIdAndUpdate(
      activeDuty._id,
      { 
        status: 'Completed',
        checkOutTime: currentTime
      },
      { new: true }
    ).populate('officer', 'name officerId rank role');

    // Emit Socket.IO event for real-time updates
    if (global.io) {
      global.io.emit('officer-went-off-duty', officerId);
      console.log('Emitted officer-went-off-duty event for officer:', officerId);
    }

    return NextResponse.json({
      message: 'Clock-out successful',
      duty: updatedDuty,
      timestamp: new Date().toISOString()
    }, { headers });

  } catch (error) {
    console.error('Clock-out error:', error);
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