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
    
    console.log(`🔍 Debug: Checking raw duty data`);
    
    // Find the supervisor
    const supervisor = await Officer.findOne({ officerId: 'SUP_PERNEM_SDPO', role: 'Supervisor' });
    if (!supervisor) {
      return NextResponse.json({ error: 'Supervisor not found' }, { status: 404, headers });
    }

    console.log(`👮 Supervisor: ${supervisor.name} (${supervisor._id})`);

    // Get ALL duties without populate to see raw data
    const allDuties = await Duty.find({}).sort({ createdAt: -1 });
    
    console.log(`📋 Total duties in database: ${allDuties.length}`);

    // Check each duty's assignedBy field
    const dutyAnalysis = allDuties.map(duty => {
      const hasAssignedBy = duty.assignedBy !== undefined && duty.assignedBy !== null;
      const assignedByMatches = duty.assignedBy && duty.assignedBy.toString() === supervisor._id.toString();
      
      console.log(`Duty ${duty._id}:`);
      console.log(`  - assignedBy exists: ${hasAssignedBy}`);
      console.log(`  - assignedBy value: ${duty.assignedBy}`);
      console.log(`  - matches supervisor: ${assignedByMatches}`);
      console.log(`  - status: ${duty.status}`);
      
      return {
        dutyId: duty._id,
        status: duty.status,
        assignedBy: duty.assignedBy,
        assignedByExists: hasAssignedBy,
        assignedByMatches: assignedByMatches,
        bandobastName: duty.bandobastName
      };
    });

    // Try to find duties with assignedBy matching supervisor
    const dutiesWithSupervisor = await Duty.find({ 
      assignedBy: supervisor._id 
    });
    
    console.log(`🎯 Duties with assignedBy matching supervisor: ${dutiesWithSupervisor.length}`);

    return NextResponse.json({
      message: 'Raw duty data analysis',
      supervisor: {
        officerId: supervisor.officerId,
        name: supervisor.name,
        _id: supervisor._id.toString()
      },
      summary: {
        totalDuties: allDuties.length,
        dutiesWithSupervisor: dutiesWithSupervisor.length
      },
      dutyAnalysis: dutyAnalysis,
      dutiesWithSupervisor: dutiesWithSupervisor.map(duty => ({
        dutyId: duty._id,
        status: duty.status,
        assignedBy: duty.assignedBy,
        bandobastName: duty.bandobastName
      }))
    }, { headers });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze duty data',
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
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new NextResponse(null, { status: 200, headers });
}

module.exports = { GET, OPTIONS };
