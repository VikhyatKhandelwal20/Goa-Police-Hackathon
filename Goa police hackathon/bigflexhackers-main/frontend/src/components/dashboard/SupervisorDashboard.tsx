import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  MapPin, 
  Shield, 
  Clock,
  TrendingUp,
  CheckCircle,
  Activity,
  UserCheck,
  X,
  Siren,
  AlertTriangle
} from 'lucide-react';
import { mockSectors, mockOfficers } from '@/data/mockData';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, SOCKET_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import MiniMap from './MiniMap';

const SupervisorDashboard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const onDutyOfficers = mockOfficers.filter(o => o.status === 'on-duty');
  const [ongoingDuties, setOngoingDuties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [personnelOnDuty, setPersonnelOnDuty] = useState([]);
  const [personnelLoading, setPersonnelLoading] = useState(false);
  const [personnelError, setPersonnelError] = useState(null);
  
  // Real-time stats from backend
  const [stats, setStats] = useState({
    activeOfficers: 0,
    onDutyOfficers: 0,
    distinctSectors: 0,
    distinctZones: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  
  // Sector status data
  const [sectors, setSectors] = useState([]);
  const [sectorsLoading, setSectorsLoading] = useState(true);
  const [sectorsError, setSectorsError] = useState(null);
  
  // Deployment zones data
  const [deploymentZones, setDeploymentZones] = useState([]);
  
  // Panic alert state - isolated and stable
  const [activePanicAlert, setActivePanicAlert] = useState(null);
  const alertProcessingRef = useRef(false);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState(null);

  // Fetch pending checkout requests
  const { data: pendingRequestsData, isLoading: pendingRequestsLoading, error: pendingRequestsError, refetch: refetchPendingRequests } = useQuery({
    queryKey: ['pending-checkout-requests'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/duties/pending-requests`);
      if (!response.ok) {
        throw new Error('Failed to fetch pending requests');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Approve checkout request mutation
  const approveCheckoutMutation = useMutation({
    mutationFn: async (dutyId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/duties/respond-checkout`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dutyId,
          decision: 'approved'
        })
      });
      if (!response.ok) {
        throw new Error('Failed to approve checkout request');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Checkout Request Approved', {
        description: `Officer ${data.officerName} has been checked out successfully.`,
      });
      // Refetch pending requests
      queryClient.invalidateQueries({ queryKey: ['pending-checkout-requests'] });
    },
    onError: (error) => {
      toast.error('Failed to Approve Request', {
        description: error.message,
      });
    }
  });

  // Deny checkout request mutation
  const denyCheckoutMutation = useMutation({
    mutationFn: async ({ dutyId, reason }: { dutyId: string; reason?: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/duties/respond-checkout`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dutyId,
          decision: 'denied',
          reason: reason || 'No reason provided'
        })
      });
      if (!response.ok) {
        throw new Error('Failed to deny checkout request');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.error('Checkout Request Denied', {
        description: `Officer ${data.officerName}'s checkout request has been denied.`,
      });
      // Refetch pending requests
      queryClient.invalidateQueries({ queryKey: ['pending-checkout-requests'] });
    },
    onError: (error) => {
      toast.error('Failed to Deny Request', {
        description: error.message,
      });
    }
  });

  // Acknowledge panic alert mutation
  const acknowledgePanicAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/alerts/acknowledge`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId
        })
      });
      if (!response.ok) {
        throw new Error('Failed to acknowledge panic alert');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Panic Alert Acknowledged', {
        description: `Alert from Officer ${data.officerName} has been acknowledged.`,
      });
      // Clear the active panic alert and reset processing flag
      setActivePanicAlert(null);
      alertProcessingRef.current = false;
      console.log('✅ Panic alert acknowledged and cleared');
    },
    onError: (error) => {
      toast.error('Failed to Acknowledge Alert', {
        description: error.message,
      });
      // Reset processing flag on error so user can try again
      alertProcessingRef.current = false;
      console.log('❌ Panic alert acknowledgment failed, resetting processing flag');
    }
  });

  const statusVariants = {
    'on-duty': 'success',
    'off-duty': 'secondary',
    'break': 'warning',
    'emergency': 'destructive',
  } as const;

  // Fetch real-time stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/stats/supervisor`);
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setStatsError('Failed to fetch statistics');
      } finally {
        setStatsLoading(false);
      }
    };

    const fetchSectors = async () => {
      setSectorsLoading(true);
      setSectorsError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/stats/sectors`);
        if (!response.ok) {
          throw new Error('Failed to fetch sectors');
        }
        const data = await response.json();
        setSectors(data.sectors);
      } catch (err) {
        console.error('Error fetching sectors:', err);
        setSectorsError('Failed to fetch sector data');
      } finally {
        setSectorsLoading(false);
      }
    };

    const fetchDeploymentZones = async () => {
      setZonesLoading(true);
      setZonesError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/deployment/zones`);
        if (!response.ok) {
          throw new Error('Failed to fetch deployment zones');
        }
        const data = await response.json();
        setDeploymentZones(data.sectors || []);
      } catch (err) {
        console.error('Error fetching deployment zones:', err);
        setZonesError('Failed to fetch deployment zones data');
      } finally {
        setZonesLoading(false);
      }
    };

    // Only fetch if we're in a browser environment
    if (typeof window !== 'undefined') {
      fetchStats();
      fetchSectors();
      fetchDeploymentZones();
    }
  }, []);

  // Fetch recent duties from API
  useEffect(() => {
    const fetchRecentDuties = async () => {
      try {
        setLoading(true);
        // Use the new recent duties endpoint
        const response = await axios.get(`${API_BASE_URL}/api/duties/recent`);
        if (response.data && response.data.duties) {
          setOngoingDuties(response.data.duties);
          setError(null);
        } else {
          setOngoingDuties([]);
        }
      } catch (err) {
        console.error('Error fetching recent duties:', err);
        setError('Failed to load recent duties');
        // Fallback to empty array on error
        setOngoingDuties([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchPersonnelOnDuty = async () => {
      try {
        setPersonnelLoading(true);
        // Use the new personnel endpoint with supervisor filter
        const response = await axios.get(`${API_BASE_URL}/api/personnel/on-duty?supervisorId=${user?.username}`);
        
        if (response.data && response.data.duties) {
          // Transform the data to match the expected format
          const personnelData = response.data.duties.map(duty => ({
            _id: duty.officer._id,
            name: duty.officer.name,
            officerId: duty.officer.officerId,
            rank: duty.officer.rank,
            role: duty.officer.role,
            homePoliceStation: duty.officer.homePoliceStation,
            currentStatus: duty.officer.currentStatus,
            isActive: duty.officer.isActive,
            dutyName: duty.bandobastName,
            dutyLocation: duty.currentLocation,
            dutyStatus: duty.status,
            dutyId: duty._id,
            sector: duty.sector,
            zone: duty.zone,
            post: duty.post,
            checkInTime: duty.checkInTime,
            checkOutTime: duty.checkOutTime,
            createdAt: duty.createdAt,
            updatedAt: duty.updatedAt
          }));
          
          setPersonnelOnDuty(personnelData);
          setPersonnelError(null);
        } else {
          setPersonnelOnDuty([]);
        }
      } catch (err) {
        console.error('Error fetching personnel on duty:', err);
        setPersonnelError('Failed to load personnel data');
        setPersonnelOnDuty([]);
      } finally {
        setPersonnelLoading(false);
      }
    };

    // Only fetch if we're in a browser environment
    if (typeof window !== 'undefined') {
      fetchRecentDuties();
      fetchPersonnelOnDuty();
    }
  }, []);

  // Socket.IO connection for real-time geofence alerts
  useEffect(() => {
    const socket: Socket = io(SOCKET_URL);

    // Listen for supervisor geofence alerts
    socket.on('supervisor-geofence-alert', (data) => {
      console.log('Received supervisor geofence alert:', data);
      
      // Show high-priority destructive toast
      toast.error(`ALERT: Officer ${data.officerName} has been outside their jurisdiction for over 10 minutes.`, {
        description: `Officer: ${data.officerName} (${data.officerId}) | Rank: ${data.rank} | Station: ${data.homePoliceStation} | Duty: ${data.dutyName} | Distance: ${data.distance}m | Time Outside: ${Math.floor(data.timeOutsideGeofence / 60)} minutes`,
        duration: 15000, // 15 seconds for high-priority alert
        action: {
          label: 'View Details',
          onClick: () => {
            // Could open a detailed view or navigate to officer details
            console.log('View officer details:', data);
          }
        }
      });
    });

    // Listen for new checkout requests
    socket.on('new-checkout-request', (data) => {
      console.log('Received new checkout request:', data);
      
      // Show notification toast
      toast.info('New Checkout Request', {
        description: `Officer ${data.officerName} (${data.officerId}) has requested to checkout from ${data.dutyDetails.post}.`,
        duration: 10000,
        action: {
          label: 'View Requests',
          onClick: () => {
            // Refetch pending requests to update the UI
            refetchPendingRequests();
          }
        }
      });
      
      // Refetch pending requests to update the UI
      refetchPendingRequests();
    });

    // Listen for panic alerts - with duplicate prevention
    socket.on('panic-alert-triggered', (data) => {
      console.log('Received panic alert:', data);
      
      // Prevent duplicate processing
      if (alertProcessingRef.current) {
        console.log('Alert already being processed, ignoring duplicate');
        return;
      }
      
      alertProcessingRef.current = true;
      
      // Set the active panic alert state - ONLY here
      setActivePanicAlert(data);
      
      // Play alarm sound
      try {
        const alarmSound = new Audio('/alarm.mp3'); // You'll need to add this file to public folder
        alarmSound.volume = 0.8;
        alarmSound.loop = true;
        alarmSound.play().catch(error => {
          console.log('Could not play alarm sound:', error);
          // Fallback: use browser's built-in beep if available
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance('PANIC ALERT! PANIC ALERT!');
            utterance.volume = 1;
            utterance.rate = 0.8;
            utterance.pitch = 1.2;
            window.speechSynthesis.speak(utterance);
          }
        });
      } catch (error) {
        console.log('Could not create alarm sound:', error);
      }
      
      // Show persistent alert notification (no toast since modal is persistent)
      console.log('🚨 PANIC ALERT MODAL IS NOW VISIBLE - MUST BE ACKNOWLEDGED TO DISMISS');
    });

    // Handle connection events
    socket.on('connect', () => {
      console.log('Supervisor connected to Socket.IO server');
    });

    socket.on('disconnect', () => {
      console.log('Supervisor disconnected from Socket.IO server');
    });

    socket.on('connect_error', (error) => {
      console.error('Supervisor Socket.IO connection error:', error);
    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Panic Alert Modal */}
      {activePanicAlert && (
        <Dialog open={!!activePanicAlert} onOpenChange={() => {}}>
          <DialogContent 
            className="max-w-2xl w-full p-0 border-4 border-red-500"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <div className="bg-red-600 text-white p-6 rounded-t-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                  <Siren className="h-8 w-8" />
                  🚨 PANIC ALERT 🚨
                </DialogTitle>
                <DialogDescription className="text-red-100 text-lg mt-2">
                  Emergency alert from Officer {activePanicAlert.officer.name} ({activePanicAlert.officer.officerId})
                </DialogDescription>
                <div className="mt-3 p-3 bg-red-700 rounded-lg border border-red-400">
                  <p className="text-red-100 font-semibold text-sm">
                    ⚠️ This alert will remain on screen until acknowledged by a supervisor
                  </p>
                </div>
              </DialogHeader>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Officer Information */}
              <Card className="border-red-200">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-red-700">Officer Information</h3>
                      <div className="text-lg font-semibold">{activePanicAlert.officer.name}</div>
                      <div className="text-sm text-muted-foreground">{activePanicAlert.officer.officerId}</div>
                      <div className="text-sm text-muted-foreground">{activePanicAlert.officer.rank} • {activePanicAlert.officer.homePoliceStation}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-lg font-semibold text-red-700">Current Duty</h4>
                      <div className="text-lg font-medium">{activePanicAlert.duty?.bandobastName || 'No Active Duty'}</div>
                      <div className="text-sm text-muted-foreground">
                        {activePanicAlert.duty?.sector && activePanicAlert.duty?.zone && 
                          `${activePanicAlert.duty.sector} • ${activePanicAlert.duty.zone} • ${activePanicAlert.duty.post}`
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 pt-4">
                <Button
                  onClick={() => acknowledgePanicAlertMutation.mutate(activePanicAlert.alertId)}
                  disabled={acknowledgePanicAlertMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                >
                  {acknowledgePanicAlertMutation.isPending ? (
                    <>
                      <Activity className="h-5 w-5 mr-2 animate-spin" />
                      Acknowledging...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Acknowledge Alert
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Supervisor Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Real-time overview of police deployment and operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Personnel</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {statsLoading ? '...' : statsError ? 'Error' : stats.activeOfficers}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {statsLoading ? '...' : statsError ? '0' : stats.distinctSectors} sectors
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Duty</CardTitle>
            <Shield className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {statsLoading ? '...' : statsError ? 'Error' : stats.onDutyOfficers}
            </div>
            <p className="text-xs text-muted-foreground">
              {statsLoading ? '...' : statsError ? '0%' : 
                stats.activeOfficers > 0 ? 
                  Math.round((stats.onDutyOfficers / stats.activeOfficers) * 100) + '%' : 
                  '0%'} deployment rate
            </p>
          </CardContent>
        </Card>


        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sectors Active</CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {statsLoading ? '...' : statsError ? 'Error' : stats.distinctSectors}
            </div>
            <p className="text-xs text-muted-foreground">
              {statsLoading ? '...' : statsError ? '0' : stats.distinctZones} zones covered
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Main Content Grid - Professional Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Checkout Requests (spans 2 columns on large screens) */}
        <div className="lg:col-span-2">
          {/* Checkout Requests */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Checkout Requests
          </CardTitle>
          <CardDescription>
            Pending checkout requests from officers requiring supervisor approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequestsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading checkout requests...</p>
            </div>
          ) : pendingRequestsError ? (
            <div className="text-center py-4">
              <p className="text-sm text-destructive">Failed to load checkout requests</p>
            </div>
          ) : !pendingRequestsData?.pendingRequests || pendingRequestsData.pendingRequests.length === 0 ? (
            <div className="text-center py-4">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending checkout requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {pendingRequestsData.count} pending request{pendingRequestsData.count !== 1 ? 's' : ''}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchPendingRequests()}
                  disabled={pendingRequestsLoading}
                >
                  Refresh
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Officer</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Post</TableHead>
                    <TableHead>Check-in Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequestsData.pendingRequests.map((request: any) => (
                    <TableRow key={request.dutyId}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{request.officerName}</div>
                          <div className="text-sm text-muted-foreground">{request.officerId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.officerRank}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.dutyDetails.post}</div>
                          <div className="text-sm text-muted-foreground">
                            {request.dutyDetails.sector}, {request.dutyDetails.zone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(request.dutyDetails.checkInTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="warning">Pending Approval</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => denyCheckoutMutation.mutate({ dutyId: request.dutyId })}
                            disabled={approveCheckoutMutation.isPending || denyCheckoutMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Deny
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approveCheckoutMutation.mutate(request.dutyId)}
                            disabled={approveCheckoutMutation.isPending || denyCheckoutMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
        </div>

        {/* Right Column - Live Map Overview (spans 1 column on large screens) */}
        <div className="lg:col-span-1">
          <div 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => navigate('/supervisor/live-map')}
          >
            <MiniMap className="shadow-card" />
          </div>
        </div>
      </div>

      {/* Additional Content Sections */}
      <div className="space-y-6 mt-6">
        {/* Sectors Overview */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Sector Status
            </CardTitle>
            <CardDescription>
              Sector-wise deployment statistics and zone coverage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sectorsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading sector data...</p>
              </div>
            ) : sectorsError ? (
              <div className="text-center py-4">
                <p className="text-sm text-destructive">Failed to load sector data</p>
              </div>
            ) : sectors.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No sector data available</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-4">
                {sectors.slice(0, 4).map((sector) => (
                <div key={sector.name} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                <div>
                      <div className="font-medium text-lg">{sector.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {sector.totalOfficers} officers • {sector.totalZones} zones
                      </div>
                </div>
                <div className="text-right">
                      <div className="flex gap-2">
                        <Badge variant="success" className="text-xs">
                          {sector.activeDuties} Active
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {sector.assignedDuties} Assigned
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {sector.completedDuties} Completed
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Zones within this sector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {sector.zones.map((zone) => (
                      <div key={zone.name} className="bg-secondary/20 rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm">{zone.name}</div>
                          <div className="flex gap-1">
                            {zone.activeDuties > 0 && (
                              <Badge variant="success" className="text-xs px-1 py-0">
                                {zone.activeDuties}
                              </Badge>
                            )}
                            {zone.assignedDuties > 0 && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {zone.assignedDuties}
                              </Badge>
                            )}
                            {zone.completedDuties > 0 && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {zone.completedDuties}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Zone summary - no officer details */}
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {zone.activeDuties > 0 && `${zone.activeDuties} active`}
                            {zone.assignedDuties > 0 && ` • ${zone.assignedDuties} assigned`}
                            {zone.completedDuties > 0 && ` • ${zone.completedDuties} completed`}
                          </div>
                          {zone.duties.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {zone.duties.length} total assignment{zone.duties.length !== 1 ? 's' : ''}
                            </div>
                          )}
                </div>
              </div>
            ))}
                  </div>
                </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Personnel Status */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Personnel Overview
          </CardTitle>
          <CardDescription>
            Officers currently on active duty assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {personnelLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading personnel data...</div>
            </div>
          ) : personnelError ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-destructive">{personnelError}</div>
            </div>
          ) : personnelOnDuty.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No personnel currently on active duty</div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-4 gap-4 px-3 py-2 bg-secondary/20 rounded-lg font-medium text-sm text-muted-foreground">
                  <div className="text-center">Officer</div>
                  <div className="text-center">Assignment</div>
                  <div className="text-center">Post</div>
                  <div className="text-center">Check-in Time</div>
                </div>
                
                {/* Personnel Rows */}
                {personnelOnDuty.slice(0, 5).map((officer) => (
                <div key={officer._id} className="grid grid-cols-4 gap-4 p-3 bg-secondary/30 rounded-lg hover:bg-secondary/40 transition-colors">
                  <div className="flex flex-col items-center text-center">
                    <div className="font-medium text-sm">{officer.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {officer.rank} • {officer.officerId}
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="text-sm font-medium">{officer.dutyName}</div>
                    <div className="text-xs text-muted-foreground">
                      {officer.sector} • {officer.zone}
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-sm text-center">{officer.post}</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-xs text-muted-foreground text-center">
                      {officer.checkInTime ? new Date(officer.checkInTime).toLocaleTimeString() : 'Not checked in'}
                    </div>
                  </div>
                </div>
                ))}
                
                {/* Summary Stats */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Total Active Personnel: {personnelOnDuty.length}</span>
                    <span>Checked In: {personnelOnDuty.filter(o => o.checkInTime).length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity - Recent Duties */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest duty assignments and activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading recent activities...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-destructive">{error}</div>
            </div>
          ) : ongoingDuties.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No recent activities found</div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-4">
              {ongoingDuties.slice(0, 5).map((duty) => (
                <div key={duty._id} className="flex items-start justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{duty.bandobastName}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Officer: {duty.officer?.name || 'Unknown'} ({duty.officer?.rank})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Sector: {duty.sector} • Zone: {duty.zone} • Post: {duty.post}
                    </div>
                    {duty.currentLocation && (
                      <div className="text-xs text-muted-foreground">
                        Location: {duty.currentLocation.lat?.toFixed(4)}, {duty.currentLocation.lon?.toFixed(4)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge 
                      variant={
                        duty.status === 'Active' ? 'success' :
                        duty.status === 'Assigned' ? 'secondary' : 
                        duty.status === 'Completed' ? 'outline' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {duty.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {new Date(duty.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deployment Zones */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Deployment Zones
          </CardTitle>
          <CardDescription>
            Zone-wise deployment status and coverage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {zonesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2 ml-2">Loading deployment zones...</p>
            </div>
          ) : zonesError ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-destructive">{zonesError}</p>
            </div>
          ) : deploymentZones.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">No deployment zones found</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {deploymentZones.map((sector) => 
                  sector.zones.map((zone) => (
                    <Card key={`${zone.sector}-${zone.zone}`} className="p-4 hover:shadow-md transition-shadow">
                      <CardHeader className="p-0 pb-2">
                        <CardTitle className="text-lg">{zone.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Officers:</span>
                            <span className="font-medium">{zone.totalOfficers}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Active:</span>
                            <span className="font-medium text-success">{zone.activeOfficers}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Assigned:</span>
                            <span className="font-medium text-secondary">{zone.assignedOfficers}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge 
                              variant={
                                zone.status === 'Active' ? 'success' :
                                zone.status === 'Assigned' ? 'secondary' :
                                zone.status === 'Understaffed' ? 'warning' :
                                zone.status === 'Completed' ? 'outline' : 'destructive'
                              }
                              className="text-xs"
                            >
                              {zone.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default SupervisorDashboard;