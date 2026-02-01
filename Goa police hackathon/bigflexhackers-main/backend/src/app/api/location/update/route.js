const { NextResponse } = require('next/server');
const connectDB = require('@/lib/mongodb');
const Duty = require('@/schemas/Duty');
const Officer = require('@/schemas/Officer');

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
}

async function POST(request) {
  // Handle CORS
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  try {
    await connectDB();
    
    const body = await request.json();
    const { officerId, lat, lon } = body;
    
    // Validate required fields
    if (!officerId || lat === undefined || lon === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: officerId, lat, lon' },
        { status: 400, headers }
      );
    }
    
    // Validate lat/lon are numbers
    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { error: 'Latitude and longitude must be valid numbers' },
        { status: 400, headers }
      );
    }
    
    // Validate lat/lon ranges
    if (lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90' },
        { status: 400, headers }
      );
    }
    
    if (lon < -180 || lon > 180) {
      return NextResponse.json(
        { error: 'Longitude must be between -180 and 180' },
        { status: 400, headers }
      );
    }
    
    // Find the officer by officerId
    const officer = await Officer.findOne({ 
      officerId: officerId, 
      isActive: true
    });
    
    if (!officer) {
      return NextResponse.json(
        { error: 'Officer not found or inactive' },
        { status: 404, headers }
      );
    }
    
    // Check if officer's currentStatus is 'On-Duty'
    if (officer.currentStatus !== 'On-Duty') {
      return NextResponse.json(
        { error: 'Officer is not currently on duty' },
        { status: 403, headers }
      );
    }
    
    // Find the officer's active duty
    const activeDuty = await Duty.findOne({
      officer: officer._id,
      status: 'Active'
    }).populate('officer', 'officerId name rank role homePoliceStation currentStatus isActive');
    
    if (!activeDuty) {
      return NextResponse.json(
        { error: 'No active duty found for this officer' },
        { status: 404, headers }
      );
    }
    
    // Update officer's currentLocation
    officer.currentLocation = {
      lat: parseFloat(lat),
      lon: parseFloat(lon)
    };
    await officer.save();
    
    // Get current time
    const currentTime = new Date();
    const newLocation = { lat: parseFloat(lat), lon: parseFloat(lon) };
    
    // Calculate distance between new location and assigned location
    // For now, using currentLocation as assignedLocation (can be modified later)
    const assignedLocation = activeDuty.currentLocation || { lat: 0, lon: 0 };
    const distance = calculateDistance(
      newLocation.lat, 
      newLocation.lon, 
      assignedLocation.lat, 
      assignedLocation.lon
    );
    
    // Store previous geofence status
    const wasOutsideGeofence = activeDuty.isOutsideGeofence;
    
    // Update duty location
    activeDuty.currentLocation = newLocation;
    
    // Geofencing logic
    if (distance > 200) { // Outside geofence (> 200 meters)
      // Check if officer just exited geofence
      if (!wasOutsideGeofence) {
        // Emit geofence exit event to officer
        if (global.io) {
          global.io.emit('officer-geofence-exit', {
            officerId: officer.officerId,
            officerName: officer.name,
            distance: Math.round(distance),
            location: newLocation
          });
          console.log(`Emitted officer-geofence-exit for officer: ${officerId}`);
        }
      }
      
      // Calculate time outside geofence
      if (activeDuty.lastLocationTimestamp) {
        const timeOutside = Math.floor((currentTime - activeDuty.lastLocationTimestamp) / 1000);
        activeDuty.timeOutsideGeofenceInSeconds += timeOutside;
      }
      
      // Set outside geofence status
      activeDuty.isOutsideGeofence = true;
      
      // Check if time outside geofence >= 600 seconds (10 minutes)
      if (activeDuty.timeOutsideGeofenceInSeconds >= 600) {
        // Emit supervisor alert
        if (global.io) {
          global.io.emit('supervisor-geofence-alert', {
            officerId: officer.officerId,
            officerName: officer.name,
            rank: officer.rank,
            homePoliceStation: officer.homePoliceStation,
            dutyName: activeDuty.bandobastName,
            sector: activeDuty.sector,
            zone: activeDuty.zone,
            post: activeDuty.post,
            timeOutsideGeofence: activeDuty.timeOutsideGeofenceInSeconds,
            distance: Math.round(distance),
            location: newLocation,
            timestamp: currentTime.toISOString()
          });
          console.log(`Emitted supervisor-geofence-alert for officer: ${officerId}`);
        }
      }
    } else { // Inside geofence (<= 200 meters)
      // Check if officer just entered geofence
      if (wasOutsideGeofence) {
        // Emit geofence enter event to officer
        if (global.io) {
          global.io.emit('officer-geofence-enter', {
            officerId: officer.officerId,
            officerName: officer.name,
            distance: Math.round(distance),
            location: newLocation
          });
          console.log(`Emitted officer-geofence-enter for officer: ${officerId}`);
        }
      }
      
      // Set inside geofence status
      activeDuty.isOutsideGeofence = false;
    }
    
    // Update last location timestamp
    activeDuty.lastLocationTimestamp = currentTime;
    
    // Save the updated duty
    await activeDuty.save();
    
    // Emit location update event
    if (global.io) {
      global.io.emit('officer-location-updated', {
        officerId: officer.officerId,
        location: newLocation
      });
      console.log(`Emitted officer-location-updated for officer: ${officerId}`);
    }
    
    // Prepare response data
    const updatedOfficer = {
      _id: officer._id,
      officerId: officer.officerId,
      name: officer.name,
      rank: officer.rank,
      role: officer.role,
      homePoliceStation: officer.homePoliceStation,
      currentStatus: officer.currentStatus,
      isActive: officer.isActive,
      currentLocation: officer.currentLocation,
      createdAt: officer.createdAt,
      updatedAt: officer.updatedAt
    };
    
    return NextResponse.json({
      message: 'Location updated successfully',
      officer: updatedOfficer,
      duty: {
        _id: activeDuty._id,
        bandobastName: activeDuty.bandobastName,
        sector: activeDuty.sector,
        zone: activeDuty.zone,
        post: activeDuty.post,
        isOutsideGeofence: activeDuty.isOutsideGeofence,
        timeOutsideGeofenceInSeconds: activeDuty.timeOutsideGeofenceInSeconds,
        distance: Math.round(distance)
      },
      timestamp: currentTime.toISOString()
    }, { headers });

  } catch (error) {
    console.error('Error updating location:', error);
    
    // Return a more informative error response
    const errorMessage = error.message.includes('MongoServerSelectionError') 
      ? 'Database connection failed. Please check your MongoDB connection.'
      : 'Internal server error';
      
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
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
