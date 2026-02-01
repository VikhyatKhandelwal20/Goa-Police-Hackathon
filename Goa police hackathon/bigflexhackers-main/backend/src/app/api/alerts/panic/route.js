const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Officer = require('@/schemas/Officer');
const Duty = require('@/schemas/Duty');
const PanicAlert = require('@/schemas/PanicAlert');
const { Server } = require('socket.io');

async function POST(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    await connectDB();
    const { officerId, location } = await request.json();

    // Validate required fields
    if (!officerId) {
      return NextResponse.json(
        { error: 'Officer ID is required' },
        { status: 400, headers }
      );
    }

    // Use provided location or default to Goa coordinates if not provided
    const alertLocation = location && location.lat && location.lon 
      ? location 
      : { lat: 15.6000, lon: 73.8000 }; // Default Goa coordinates

    // Find the officer
    const officer = await Officer.findOne({ officerId, isActive: true });
    if (!officer) {
      return NextResponse.json(
        { error: 'Officer not found or inactive' },
        { status: 404, headers }
      );
    }

    // Find the officer's current active duty
    const currentDuty = await Duty.findOne({
      officer: officer._id,
      status: { $in: ['Active', 'Checkout Pending'] }
    });

    // Create new panic alert
    const panicAlertData = {
      officer: officer._id,
      location: {
        lat: alertLocation.lat,
        lon: alertLocation.lon
      },
      status: 'Active'
    };

    const newPanicAlert = new PanicAlert(panicAlertData);
    const savedPanicAlert = await newPanicAlert.save();

    // Populate the officer details for the response and Socket.IO event
    const populatedPanicAlert = await PanicAlert.findById(savedPanicAlert._id)
      .populate('officer', 'officerId name rank homePoliceStation currentStatus email')
      .populate('acknowledgedBy', 'officerId name rank homePoliceStation');

    // Emit Socket.IO event to all supervisors
    let io;
    try {
      io = global.io;
      if (io) {
        io.emit('panic-alert-triggered', {
          alertId: populatedPanicAlert._id,
          officer: {
            officerId: populatedPanicAlert.officer.officerId,
            name: populatedPanicAlert.officer.name,
            rank: populatedPanicAlert.officer.rank,
            homePoliceStation: populatedPanicAlert.officer.homePoliceStation,
            currentStatus: populatedPanicAlert.officer.currentStatus,
            email: populatedPanicAlert.officer.email
          },
          duty: currentDuty ? {
            bandobastName: currentDuty.bandobastName,
            sector: currentDuty.sector,
            zone: currentDuty.zone,
            post: currentDuty.post,
            status: currentDuty.status
          } : null,
          location: populatedPanicAlert.location,
          status: populatedPanicAlert.status,
          acknowledgedBy: populatedPanicAlert.acknowledgedBy,
          triggeredAt: populatedPanicAlert.createdAt,
          priority: 'HIGH'
        });
        console.log(`🚨 Panic alert triggered by officer ${officerId} and broadcasted to supervisors`);
      } else {
        console.log('⚠️  Socket.IO server not available for panic alert broadcast');
      }
    } catch (socketError) {
      console.error('Socket.IO error emitting panic-alert-triggered:', socketError);
    }

    return NextResponse.json({
      message: 'Panic alert created successfully',
      alert: {
        alertId: populatedPanicAlert._id,
        officer: {
          officerId: populatedPanicAlert.officer.officerId,
          name: populatedPanicAlert.officer.name,
          rank: populatedPanicAlert.officer.rank,
          homePoliceStation: populatedPanicAlert.officer.homePoliceStation,
          currentStatus: populatedPanicAlert.officer.currentStatus
        },
        location: populatedPanicAlert.location,
        status: populatedPanicAlert.status,
        triggeredAt: populatedPanicAlert.createdAt
      }
    }, { status: 201, headers });

  } catch (error) {
    console.error('Error creating panic alert:', error);
    return NextResponse.json(
      {
        error: 'Failed to create panic alert',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500, headers }
    );
  }
}

async function OPTIONS(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new NextResponse(null, { status: 200, headers });
}

module.exports = { POST, OPTIONS };
