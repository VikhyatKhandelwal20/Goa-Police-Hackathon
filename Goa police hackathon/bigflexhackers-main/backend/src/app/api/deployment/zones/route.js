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
    
    // Get all duties and group by sector and zone
    const duties = await Duty.find({})
      .populate('officer', 'name rank officerId currentStatus')
      .sort({ createdAt: -1 });
    
    // Group duties by sector and zone
    const zoneData = {};
    
    duties.forEach(duty => {
      const sectorKey = duty.sector;
      const zoneKey = `${duty.sector} - ${duty.zone}`;
      
      if (!zoneData[sectorKey]) {
        zoneData[sectorKey] = {
          sector: duty.sector,
          zones: {}
        };
      }
      
      if (!zoneData[sectorKey].zones[zoneKey]) {
        zoneData[sectorKey].zones[zoneKey] = {
          name: zoneKey,
          sector: duty.sector,
          zone: duty.zone,
          officers: [],
          activeOfficers: 0,
          assignedOfficers: 0,
          completedOfficers: 0,
          totalOfficers: 0,
          status: 'Inactive'
        };
      }
      
      const zone = zoneData[sectorKey].zones[zoneKey];
      
      // Add officer if not already added (avoid duplicates)
      const officerExists = zone.officers.find(o => o._id.toString() === duty.officer._id.toString());
      if (!officerExists) {
        zone.officers.push({
          _id: duty.officer._id,
          name: duty.officer.name,
          rank: duty.officer.rank,
          officerId: duty.officer.officerId,
          currentStatus: duty.officer.currentStatus
        });
        zone.totalOfficers++;
      }
      
      // Count by status
      if (duty.status === 'Active') {
        zone.activeOfficers++;
        zone.status = 'Active';
      } else if (duty.status === 'Assigned') {
        zone.assignedOfficers++;
        if (zone.status !== 'Active') {
          zone.status = 'Assigned';
        }
      } else if (duty.status === 'Completed') {
        zone.completedOfficers++;
      }
    });
    
    // Convert to array format and determine overall status
    const sectors = Object.values(zoneData).map(sector => {
      const zones = Object.values(sector.zones).map(zone => {
        // Determine zone status
        if (zone.activeOfficers > 0) {
          zone.status = 'Active';
        } else if (zone.assignedOfficers > 0) {
          zone.status = 'Assigned';
        } else if (zone.completedOfficers > 0) {
          zone.status = 'Completed';
        } else {
          zone.status = 'Inactive';
        }
        
        // Determine if understaffed (less than 2 officers)
        if (zone.totalOfficers > 0 && zone.totalOfficers < 2) {
          zone.status = 'Understaffed';
        }
        
        return zone;
      });
      
      return {
        sector: sector.sector,
        zones: zones.sort((a, b) => a.zone.localeCompare(b.zone))
      };
    });
    
    return NextResponse.json({
      message: 'Deployment zones retrieved successfully',
      count: sectors.length,
      sectors: sectors
    }, { headers });

  } catch (error) {
    console.error('Error fetching deployment zones:', error);
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
