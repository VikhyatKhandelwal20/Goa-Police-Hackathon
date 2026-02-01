const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Officer = require('@/schemas/Officer');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function GET(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    await connectDB();
    
    console.log('🌱 Starting officer seeding...');
    
    // Read the CSV file - look in the project root (one level up from backend)
    const csvPath = path.join(process.cwd(), '..', 'seed_data.csv');
    
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { error: 'seed_data.csv file not found in project root' },
        { status: 404, headers }
      );
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    const headers_csv = lines[0].split(',');
    
    console.log(`📄 Found CSV with ${lines.length - 1} officer records`);
    
    const createdOfficers = [];
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const officerData = {};
      
      // Map CSV columns to officer data
      headers_csv.forEach((header, index) => {
        officerData[header.trim()] = values[index] ? values[index].trim() : '';
      });
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(officerData.password, 10);
      
      // Create officer document
      const officer = new Officer({
        officerId: officerData.officerId,
        name: officerData.name,
        password: hashedPassword,
        rank: officerData.rank,
        role: officerData.role,
        homePoliceStation: officerData.homePoliceStation,
        email: officerData.email,
        contactNumber: officerData.contactNumber,
        currentStatus: 'Off-Duty',
        currentLocation: {
          lat: parseFloat(officerData.lat) || 0,
          lon: parseFloat(officerData.lon) || 0
        },
        isActive: true
      });
      
      await officer.save();
      createdOfficers.push({
        officerId: officer.officerId,
        name: officer.name,
        role: officer.role
      });
      
      console.log(`✅ Created officer: ${officer.officerId} - ${officer.name} (${officer.role})`);
    }
    
    console.log(`🎉 Officer seeding completed! Created ${createdOfficers.length} officers`);
    
    return NextResponse.json({
      message: 'Officers seeded successfully',
      count: createdOfficers.length,
      officers: createdOfficers
    }, { status: 200, headers });

  } catch (error) {
    console.error('❌ Error seeding officers:', error);
    return NextResponse.json(
      {
        error: 'Failed to seed officers',
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
