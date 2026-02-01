const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Officer = require('@/schemas/Officer');
const { verifyPassword } = require('@/lib/auth');

async function POST(request) {
  // Handle CORS
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  try {
    await connectDB();
    
    const { officerId, password } = await request.json();

    if (!officerId || !password) {
      return NextResponse.json(
        { error: 'Officer ID and password are required' },
        { status: 400, headers }
      );
    }

    const officer = await Officer.findOne({ officerId, isActive: true });
    
    if (!officer) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401, headers }
      );
    }

    const isPasswordValid = await verifyPassword(password, officer.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401, headers }
      );
    }

    // Return the full officer object including their role
    return NextResponse.json({
      message: 'Login successful',
      officer: {
        _id: officer._id,
        officerId: officer.officerId,
        name: officer.name,
        rank: officer.rank,
        role: officer.role,
        homePoliceStation: officer.homePoliceStation,
        currentStatus: officer.currentStatus,
        isActive: officer.isActive,
        createdAt: officer.createdAt,
        updatedAt: officer.updatedAt
      }
    }, { headers });

  } catch (error) {
    console.error('Login error:', error);
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
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return new NextResponse(null, { status: 200, headers });
}

module.exports = { POST, OPTIONS };
