const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Duty = require('@/schemas/Duty');
const Officer = require('@/schemas/Officer');

async function GET(request, { params }) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    await connectDB();
    
    const { officerId } = await params;

    if (!officerId) {
      return NextResponse.json(
        { error: 'Officer ID is required' },
        { status: 400, headers }
      );
    }

    // Verify that the officer exists
    const officer = await Officer.findOne({ officerId });
    if (!officer) {
      return NextResponse.json(
        { error: 'Officer not found' },
        { status: 404, headers }
      );
    }

    // Find all duties assigned to the officer, sorted by creation date (descending), limited to 20
    const duties = await Duty.find({ officer: officer._id })
      .populate('officer', 'officerId name rank homePoliceStation email currentStatus')
      .sort({ createdAt: -1 })
      .limit(20);

    // Format the response
    const formattedDuties = duties.map(duty => ({
      dutyId: duty._id,
      officerId: duty.officer.officerId,
      officerName: duty.officer.name,
      officerRank: duty.officer.rank,
      homePoliceStation: duty.officer.homePoliceStation,
      officerEmail: duty.officer.email,
      officerCurrentStatus: duty.officer.currentStatus,
      dutyDetails: {
        bandobastName: duty.bandobastName,
        sector: duty.sector,
        zone: duty.zone,
        post: duty.post,
        status: duty.status,
        checkInTime: duty.checkInTime,
        checkOutTime: duty.checkOutTime,
        description: duty.description,
        dutyDate: duty.dutyDate,
        shift: duty.shift,
      },
      location: duty.currentLocation,
      geofenceStatus: {
        isOutsideGeofence: duty.isOutsideGeofence,
        timeOutsideGeofenceInSeconds: duty.timeOutsideGeofenceInSeconds,
        lastLocationTimestamp: duty.lastLocationTimestamp,
      },
      timestamps: {
        createdAt: duty.createdAt,
        updatedAt: duty.updatedAt,
      }
    }));

    return NextResponse.json({
      message: 'Officer duties retrieved successfully',
      officerId: officerId,
      officerName: officer.name,
      count: formattedDuties.length,
      duties: formattedDuties
    }, { headers });

  } catch (error) {
    console.error('Error fetching officer duties:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve officer duties',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500, headers }
    );
  }
}

async function OPTIONS(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new NextResponse(null, { status: 200, headers });
}

module.exports = { GET, OPTIONS };
