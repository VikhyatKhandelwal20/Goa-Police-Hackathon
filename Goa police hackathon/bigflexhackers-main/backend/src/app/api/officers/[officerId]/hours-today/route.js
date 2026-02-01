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

    // Calculate the time 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const currentTime = new Date();

    // Find all duties for this officer created within the last 24 hours
    const duties = await Duty.find({
      officer: officer._id,
      createdAt: { $gte: twentyFourHoursAgo }
    }).sort({ createdAt: -1 });

    let totalDurationMs = 0;
    const dutyDetails = [];

    // Calculate duration for each duty
    duties.forEach(duty => {
      const checkInTime = new Date(duty.checkInTime);
      let durationMs = 0;

      // Skip duties with invalid checkInTime (like Unix epoch 1970-01-01)
      if (checkInTime.getTime() <= 0 || checkInTime.getFullYear() < 2020) {
        console.log(`Skipping duty ${duty._id} with invalid checkInTime: ${duty.checkInTime}`);
        return;
      }

      if (duty.checkOutTime) {
        // Duty is completed - duration is checkOutTime - checkInTime
        const checkOutTime = new Date(duty.checkOutTime);
        durationMs = checkOutTime - checkInTime;
      } else {
        // Duty is still active - duration is current time - checkInTime
        durationMs = currentTime - checkInTime;
      }

      // Only add positive durations (skip negative or invalid durations)
      if (durationMs > 0) {
        totalDurationMs += durationMs;

        dutyDetails.push({
          dutyId: duty._id,
          post: duty.post,
          zone: duty.zone,
          status: duty.status,
          checkInTime: checkInTime,
          checkOutTime: duty.checkOutTime ? new Date(duty.checkOutTime) : null,
          durationMs: durationMs,
          durationHours: durationMs / (1000 * 60 * 60)
        });
      }
    });

    // Convert total duration from milliseconds to hours
    const totalHours = totalDurationMs / (1000 * 60 * 60);

    // Round to the nearest 0.5
    const roundedHours = Math.round(totalHours * 2) / 2;

    return NextResponse.json({
      message: 'Hours worked in last 24 hours calculated successfully',
      officerId: officerId,
      officerName: officer.name,
      timeRange: {
        from: twentyFourHoursAgo.toISOString(),
        to: currentTime.toISOString(),
        hoursAgo: 24
      },
      summary: {
        totalHours: roundedHours,
        totalHoursRaw: Math.round(totalHours * 100) / 100,
        dutiesCount: duties.length,
        totalDurationMs: totalDurationMs
      },
      duties: dutyDetails
    }, { headers });

  } catch (error) {
    console.error('Error calculating hours worked:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate hours worked',
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
