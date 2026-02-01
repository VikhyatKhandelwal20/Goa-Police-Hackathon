const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Notification = require('@/schemas/Notification');
const Officer = require('@/schemas/Officer');

async function PATCH(request) {
  // Handle CORS
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    // Get officerId from request body
    const body = await request.json();
    const { officerId } = body;

    if (!officerId) {
      return NextResponse.json(
        { error: 'Officer ID is required' },
        { status: 400, headers }
      );
    }

    // Connect to database
    await connectDB();

    // Find the officer by officerId
    const officer = await Officer.findOne({ officerId: officerId });
    
    if (!officer) {
      return NextResponse.json(
        { error: 'Officer not found' },
        { status: 404, headers }
      );
    }

    // Update all notifications for this officer to mark as read
    const result = await Notification.updateMany(
      { 
        recipient: officer._id,
        isRead: false 
      },
      { 
        isRead: true 
      }
    );

    console.log(`✅ Marked ${result.modifiedCount} notifications as read for officer ${officerId}`);

    return NextResponse.json({
      message: 'Notifications marked as read successfully',
      modifiedCount: result.modifiedCount,
      officerId: officerId
    }, { headers });

  } catch (error) {
    console.error('Error marking notifications as read:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to mark notifications as read',
        details: error.message
      },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS request for CORS
async function OPTIONS(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return new NextResponse(null, { status: 200, headers });
}

module.exports = { PATCH, OPTIONS };
