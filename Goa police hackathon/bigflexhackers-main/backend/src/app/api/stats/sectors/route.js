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
    
    // Get all duties with officer information
    const duties = await Duty.find({}).populate('officer', 'name officerId rank');
    
    // Group by sectors
    const sectorData = {};
    duties.forEach(duty => {
      if (!sectorData[duty.sector]) {
        sectorData[duty.sector] = {
          name: duty.sector,
          zones: new Set(),
          activeDuties: 0,
          assignedDuties: 0,
          completedDuties: 0,
          cancelledDuties: 0,
          officers: new Set(),
          zoneDetails: {}
        };
      }
      
      const sector = sectorData[duty.sector];
      sector.zones.add(duty.zone);
      sector.officers.add(duty.officer.name);
      
      // Count duties by status
      if (duty.status === 'Active') sector.activeDuties++;
      else if (duty.status === 'Assigned') sector.assignedDuties++;
      else if (duty.status === 'Completed') sector.completedDuties++;
      else if (duty.status === 'Cancelled') sector.cancelledDuties++;
      
      // Store zone details
      if (!sector.zoneDetails[duty.zone]) {
        sector.zoneDetails[duty.zone] = {
          name: duty.zone,
          duties: [],
          officers: new Set(),
          activeDuties: 0,
          assignedDuties: 0,
          completedDuties: 0,
          cancelledDuties: 0
        };
      }
      
      const zone = sector.zoneDetails[duty.zone];
      zone.duties.push({
        id: duty._id,
        bandobastName: duty.bandobastName,
        post: duty.post,
        status: duty.status,
        officer: {
          name: duty.officer.name,
          officerId: duty.officer.officerId,
          rank: duty.officer.rank
        },
        checkInTime: duty.checkInTime,
        checkOutTime: duty.checkOutTime
      });
      
      zone.officers.add(duty.officer.name);
      
      if (duty.status === 'Active') zone.activeDuties++;
      else if (duty.status === 'Assigned') zone.assignedDuties++;
      else if (duty.status === 'Completed') zone.completedDuties++;
      else if (duty.status === 'Cancelled') zone.cancelledDuties++;
    });
    
    // Convert to array format for frontend
    const sectors = Object.values(sectorData).map(sector => ({
      name: sector.name,
      totalZones: sector.zones.size,
      totalOfficers: sector.officers.size,
      activeDuties: sector.activeDuties,
      assignedDuties: sector.assignedDuties,
      completedDuties: sector.completedDuties,
      cancelledDuties: sector.cancelledDuties,
      totalDuties: sector.activeDuties + sector.assignedDuties + sector.completedDuties + sector.cancelledDuties,
      zones: Object.values(sector.zoneDetails).map(zone => ({
        name: zone.name,
        totalOfficers: zone.officers.size,
        activeDuties: zone.activeDuties,
        assignedDuties: zone.assignedDuties,
        completedDuties: zone.completedDuties,
        cancelledDuties: zone.cancelledDuties,
        totalDuties: zone.activeDuties + zone.assignedDuties + zone.completedDuties + zone.cancelledDuties,
        duties: zone.duties
      }))
    }));
    
    return NextResponse.json({ sectors }, { headers });

  } catch (error) {
    console.error('Sectors stats error:', error);
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
