import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL, SOCKET_URL } from '@/config/api';
import { MapPin } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Officer {
  _id: string;
  officerId: string;
  name: string;
  rank: string;
  homePoliceStation: string;
  currentStatus: string;
  currentLocation: {
    lat: number;
    lon: number;
  };
}

interface OfficersResponse {
  message: string;
  supervisorId: string;
  supervisorName: string;
  count: number;
  officers: Officer[];
}

interface MiniMapProps {
  onClick?: () => void;
  className?: string;
}

const MiniMap: React.FC<MiniMapProps> = ({ onClick, className = '' }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: officersData, isLoading, error } = useQuery<OfficersResponse>({
    queryKey: ['officers-on-duty', user?.username],
    queryFn: async () => {
      if (!user || user.role !== 'supervisor') {
        throw new Error('Only supervisors can view the mini map');
      }
      const response = await fetch(`${API_BASE_URL}/api/officers/on-duty?supervisorId=${user.username}`);
      if (!response.ok) {
        throw new Error('Failed to fetch officers on duty');
      }
      return response.json();
    },
    refetchInterval: false, // Disable automatic refetch since we'll use Socket.IO (same as main map)
    enabled: !!user && user.role === 'supervisor',
  });

  // Socket.IO connection for real-time updates (same as main map)
  useEffect(() => {
    const socket: Socket = io(SOCKET_URL);

    // Listen for officer location updates
    socket.on('officer-location-updated', (updateData: { officerId: string; location: { lat: number; lon: number } }) => {
      console.log('MiniMap: Received officer location update:', updateData);
      
      // Update the React Query cache with the new location data
      queryClient.setQueryData(['officers-on-duty', user?.username], (oldData: OfficersResponse | undefined) => {
        if (!oldData) return oldData;

        // Find and update the specific officer's location in the data
        const updatedOfficers = oldData.officers.map(officer => 
          officer.officerId === updateData.officerId 
            ? { ...officer, currentLocation: updateData.location }
            : officer
        );

        return {
          ...oldData,
          officers: updatedOfficers,
          count: updatedOfficers.length
        };
      });
    });

    // Listen for officer going off-duty
    socket.on('officer-went-off-duty', (officerId: string) => {
      console.log('MiniMap: Received officer went off-duty:', officerId);
      
      // Update the React Query cache by filtering out the officer who went off-duty
      queryClient.setQueryData(['officers-on-duty', user?.username], (oldData: OfficersResponse | undefined) => {
        if (!oldData) return oldData;

        // Filter out the officer who went off-duty
        const updatedOfficers = oldData.officers.filter(officer => 
          officer.officerId !== officerId
        );

        return {
          ...oldData,
          officers: updatedOfficers,
          count: updatedOfficers.length
        };
      });
    });

    // Handle connection events
    socket.on('connect', () => {
      console.log('MiniMap: Connected to Socket.IO server');
    });

    socket.on('disconnect', () => {
      console.log('MiniMap: Disconnected from Socket.IO server');
    });

    socket.on('connect_error', (error) => {
      console.error('MiniMap: Socket.IO connection error:', error);
    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, [queryClient, user?.username]);

  // Goa center coordinates (matching main map)
  const goaCenter: [number, number] = [15.2993, 74.1240];

  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-shadow duration-200 ${className}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          Live Map Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-48 w-full rounded-b-lg overflow-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Failed to load map</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={goaCenter}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              dragging={false}
              zoomControl={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              className="rounded-b-lg"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Render officer markers */}
              {officersData?.officers?.map((officer) => (
                <CircleMarker
                  key={officer._id}
                  center={[officer.currentLocation.lat, officer.currentLocation.lon]}
                  radius={6}
                  pathOptions={{
                    fillColor: '#3b82f6', // Blue color
                    color: '#1e40af', // Darker blue border
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8,
                  }}
                />
              ))}
            </MapContainer>
          )}
        </div>
        
        {/* Officer count display */}
        <div className="p-3 bg-gray-50 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active Officers:</span>
            <span className="font-semibold text-primary">
              {isLoading ? '...' : officersData?.count || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MiniMap;
