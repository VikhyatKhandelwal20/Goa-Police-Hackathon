const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Officer = require('@/schemas/Officer');
const Duty = require('@/schemas/Duty');

async function PATCH(request) {
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

    // Find the officer
    const officer = await Officer.findOne({ officerId });
    if (!officer) {
      return NextResponse.json(
        { error: 'Officer not found' },
        { status: 404, headers }
      );
    }

    // Find the officer's currently active duty
    const activeDuty = await Duty.findOne({
      officer: officer._id,
      status: 'Active'
    }).populate('officer', 'officerId name rank role homePoliceStation');

    if (!activeDuty) {
      return NextResponse.json(
        { error: 'No active duty found for this officer' },
        { status: 404, headers }
      );
    }

    // Update the duty status to 'Checkout Pending'
    activeDuty.status = 'Checkout Pending';
    await activeDuty.save();

    // Initialize Socket.IO server (reuse existing instance if available)
    let io;
    try {
      // Try to get existing Socket.IO instance from global
      io = global.io;
      if (!io) {
        console.log('⚠️  Socket.IO server not available for checkout request notification');
      }
    } catch (error) {
      console.log('⚠️  Socket.IO server not available for checkout request notification');
    }

    // Emit Socket.IO event to supervisors
    if (io) {
      io.emit('new-checkout-request', {
        dutyId: activeDuty._id,
        officerId: officer.officerId,
        officerName: officer.name,
        officerRank: officer.rank,
        dutyDetails: {
          bandobastName: activeDuty.bandobastName,
          sector: activeDuty.sector,
          zone: activeDuty.zone,
          post: activeDuty.post,
          checkInTime: activeDuty.checkInTime,
          status: activeDuty.status
        },
        requestedAt: new Date()
      });
      console.log(`📢 Checkout request notification sent for officer ${officerId}`);
    }

    return NextResponse.json({
      message: 'Checkout request submitted successfully',
      dutyId: activeDuty._id,
      officerId: officer.officerId,
      officerName: officer.name,
      status: activeDuty.status,
      requestedAt: new Date()
    }, { headers });

  } catch (error) {
    console.error('Error processing checkout request:', error);
    return NextResponse.json(
      {
        error: 'Failed to process checkout request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500, headers }
    );
  }
}

async function OPTIONS(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new NextResponse(null, { status: 200, headers });
}

module.exports = { PATCH, OPTIONS };
