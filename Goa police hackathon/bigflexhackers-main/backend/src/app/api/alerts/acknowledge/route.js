const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const PanicAlert = require('@/schemas/PanicAlert');
const Officer = require('@/schemas/Officer');

async function PATCH(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    await connectDB();
    const { alertId, supervisorId } = await request.json();

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400, headers }
      );
    }

    // Find the panic alert
    const panicAlert = await PanicAlert.findById(alertId).populate('officer', 'officerId name rank homePoliceStation email currentStatus');

    if (!panicAlert) {
      return NextResponse.json(
        { error: 'Panic alert not found' },
        { status: 404, headers }
      );
    }

    if (panicAlert.status === 'Acknowledged') {
      return NextResponse.json(
        { error: 'Alert has already been acknowledged' },
        { status: 400, headers }
      );
    }

    // Find supervisor if supervisorId is provided
    let acknowledgedBy = null;
    if (supervisorId) {
      const supervisor = await Officer.findOne({ officerId: supervisorId, role: 'Supervisor' });
      if (supervisor) {
        acknowledgedBy = supervisor._id;
      }
    }

    // Update the panic alert status
    const updatedAlert = await PanicAlert.findByIdAndUpdate(
      alertId,
      { 
        status: 'Acknowledged',
        acknowledgedBy: acknowledgedBy
      },
      { new: true }
    ).populate('officer', 'officerId name rank homePoliceStation email currentStatus');

    return NextResponse.json({
      message: 'Panic alert acknowledged successfully',
      alertId: updatedAlert._id,
      officerId: updatedAlert.officer.officerId,
      officerName: updatedAlert.officer.name,
      status: updatedAlert.status,
      acknowledgedAt: new Date(),
    }, { headers });

  } catch (error) {
    console.error('Error acknowledging panic alert:', error);
    return NextResponse.json(
      {
        error: 'Failed to acknowledge panic alert',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500, headers }
    );
  }
}

async function OPTIONS(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new NextResponse(null, { status: 200, headers });
}

module.exports = { PATCH, OPTIONS };
