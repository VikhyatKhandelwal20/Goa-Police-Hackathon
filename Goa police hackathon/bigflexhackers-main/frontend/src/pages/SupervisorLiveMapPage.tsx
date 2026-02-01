import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useIsMobile } from '@/hooks/use-mobile';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MobileLayout from '@/components/layout/MobileLayout';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
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
  role: string;
  homePoliceStation: string;
  currentStatus: string;
  isActive: boolean;
  currentLocation?: {
    lat: number;
    lon: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface OfficersResponse {
  message: string;
  count: number;
  officers: Officer[];
}

const SupervisorLiveMapPage: React.FC = () => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Fetch on-duty officers data
  const { data: officersData, isLoading, error } = useQuery<OfficersResponse>({
    queryKey: ['officers-on-duty', user?.username],
    queryFn: async () => {
      if (!user || user.role !== 'supervisor') {
        throw new Error('Only supervisors can view the live map');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/officers/on-duty?supervisorId=${user.username}`);
      if (!response.ok) {
        throw new Error('Failed to fetch officers data');
      }
      return response.json();
    },
    refetchInterval: false, // Disable automatic refetch since we'll use Socket.IO
    enabled: !!user && user.role === 'supervisor', // Only run query if user is a supervisor
  });

  // Socket.IO connection for real-time updates
  useEffect(() => {
    const socket: Socket = io(SOCKET_URL);

    // Listen for officer location updates
    socket.on('officer-location-updated', (updateData: { officerId: string; location: { lat: number; lon: number } }) => {
      console.log('Received officer location update:', updateData);
      
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
      console.log('Received officer went off-duty:', officerId);
      
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
      console.log('Connected to Socket.IO server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Show loading state while detecting mobile or fetching data
  if (isMobile === undefined || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">Error loading map data</div>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }

  // Default center coordinates (Goa, India)
  const defaultCenter: [number, number] = [15.2993, 74.1240];
  const defaultZoom = 12;

  // Filter officers with valid current location
  const officersWithLocation = officersData?.officers?.filter(
    officer => officer.currentLocation && 
    officer.currentLocation.lat && 
    officer.currentLocation.lon
  ) || [];

  const content = (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Live Deployment Map
      </h1>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '70vh' }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          className="z-10"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {officersWithLocation.map((officer) => (
            <Marker
              key={officer._id}
              position={[officer.currentLocation!.lat, officer.currentLocation!.lon]}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-lg">{officer.name}</h3>
                  <p className="text-sm text-gray-600">Rank: {officer.rank}</p>
                  <p className="text-sm text-gray-600">Officer ID: {officer.officerId}</p>
                  <p className="text-sm text-gray-600">Station: {officer.homePoliceStation}</p>
                  <p className="text-sm text-gray-600">Status: {officer.currentStatus}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        Showing {officersWithLocation.length} active officers on duty
      </div>
    </div>
  );

  // Render mobile or desktop layout based on screen size
  if (isMobile) {
    return <MobileLayout>{content}</MobileLayout>;
  }

  return <DashboardLayout>{content}</DashboardLayout>;
};

export default SupervisorLiveMapPage;
