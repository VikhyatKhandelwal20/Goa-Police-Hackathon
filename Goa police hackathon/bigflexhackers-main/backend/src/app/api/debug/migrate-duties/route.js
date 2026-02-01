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
    
    console.log(`🔄 Starting duty migration to add assignedBy field`);
    
    // Find the supervisor
    const supervisor = await Officer.findOne({ officerId: 'SUP_PERNEM_SDPO', role: 'Supervisor' });
    if (!supervisor) {
      return NextResponse.json(
        { error: 'Supervisor SUP_PERNEM_SDPO not found' },
        { status: 404, headers }
      );
    }

    console.log(`👮 Found supervisor: ${supervisor.name} (${supervisor._id})`);

    // Find all duties that don't have assignedBy field
    const dutiesToMigrate = await Duty.find({ 
      assignedBy: { $exists: false } 
    }).populate('officer', 'officerId name');

    console.log(`📋 Found ${dutiesToMigrate.length} duties to migrate`);

    let migratedCount = 0;
    const migrationResults = [];

    for (const duty of dutiesToMigrate) {
      try {
        // Update the duty to add assignedBy field
        await Duty.findByIdAndUpdate(duty._id, {
          assignedBy: supervisor._id
        });

        migratedCount++;
        migrationResults.push({
          dutyId: duty._id,
          officerId: duty.officer.officerId,
          officerName: duty.officer.name,
          status: duty.status,
          bandobastName: duty.bandobastName,
          migrated: true
        });

        console.log(`✅ Migrated duty for ${duty.officer.name} (${duty.officer.officerId})`);
      } catch (error) {
        console.error(`❌ Failed to migrate duty ${duty._id}:`, error.message);
        migrationResults.push({
          dutyId: duty._id,
          officerId: duty.officer.officerId,
          officerName: duty.officer.name,
          status: duty.status,
          migrated: false,
          error: error.message
        });
      }
    }

    console.log(`🎉 Migration complete: ${migratedCount}/${dutiesToMigrate.length} duties migrated`);

    return NextResponse.json({
      message: 'Duty migration completed',
      supervisor: {
        officerId: supervisor.officerId,
        name: supervisor.name,
        _id: supervisor._id
      },
      summary: {
        totalDutiesFound: dutiesToMigrate.length,
        successfullyMigrated: migratedCount,
        failedMigrations: dutiesToMigrate.length - migratedCount
      },
      results: migrationResults
    }, { headers });

  } catch (error) {
    console.error('❌ Migration error:', error);
    return NextResponse.json(
      {
        error: 'Failed to migrate duties',
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
