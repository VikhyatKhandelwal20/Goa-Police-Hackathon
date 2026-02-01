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
    
    const supervisorId = 'SUP_PERNEM_SDPO';
    
    console.log(`🔍 Debug: Testing map logic for supervisor ${supervisorId}`);
    
    // Step 1: Find the supervisor
    const supervisor = await Officer.findOne({ officerId: supervisorId, role: 'Supervisor' });
    if (!supervisor) {
      return NextResponse.json({ error: 'Supervisor not found' }, { status: 404, headers });
    }
    console.log(`✅ Step 1: Found supervisor ${supervisor.name} (${supervisor._id})`);

    // Step 2: Find duties assigned by this supervisor
    const dutiesAssignedBySupervisor = await Duty.find({ 
      assignedBy: supervisor._id
    }).populate('officer', 'officerId name rank role homePoliceStation currentStatus isActive');
    
    console.log(`✅ Step 2: Found ${dutiesAssignedBySupervisor.length} duties assigned by supervisor`);
    dutiesAssignedBySupervisor.forEach(duty => {
      console.log(`   - Duty ${duty._id}: ${duty.officer.name} (${duty.officer.officerId}) - Status: ${duty.status}, Officer Status: ${duty.officer.currentStatus}`);
    });

    // Step 3: Filter duties with status 'Active'
    const activeDuties = dutiesAssignedBySupervisor.filter(duty => duty.status === 'Active');
    console.log(`✅ Step 3: Found ${activeDuties.length} active duties`);
    activeDuties.forEach(duty => {
      console.log(`   - Active Duty: ${duty.officer.name} (${duty.officer.officerId})`);
    });

    // Step 4: Extract officers and filter by currentStatus 'On-Duty'
    const onDutyOfficers = activeDuties.map(duty => duty.officer).filter(officer => 
      officer && officer.currentStatus === 'On-Duty'
    );
    console.log(`✅ Step 4: Found ${onDutyOfficers.length} officers with On-Duty status`);
    onDutyOfficers.forEach(officer => {
      console.log(`   - On-Duty Officer: ${officer.name} (${officer.officerId})`);
    });

    // Step 5: Check what the map endpoint should return
    const mapResult = {
      message: 'On-duty officers retrieved successfully',
      supervisorId: supervisorId,
      supervisorName: supervisor.name,
      count: onDutyOfficers.length,
      officers: onDutyOfficers
    };

    return NextResponse.json({
      debug: 'Map logic test completed',
      steps: {
        supervisorFound: !!supervisor,
        supervisorId: supervisor.officerId,
        supervisorName: supervisor.name,
        totalDutiesAssigned: dutiesAssignedBySupervisor.length,
        activeDutiesCount: activeDuties.length,
        onDutyOfficersCount: onDutyOfficers.length
      },
      duties: dutiesAssignedBySupervisor.map(duty => ({
        dutyId: duty._id,
        status: duty.status,
        officerId: duty.officer.officerId,
        officerName: duty.officer.name,
        officerStatus: duty.officer.currentStatus,
        bandobastName: duty.bandobastName
      })),
      activeDuties: activeDuties.map(duty => ({
        dutyId: duty._id,
        officerId: duty.officer.officerId,
        officerName: duty.officer.name,
        officerStatus: duty.officer.currentStatus,
        bandobastName: duty.bandobastName
      })),
      onDutyOfficers: onDutyOfficers.map(officer => ({
        officerId: officer.officerId,
        name: officer.name,
        currentStatus: officer.currentStatus,
        currentLocation: officer.currentLocation
      })),
      mapEndpointResult: mapResult
    }, { headers });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json(
      {
        error: 'Failed to test map logic',
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
