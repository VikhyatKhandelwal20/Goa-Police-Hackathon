const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Officer = require('@/schemas/Officer');
const Duty = require('@/schemas/Duty');
const PanicAlert = require('@/schemas/PanicAlert');

async function GET(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    await connectDB();
    
    console.log('🗑️  Starting database reset...');
    
    // Delete all documents from specified collections
    const officerResult = await Officer.deleteMany({});
    const dutyResult = await Duty.deleteMany({});
    const panicAlertResult = await PanicAlert.deleteMany({});
    
    console.log(`✅ Database reset completed:`);
    console.log(`   - Officers deleted: ${officerResult.deletedCount}`);
    console.log(`   - Duties deleted: ${dutyResult.deletedCount}`);
    console.log(`   - Panic Alerts deleted: ${panicAlertResult.deletedCount}`);
    
    return NextResponse.json({
      message: 'Database reset completed successfully',
      deletedCounts: {
        officers: officerResult.deletedCount,
        duties: dutyResult.deletedCount,
        panicAlerts: panicAlertResult.deletedCount
      }
    }, { status: 200, headers });

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    return NextResponse.json(
      {
        error: 'Failed to reset database',
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
