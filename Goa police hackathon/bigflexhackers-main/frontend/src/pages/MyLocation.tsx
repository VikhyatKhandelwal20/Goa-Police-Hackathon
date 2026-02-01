import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import LiveLocationMap from '@/components/LiveLocationMap';
import { Navigation, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const MyLocation = () => {
  const { user } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Location</h1>
        <p className="text-muted-foreground mt-2">
          Live location tracking and GPS monitoring
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-md hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <Badge variant="outline" className="text-xs">
          Live Tracking Active
        </Badge>
      </div>

      {/* Live Location Map */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Live Location Tracking
          </CardTitle>
          <CardDescription>
            Your current position and real-time location updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 rounded-lg overflow-hidden">
            <LiveLocationMap 
              officerName={user?.name || 'Officer'}
              officerId={user?.username || 'OFF001'}
              officerPosition={{
                lat: 15.6000, // Default to Goa coordinates instead of Delhi
                lon: 73.8000
              }}
              className="h-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Location Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tracking Status</p>
                <p className="text-lg font-semibold text-success">Active</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Update Frequency</p>
                <p className="text-lg font-semibold">60s</p>
              </div>
              <Navigation className="h-6 w-6 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Update</p>
                <p className="text-lg font-semibold">{new Date().toLocaleTimeString()}</p>
              </div>
              <RefreshCw className="h-6 w-6 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Location Tracking Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <p>• Your location is automatically updated every 60 seconds</p>
            <p>• Location data is sent to the central monitoring system</p>
            <p>• GPS accuracy depends on your device and signal strength</p>
            <p>• Location tracking can be disabled in your device settings</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyLocation;
