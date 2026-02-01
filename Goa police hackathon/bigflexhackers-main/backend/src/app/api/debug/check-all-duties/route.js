const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Duty = require('@/schemas/Duty');
const Officer = require('@/schemas/Officer');

async function GET(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    await connectDB();
    
    console.log(`🔍 Debug: Checking ALL duties in database`);
    
    // Find ALL duties in the database
    const allDuties = await Duty.find({})
      .populate('officer', 'officerId name rank role currentStatus')
      .sort({ createdAt: -1 });

    console.log(`📋 Total duties in database: ${allDuties.length}`);

    // Group by status
    const statusGroups = allDuties.reduce((acc, duty) => {
      acc[duty.status] = (acc[duty.status] || 0) + 1;
      return acc;
    }, {});

    console.log(`📊 Duty status breakdown:`, statusGroups);

    // Check for duties without assignedBy
    const dutiesWithoutSupervisor = allDuties.filter(d => !d.assignedBy);
    console.log(`⚠️  Duties without assignedBy: ${dutiesWithoutSupervisor.length}`);

    return NextResponse.json({
      message: 'All duties debug information',
      summary: {
        totalDuties: allDuties.length,
        statusBreakdown: statusGroups,
        dutiesWithoutSupervisor: dutiesWithoutSupervisor.length
      },
      duties: allDuties.map(duty => ({
        _id: duty._id,
        status: duty.status,
        officerId: duty.officer?.officerId || 'NO_OFFICER',
        officerName: duty.officer?.name || 'NO_OFFICER',
        officerStatus: duty.officer?.currentStatus || 'NO_STATUS',
        assignedBy: duty.assignedBy ? 'HAS_SUPERVISOR' : 'NO_SUPERVISOR',
        bandobastName: duty.bandobastName,
        sector: duty.sector,
        zone: duty.zone,
        post: duty.post,
        checkInTime: duty.checkInTime,
        checkOutTime: duty.checkOutTime,
        createdAt: duty.createdAt
      }))
    }, { headers });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get debug information',
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
