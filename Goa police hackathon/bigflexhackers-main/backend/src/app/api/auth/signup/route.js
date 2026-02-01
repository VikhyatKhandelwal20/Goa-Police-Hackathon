const { NextResponse } = require('next/server');
const bcrypt = require('bcryptjs');
const connectDB = require('@/lib/mongodb');
const Officer = require('@/schemas/Officer');

async function POST(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    await connectDB();
    
    const { officerId, name, password, rank, homePoliceStation, email, role } = await request.json();

    // Validate required fields
    if (!officerId || !name || !password || !rank || !homePoliceStation) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: 'officerId, name, password, rank, and homePoliceStation are required'
        },
        { status: 400, headers }
      );
    }

    // Validate password length (minimum 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { 
          error: 'Password too short',
          details: 'Password must be at least 6 characters long'
        },
        { status: 400, headers }
      );
    }

    // Validate officerId length (minimum 3 characters as per existing validation)
    if (officerId.length < 3) {
      return NextResponse.json(
        { 
          error: 'Officer ID too short',
          details: 'Officer ID must be at least 3 characters long'
        },
        { status: 400, headers }
      );
    }

    // Validate rank enum
    const validRanks = ['PI', 'PSI', 'ASI', 'HC', 'PC', 'LPC'];
    if (!validRanks.includes(rank)) {
      return NextResponse.json(
        { 
          error: 'Invalid rank',
          details: `Rank must be one of: ${validRanks.join(', ')}`
        },
        { status: 400, headers }
      );
    }

    // Validate role enum
    const validRoles = ['Officer', 'Supervisor'];
    const selectedRole = role || 'Officer'; // Default to Officer if not provided
    if (!validRoles.includes(selectedRole)) {
      return NextResponse.json(
        { 
          error: 'Invalid role',
          details: `Role must be one of: ${validRoles.join(', ')}`
        },
        { status: 400, headers }
      );
    }

    // Check if officerId already exists
    const existingOfficer = await Officer.findOne({ officerId });
    if (existingOfficer) {
      return NextResponse.json(
        { 
          error: 'Officer ID already exists',
          details: 'An officer with this ID is already registered'
        },
        { status: 409, headers }
      );
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await Officer.findOne({ email });
      if (existingEmail) {
        return NextResponse.json(
          { 
            error: 'Email already exists',
            details: 'An officer with this email is already registered'
          },
          { status: 409, headers }
        );
      }
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new officer
    const newOfficer = new Officer({
      officerId,
      name,
      password: hashedPassword,
      rank,
      homePoliceStation,
      email: email || `${officerId.toLowerCase()}@police.gov.in`, // Default email if not provided
      role: selectedRole, // Use selected role
      currentStatus: 'Off-Duty',
      isActive: true
    });

    // Save to database
    const savedOfficer = await newOfficer.save();

    // Return success response (without password)
    const { password: _, ...officerWithoutPassword } = savedOfficer.toObject();

    return NextResponse.json({
      message: 'Officer registered successfully',
      officer: officerWithoutPassword
    }, { status: 201, headers });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { 
          error: 'Duplicate field',
          details: `An officer with this ${field} already exists`
        },
        { status: 409, headers }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500, headers }
    );
  }
}

async function OPTIONS(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new NextResponse(null, { status: 200, headers });
}

module.exports = { POST, OPTIONS };
