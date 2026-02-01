const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Notification = require('@/schemas/Notification');
const Officer = require('@/schemas/Officer');

async function GET(request) {
  // Handle CORS
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    // Get officerId from query parameters
    const { searchParams } = new URL(request.url);
    const officerId = searchParams.get('officerId');

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

    // Find all notifications for this officer, sorted by most recent
    const notifications = await Notification.find({ recipient: officer._id })
      .sort({ createdAt: -1 })
      .populate('recipient', 'officerId name')
      .lean();

    console.log(`📋 Retrieved ${notifications.length} notifications for officer ${officerId}`);

    return NextResponse.json({
      message: 'Notifications retrieved successfully',
      count: notifications.length,
      notifications: notifications
    }, { headers });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch notifications',
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
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return new NextResponse(null, { status: 200, headers });
}

module.exports = { GET, OPTIONS };
