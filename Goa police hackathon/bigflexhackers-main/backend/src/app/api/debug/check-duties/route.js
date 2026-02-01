const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Officer = require('@/schemas/Officer');
const Duty = require('@/schemas/Duty');

async function GET(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    await connectDB();
    
    // Get supervisorId from query parameters
    const { searchParams } = new URL(request.url);
    const supervisorId = searchParams.get('supervisorId') || 'SUP_PERNEM_SDPO';
    
    console.log(`🔍 Debug: Checking duties for supervisor ${supervisorId}`);
    
    // Find the supervisor
    const supervisor = await Officer.findOne({ officerId: supervisorId, role: 'Supervisor' });
    if (!supervisor) {
      return NextResponse.json(
        { error: 'Supervisor not found' },
        { status: 404, headers }
      );
    }

    console.log(`👮 Found supervisor: ${supervisor.name} (${supervisor._id})`);

    // Find ALL duties assigned by this supervisor
    const allDuties = await Duty.find({ assignedBy: supervisor._id })
      .populate('officer', 'officerId name rank role currentStatus')
      .sort({ createdAt: -1 });

    console.log(`📋 Total duties assigned by supervisor: ${allDuties.length}`);

    // Find duties with different statuses
    const assignedDuties = allDuties.filter(d => d.status === 'Assigned');
    const activeDuties = allDuties.filter(d => d.status === 'Active');
    const completedDuties = allDuties.filter(d => d.status === 'Completed');

    console.log(`📊 Duty breakdown:`);
    console.log(`   - Assigned: ${assignedDuties.length}`);
    console.log(`   - Active: ${activeDuties.length}`);
    console.log(`   - Completed: ${completedDuties.length}`);

    // Check officers' current status
    const officers = await Officer.find({ 
      _id: { $in: allDuties.map(d => d.officer._id) }
    });

    console.log(`👥 Officers status:`);
    officers.forEach(officer => {
      console.log(`   - ${officer.officerId} (${officer.name}): ${officer.currentStatus}`);
    });

    return NextResponse.json({
      message: 'Debug information retrieved',
      supervisor: {
        officerId: supervisor.officerId,
        name: supervisor.name,
        _id: supervisor._id
      },
      summary: {
        totalDuties: allDuties.length,
        assigned: assignedDuties.length,
        active: activeDuties.length,
        completed: completedDuties.length
      },
      duties: allDuties.map(duty => ({
        _id: duty._id,
        status: duty.status,
        officerId: duty.officer.officerId,
        officerName: duty.officer.name,
        officerStatus: duty.officer.currentStatus,
        bandobastName: duty.bandobastName,
        sector: duty.sector,
        zone: duty.zone,
        post: duty.post,
        checkInTime: duty.checkInTime,
        checkOutTime: duty.checkOutTime,
        createdAt: duty.createdAt
      })),
      officers: officers.map(officer => ({
        _id: officer._id,
        officerId: officer.officerId,
        name: officer.name,
        currentStatus: officer.currentStatus,
        currentLocation: officer.currentLocation
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
