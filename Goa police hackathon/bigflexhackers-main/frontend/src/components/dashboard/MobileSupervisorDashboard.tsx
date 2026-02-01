import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  MapPin, 
  Activity, 
  Clock,
  Shield,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  UserCheck,
  X,
  Siren
} from 'lucide-react';
import { mockSectors, mockOfficers } from '@/data/mockData';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, SOCKET_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';

const MobileSupervisorDashboard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
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
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState(null);
  
  // Panic alert state - isolated and stable
  const [activePanicAlert, setActivePanicAlert] = useState(null);
  const alertProcessingRef = useRef(false);

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
        const response = await axios.get(`${API_BASE_URL}/api/duties/recent`);
        
        if (response.data && response.data.duties) {
          setOngoingDuties(response.data.duties);
          setError(null);
        } else {
          setOngoingDuties([]);
        }
      } catch (err) {
        console.error('Error fetching recent duties:', err);
        setError('Failed to load recent activities');
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
        const alarmSound = new Audio('/alarm.mp3');
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
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Supervisor Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time overview of police deployment
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Personnel</p>
                <p className="text-2xl font-bold text-primary">
                  {statsLoading ? '...' : statsError ? 'Error' : stats.activeOfficers}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">On Duty</p>
                <p className="text-2xl font-bold text-success">
                  {statsLoading ? '...' : statsError ? 'Error' : stats.onDutyOfficers}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sectors</p>
                <p className="text-2xl font-bold text-primary">
                  {statsLoading ? '...' : statsError ? 'Error' : stats.distinctSectors}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Zones</p>
                <p className="text-2xl font-bold text-primary">
                  {statsLoading ? '...' : statsError ? 'Error' : stats.distinctZones}
                </p>
              </div>
              <Shield className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="personnel" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personnel">Personnel</TabsTrigger>
          <TabsTrigger value="checkout">Checkout</TabsTrigger>
          <TabsTrigger value="sectors">Sectors</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Personnel Tab */}
        <TabsContent value="personnel" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Personnel on Duty
              </CardTitle>
              <CardDescription>
                Officers currently assigned to duties
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
                  <div className="text-muted-foreground">No personnel currently on duty</div>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {personnelOnDuty.slice(0, 5).map((officer) => (
                    <div key={officer._id} className="p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{officer.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {officer.officerId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {officer.dutyName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {officer.sector} • {officer.zone}
                          </div>
                        </div>
                        <Badge 
                          variant={
                            officer.dutyStatus === 'active' ? 'success' :
                            officer.dutyStatus === 'pending' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {officer.dutyStatus}
                        </Badge>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checkout Requests Tab */}
        <TabsContent value="checkout" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="h-5 w-5 text-primary" />
                Checkout Requests
              </CardTitle>
              <CardDescription>
                Pending checkout requests from officers
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
                <div className="space-y-3">
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
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pendingRequestsData.pendingRequests.map((request: any) => (
                      <div key={request.dutyId} className="p-3 bg-secondary/30 rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{request.officerName}</div>
                              <div className="text-xs text-muted-foreground">{request.officerId}</div>
                              <div className="text-xs text-muted-foreground">
                                {request.officerRank} • {request.dutyDetails.post}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {request.dutyDetails.sector}, {request.dutyDetails.zone}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Check-in: {new Date(request.dutyDetails.checkInTime).toLocaleString()}
                              </div>
                            </div>
                            <Badge variant="warning" className="text-xs">Pending</Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => denyCheckoutMutation.mutate({ dutyId: request.dutyId })}
                              disabled={approveCheckoutMutation.isPending || denyCheckoutMutation.isPending}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Deny
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="flex-1"
                              onClick={() => approveCheckoutMutation.mutate(request.dutyId)}
                              disabled={approveCheckoutMutation.isPending || denyCheckoutMutation.isPending}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sectors Tab */}
        <TabsContent value="sectors" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Sector Status
              </CardTitle>
              <CardDescription>
                Current deployment across all sectors and zones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {sectors.slice(0, 4).map((sector) => (
                  <div key={sector.name} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{sector.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {sector.totalOfficers} officers • {sector.totalZones} zones
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant="success" className="text-xs px-1 py-0">
                          {sector.activeDuties}
                        </Badge>
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          {sector.assignedDuties}
                        </Badge>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {sector.completedDuties}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Zones within this sector */}
                    <div className="grid grid-cols-2 gap-2">
                      {sector.zones.map((zone) => (
                        <div key={zone.name} className="bg-secondary/20 rounded-md p-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium text-xs">{zone.name}</div>
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
                            </div>
                          </div>
                          
                          {/* Duties in this zone */}
                          <div className="space-y-1">
                            {zone.duties.slice(0, 1).map((duty) => (
                              <div key={duty.id} className="text-xs text-muted-foreground">
                                <div className="truncate">{duty.bandobastName}</div>
                                <div className="text-xs">
                                  {duty.officer.name} ({duty.officer.rank})
                                </div>
                              </div>
                            ))}
                            {zone.duties.length > 1 && (
                              <div className="text-xs text-muted-foreground">
                                +{zone.duties.length - 1} more
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
        </TabsContent>

        {/* Deployment Zones Tab */}
        <TabsContent value="zones" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
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
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {deploymentZones.map((sector) => 
                    sector.zones.map((zone) => (
                      <div key={`${zone.sector}-${zone.zone}`} className="p-3 bg-secondary/30 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{zone.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {zone.totalOfficers} officers • {zone.activeOfficers} active
                            </div>
                          </div>
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
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Active:</span>
                            <span className="font-medium text-success">{zone.activeOfficers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Assigned:</span>
                            <span className="font-medium text-secondary">{zone.assignedOfficers}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest duty assignments and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {ongoingDuties.slice(0, 5).map((duty) => (
                    <div key={duty._id} className="p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-start justify-between">
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
    </div>
  );
};

export default MobileSupervisorDashboard;
