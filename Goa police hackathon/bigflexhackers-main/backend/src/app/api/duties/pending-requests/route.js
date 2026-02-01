const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Duty = require('@/schemas/Duty');

async function GET(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    await connectDB();
    
    // Find all duties with 'Checkout Pending' status and populate officer details
    const pendingDuties = await Duty.find({ status: 'Checkout Pending' })
      .populate('officer', 'officerId name rank role homePoliceStation email currentStatus')
      .sort({ updatedAt: -1 }); // Sort by most recent first

    // Transform the data to include relevant information
    const formattedDuties = pendingDuties.map(duty => ({
      dutyId: duty._id,
      officerId: duty.officer.officerId,
      officerName: duty.officer.name,
      officerRank: duty.officer.rank,
      officerRole: duty.officer.role,
      homePoliceStation: duty.officer.homePoliceStation,
      officerEmail: duty.officer.email,
      officerCurrentStatus: duty.officer.currentStatus,
      dutyDetails: {
        bandobastName: duty.bandobastName,
        sector: duty.sector,
        zone: duty.zone,
        post: duty.post,
        checkInTime: duty.checkInTime,
        status: duty.status,
        description: duty.description,
        dutyDate: duty.dutyDate,
        shift: duty.shift
      },
      location: duty.currentLocation,
      geofenceStatus: {
        isOutsideGeofence: duty.isOutsideGeofence,
        timeOutsideGeofenceInSeconds: duty.timeOutsideGeofenceInSeconds,
        lastLocationTimestamp: duty.lastLocationTimestamp
      },
      requestedAt: duty.updatedAt, // When the status was changed to Checkout Pending
      createdAt: duty.createdAt
    }));

    return NextResponse.json({
      message: 'Pending checkout requests retrieved successfully',
      count: formattedDuties.length,
      pendingRequests: formattedDuties
    }, { headers });

  } catch (error) {
    console.error('Error fetching pending checkout requests:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve pending checkout requests',
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
