import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LiveLocationMapProps {
  officerPosition?: {
    lat: number;
    lon: number;
  };
  officerName?: string;
  className?: string;
  officerId?: string;
}

const LiveLocationMap: React.FC<LiveLocationMapProps> = ({
  officerPosition = { lat: 15.6000, lon: 73.8000 }, // Default to Goa coordinates
  officerName = 'Officer',
  className = '',
  officerId = 'OFF001'
}) => {
  const [currentPosition, setCurrentPosition] = useState(officerPosition);
  const [isTracking, setIsTracking] = useState(false);

  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          
          setCurrentPosition(newPosition);
          
          // Send location to backend
          axios.post('/api/location/update', {
            officerId: officerId,
            lat: newPosition.lat,
            lon: newPosition.lon,
            timestamp: new Date().toISOString()
          })
          .then((response) => {
            console.log('Location updated successfully:', response.data);
          })
          .catch((error) => {
            console.error('Error updating location:', error);
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };

  useEffect(() => {
    // Start tracking on component mount
    setIsTracking(true);
    updateLocation(); // Get initial location
    
    // Set up interval to update location every 60 seconds
    const interval = setInterval(() => {
      updateLocation();
    }, 60000);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(interval);
      setIsTracking(false);
    };
  }, [officerId]);
  return (
    <div className={`w-full h-full relative ${className}`} style={{ zIndex: 1 }}>
      {/* Tracking Status Indicator */}
      <div className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-xs font-medium">
            {isTracking ? 'Live Tracking' : 'Offline'}
          </span>
        </div>
      </div>

      <MapContainer
        center={[currentPosition.lat, currentPosition.lon]}
        zoom={13}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        className="rounded-lg relative z-10"
        key={`${currentPosition.lat}-${currentPosition.lon}`} // Force re-render on position change
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[currentPosition.lat, currentPosition.lon]}>
          <Popup>
            <div className="text-center">
              <div className="font-semibold text-primary">{officerName}</div>
              <div className="text-sm text-muted-foreground">Current Location</div>
              <div className="text-xs text-muted-foreground mt-1">
                Lat: {currentPosition.lat.toFixed(4)}, Lon: {currentPosition.lon.toFixed(4)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LiveLocationMap;
