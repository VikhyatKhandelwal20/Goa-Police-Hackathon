const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Duty = require('@/schemas/Duty');

async function GET(request) {
  // Handle CORS
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  try {
    await connectDB();
    
    // Find all duties, sort by createdAt descending, limit to 20, and populate officer details
    const recentDuties = await Duty.find({})
      .populate('officer', 'officerId name rank role homePoliceStation currentStatus isActive')
      .sort({ createdAt: -1 }) // Descending order (newest first)
      .limit(20); // Limit to latest 20 results
    
    return NextResponse.json({
      message: 'Recent duties retrieved successfully',
      count: recentDuties.length,
      duties: recentDuties
    }, { headers });

  } catch (error) {
    console.error('Error fetching recent duties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
