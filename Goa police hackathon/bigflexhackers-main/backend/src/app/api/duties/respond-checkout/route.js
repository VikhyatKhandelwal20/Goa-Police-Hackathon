const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Officer = require('@/schemas/Officer');
const Duty = require('@/schemas/Duty');

async function PATCH(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    await connectDB();
    const { dutyId, decision, reason } = await request.json();

    if (!dutyId) {
      return NextResponse.json(
        { error: 'Duty ID is required' },
        { status: 400, headers }
      );
    }

    if (!decision || !['approved', 'denied'].includes(decision)) {
      return NextResponse.json(
        { error: 'Decision must be either "approved" or "denied"' },
        { status: 400, headers }
      );
    }

    // Find the duty by ID
    const duty = await Duty.findById(dutyId).populate('officer', 'officerId name email currentStatus currentLocation');
    
    if (!duty) {
      return NextResponse.json(
        { error: 'Duty not found' },
        { status: 404, headers }
      );
    }

    // Check if duty is in 'Checkout Pending' status
    if (duty.status !== 'Checkout Pending') {
      return NextResponse.json(
        { error: 'Duty is not in checkout pending status' },
        { status: 400, headers }
      );
    }

    // Initialize Socket.IO server (reuse existing instance if available)
    let io;
    try {
      io = global.io;
      if (!io) {
        console.log('⚠️  Socket.IO server not available for checkout response notification');
      }
    } catch (error) {
      console.log('⚠️  Socket.IO server not available for checkout response notification');
    }

    if (decision === 'approved') {
      // Approve checkout request
      duty.status = 'Completed';
      duty.checkOutTime = new Date();
      await duty.save();

      // Update officer status and location
      const officer = await Officer.findById(duty.officer._id);
      if (officer) {
        officer.currentStatus = 'Off-Duty';
        officer.currentLocation = null;
        await officer.save();
      }

      // Emit checkout approved event to the officer
      if (io) {
        // Target the specific officer by their officerId
        io.to(`officer-${duty.officer.officerId}`).emit('checkout-approved', {
          dutyId: duty._id,
          officerId: duty.officer.officerId,
          officerName: duty.officer.name,
          dutyDetails: {
            bandobastName: duty.bandobastName,
            sector: duty.sector,
            zone: duty.zone,
            post: duty.post,
            checkInTime: duty.checkInTime,
            checkOutTime: duty.checkOutTime,
            status: duty.status
          },
          approvedAt: new Date()
        });
        console.log(`📢 Checkout approved notification sent to officer ${duty.officer.officerId}`);
      }

      return NextResponse.json({
        message: 'Checkout request approved successfully',
        dutyId: duty._id,
        officerId: duty.officer.officerId,
        officerName: duty.officer.name,
        status: duty.status,
        checkOutTime: duty.checkOutTime,
        approvedAt: new Date()
      }, { headers });

    } else if (decision === 'denied') {
      // Deny checkout request
      duty.status = 'Active';
      await duty.save();

      // Emit checkout denied event to the officer
      if (io) {
        // Target the specific officer by their officerId
        io.to(`officer-${duty.officer.officerId}`).emit('checkout-denied', {
          dutyId: duty._id,
          officerId: duty.officer.officerId,
          officerName: duty.officer.name,
          dutyDetails: {
            bandobastName: duty.bandobastName,
            sector: duty.sector,
            zone: duty.zone,
            post: duty.post,
            checkInTime: duty.checkInTime,
            status: duty.status
          },
          reason: reason || 'No reason provided',
          deniedAt: new Date()
        });
        console.log(`📢 Checkout denied notification sent to officer ${duty.officer.officerId}`);
      }

      return NextResponse.json({
        message: 'Checkout request denied successfully',
        dutyId: duty._id,
        officerId: duty.officer.officerId,
        officerName: duty.officer.name,
        status: duty.status,
        reason: reason || 'No reason provided',
        deniedAt: new Date()
      }, { headers });
    }

  } catch (error) {
    console.error('Error processing checkout response:', error);
    return NextResponse.json(
      {
        error: 'Failed to process checkout response',
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
