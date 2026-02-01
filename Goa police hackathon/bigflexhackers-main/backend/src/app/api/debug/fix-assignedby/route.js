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
    
    console.log(`🔧 Fixing assignedBy field in database`);
    
    // Find the supervisor
    const supervisor = await Officer.findOne({ officerId: 'SUP_PERNEM_SDPO', role: 'Supervisor' });
    if (!supervisor) {
      return NextResponse.json({ error: 'Supervisor not found' }, { status: 404, headers });
    }

    console.log(`👮 Supervisor: ${supervisor.name} (${supervisor._id})`);

    // Get all duties
    const allDuties = await Duty.find({});
    console.log(`📋 Found ${allDuties.length} duties to fix`);

    let fixedCount = 0;
    const results = [];

    for (const duty of allDuties) {
      try {
        // Use MongoDB's native updateOne to add the assignedBy field
        const updateResult = await Duty.collection.updateOne(
          { _id: duty._id },
          { $set: { assignedBy: supervisor._id } }
        );

        if (updateResult.modifiedCount > 0) {
          fixedCount++;
          results.push({
            dutyId: duty._id,
            status: duty.status,
            bandobastName: duty.bandobastName,
            fixed: true
          });
          console.log(`✅ Fixed duty ${duty._id}: ${duty.bandobastName}`);
        } else {
          results.push({
            dutyId: duty._id,
            status: duty.status,
            bandobastName: duty.bandobastName,
            fixed: false,
            reason: 'No modification made'
          });
        }
      } catch (error) {
        console.error(`❌ Failed to fix duty ${duty._id}:`, error.message);
        results.push({
          dutyId: duty._id,
          status: duty.status,
          bandobastName: duty.bandobastName,
          fixed: false,
          error: error.message
        });
      }
    }

    console.log(`🎉 Fix complete: ${fixedCount}/${allDuties.length} duties fixed`);

    // Verify the fix worked
    const dutiesWithSupervisor = await Duty.find({ 
      assignedBy: supervisor._id 
    });
    console.log(`✅ Verification: ${dutiesWithSupervisor.length} duties now have assignedBy field`);

    return NextResponse.json({
      message: 'assignedBy field fix completed',
      supervisor: {
        officerId: supervisor.officerId,
        name: supervisor.name,
        _id: supervisor._id.toString()
      },
      summary: {
        totalDuties: allDuties.length,
        successfullyFixed: fixedCount,
        failedFixes: allDuties.length - fixedCount,
        verificationCount: dutiesWithSupervisor.length
      },
      results: results
    }, { headers });

  } catch (error) {
    console.error('❌ Fix error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fix assignedBy field',
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
