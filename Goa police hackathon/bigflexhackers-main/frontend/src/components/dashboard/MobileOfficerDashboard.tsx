import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuthStore } from '@/store/authStore';
import LiveLocationMap from '@/components/LiveLocationMap';
import { io, Socket } from 'socket.io-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast as sonnerToast } from 'sonner';
import { 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  MessageSquare,
  Calendar,
  Shield,
  Activity,
  Navigation,
  Bell,
  Siren
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL, SOCKET_URL } from '@/config/api';

const MobileOfficerDashboard = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [lastClockIn, setLastClockIn] = useState('Not clocked in');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDuty, setCurrentDuty] = useState(null);
  const [isOutsideJurisdiction, setIsOutsideJurisdiction] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isCheckoutPending, setIsCheckoutPending] = useState(false);
  const [isPanicDialogOpen, setIsPanicDialogOpen] = useState(false);

  // Check if officer is on duty on component mount
  useEffect(() => {
    if (user?.role === 'officer' && user?.username) {
      // Check current duty status from API
      const checkDutyStatus = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/duties/my-duties/${user.username}`);
          if (response.ok) {
            const data = await response.json();
            const activeDuty = data.duties?.find((duty: any) => 
              duty.dutyDetails?.status === 'Active' && duty.dutyDetails?.checkInTime
            );
            
            const checkoutPendingDuty = data.duties?.find((duty: any) => 
              duty.dutyDetails?.status === 'Checkout Pending'
            );
            
            if (activeDuty) {
              setIsOnDuty(true);
              setCurrentDuty(activeDuty.dutyDetails);
              setLastClockIn(new Date(activeDuty.dutyDetails.checkInTime).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              }));
              setIsCheckoutPending(false);
            } else if (checkoutPendingDuty) {
              setIsOnDuty(true);
              setCurrentDuty(checkoutPendingDuty.dutyDetails);
              setLastClockIn(new Date(checkoutPendingDuty.dutyDetails.checkInTime).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              }));
              setIsCheckoutPending(true);
            } else {
              setIsOnDuty(false);
              setCurrentDuty(null);
              setLastClockIn('Not clocked in');
              setIsCheckoutPending(false);
            }
          }
        } catch (error) {
          console.error('Error checking duty status:', error);
          setIsOnDuty(false);
        }
      };
      
      checkDutyStatus();
    }
  }, [user]);

  // Socket.IO connection for real-time geofence alerts
  useEffect(() => {
    if (!user?.username) return;

    const socket: Socket = io(SOCKET_URL);

    // Listen for geofence exit event
    socket.on('officer-geofence-exit', (data) => {
      if (data.officerId === user.username) {
        setIsOutsideJurisdiction(true);
        toast({
          title: "Geofence Alert",
          description: `You have left your assigned jurisdiction. Distance: ${data.distance}m`,
          variant: "destructive",
          duration: 10000,
        });
      }
    });

    // Listen for geofence enter event
    socket.on('officer-geofence-enter', (data) => {
      if (data.officerId === user.username) {
        setIsOutsideJurisdiction(false);
        toast({
          title: "Geofence Alert",
          description: `You have returned to your assigned jurisdiction. Distance: ${data.distance}m`,
          variant: "default",
          duration: 5000,
        });
      }
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
  }, [user?.username, toast]);

  // Fetch notifications
  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', user?.username],
    queryFn: async () => {
      if (!user?.username) return { notifications: [] };
      const response = await fetch(`${API_BASE_URL}/api/notifications/my-notifications?officerId=${user.username}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    enabled: !!user?.username,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch officer duties
  const { data: dutiesData, isLoading: dutiesLoading } = useQuery({
    queryKey: ['my-duties', user?.username],
    queryFn: async () => {
      if (!user?.username) return { duties: [] };
      const response = await fetch(`${API_BASE_URL}/api/duties/my-duties/${user.username}`);
      if (!response.ok) throw new Error('Failed to fetch duties');
      return response.json();
    },
    enabled: !!user?.username,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch hours worked today
  const { data: hoursData, isLoading: hoursLoading } = useQuery({
    queryKey: ['hours-today', user?.username],
    queryFn: async () => {
      if (!user?.username) return { summary: { totalHours: 0 } };
      const response = await fetch(`${API_BASE_URL}/api/officers/${user.username}/hours-today`);
      if (!response.ok) throw new Error('Failed to fetch hours worked');
      return response.json();
    },
    enabled: !!user?.username,
    refetchInterval: 1800000, // Refetch every 30 minutes
  });

  // Mark notifications as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/notifications/mark-read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerId: user?.username }),
      });
      if (!response.ok) throw new Error('Failed to mark notifications as read');
      return response.json();
    },
    onSuccess: () => {
      refetchNotifications();
      toast({
        title: "Notifications marked as read",
        description: "All notifications have been marked as read",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    },
  });

  // Panic alert mutation
  const panicAlertMutation = useMutation({
    mutationFn: async (location: { lat: number; lon: number }) => {
      const response = await fetch(`${API_BASE_URL}/api/alerts/panic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          officerId: user?.username,
          location 
        }),
      });
      if (!response.ok) throw new Error('Failed to send panic alert');
      return response.json();
    },
    onSuccess: () => {
      setIsPanicDialogOpen(false);
      sonnerToast.success('Panic Alert Sent', {
        description: 'Emergency alert has been sent to your supervisor',
        duration: 5000,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send panic alert. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Socket.IO listener for new notifications
  useEffect(() => {
    if (!user?.username) return;

    const socket: Socket = io(SOCKET_URL);

    socket.on('new-notification', (notification) => {
      if (notification.recipient === user.username) {
        // Show Sonner toast
        sonnerToast.success("New Notification", {
          description: notification.message,
          duration: 5000,
        });
        
        // Refetch notifications to update the unread count
        refetchNotifications();
      }
    });

    // Listen for checkout approval
    socket.on('checkout-approved', (data) => {
      console.log('Checkout approved:', data);
      if (data.officerId === user.username) {
        sonnerToast.success('Checkout Approved!', {
          description: 'Your duty has been completed successfully.',
          duration: 5000,
        });
        // Log out or navigate to duty complete screen
        setTimeout(() => {
          // For now, we'll just reset the state
          setIsOnDuty(false);
          setCurrentDuty(null);
          setLastClockIn('Not clocked in');
          setIsCheckoutPending(false);
          // You can add logout logic here if needed
        }, 2000);
      }
    });

    // Listen for checkout denial
    socket.on('checkout-denied', (data) => {
      console.log('Checkout denied:', data);
      if (data.officerId === user.username) {
        sonnerToast.error('Checkout Request Denied', {
          description: data.reason || 'Your checkout request was denied.',
          duration: 5000,
        });
        // Re-enable the checkout button
        setIsCheckoutPending(false);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.username, refetchNotifications]);

  // Handle notification dropdown open
  const handleNotificationDropdownOpen = (open: boolean) => {
    setIsNotificationDropdownOpen(open);
    if (open) {
      // Mark all notifications as read when dropdown opens
      markAsReadMutation.mutate();
    }
  };

  // Get unread notification count
  const unreadCount = notificationsData?.notifications?.filter((n: any) => !n.isRead).length || 0;

  const handleClockIn = async () => {
    if (!user?.username) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/duties/clock-in`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officerId: user.username
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsOnDuty(true);
        setCurrentDuty(data.duty);
        setLastClockIn(new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }));
        toast({
          title: "Clocked In Successfully!",
          description: `Assigned to ${data.duty.bandobastName} in ${data.duty.sector}`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Clock-in Failed",
          description: data.error || "Unable to clock in",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Clock-in error:', error);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestCheckout = async () => {
    if (!user?.username) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/duties/request-checkout`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officerId: user.username
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsCheckoutPending(true);
        toast({
          title: "Checkout Request Submitted!",
          description: "Your checkout request has been sent to your supervisor for approval.",
          duration: 5000,
        });
      } else {
        toast({
          title: "Checkout Request Failed",
          description: data.error || "Unable to submit checkout request",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Checkout request error:', error);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get current GPS location
  const getCurrentLocation = (): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(`Location access denied: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  };

  // Handle panic button click
  const handlePanicAlert = async () => {
    try {
      setIsLoading(true);
      
      // Send panic alert without requiring location access
      // Backend will use default location if not provided
      panicAlertMutation.mutate({ lat: 0, lon: 0 }); // Placeholder, backend will use default
    } catch (error) {
      console.error('Panic alert error:', error);
      toast({
        title: "Panic Alert Failed",
        description: "Failed to send panic alert. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const todayStats = {
    hoursWorked: hoursLoading ? '...' : (hoursData?.summary?.totalHours || 0).toString(),
  };

  // Error boundary fallback
  if (!user) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center py-8">
          <h2 className="text-lg font-semibold">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Geofence Alert */}
      {isOutsideJurisdiction && (
        <Alert variant="destructive" className="sticky top-2 z-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-semibold text-sm">
            ALERT: You are outside your assigned jurisdiction. Please return to your designated area immediately.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold">Officer Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {user?.name}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant={isOnDuty ? 'success' : 'secondary'} className="text-xs">
              {isOnDuty ? 'On Duty' : 'Off Duty'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Since {lastClockIn}
            </span>
          </div>
          {currentDuty && (
            <div className="mt-2 text-center">
              <div className="text-xs text-muted-foreground">
                {currentDuty.sector} - {currentDuty.zone}
              </div>
              <div className="text-xs text-primary font-medium">
                {currentDuty.bandobastName}
              </div>
            </div>
          )}
        </div>
        
        {/* Notification Bell */}
        <DropdownMenu open={isNotificationDropdownOpen} onOpenChange={handleNotificationDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{unreadCount}</span>
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-2">
              <h3 className="font-semibold text-sm mb-2">Notifications</h3>
              {notificationsData?.notifications?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notifications
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notificationsData?.notifications?.map((notification: any) => (
                    <div
                      key={notification._id}
                      className={`p-3 rounded-lg border ${
                        !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{notification.type}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4 mb-6">
        <Button
          onClick={isOnDuty ? handleRequestCheckout : handleClockIn}
          variant={isOnDuty ? 'destructive' : 'default'}
          className="h-16 w-32 flex flex-col items-center space-y-1"
          disabled={isLoading || isCheckoutPending}
        >
          <Clock className="h-5 w-5" />
          <span className="text-xs">
            {isLoading ? 'Processing...' : 
             isCheckoutPending ? 'Pending Approval' :
             (isOnDuty ? 'Request Checkout' : 'Clock In')}
          </span>
        </Button>

        {/* Panic Button */}
        <AlertDialog open={isPanicDialogOpen} onOpenChange={setIsPanicDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="h-16 w-32 flex flex-col items-center space-y-1 bg-red-600 hover:bg-red-700"
              disabled={isLoading || panicAlertMutation.isPending}
            >
              <Siren className="h-5 w-5" />
              <span className="text-xs">
                {isLoading || panicAlertMutation.isPending ? 'Sending...' : 'PANIC'}
              </span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Siren className="h-5 w-5 text-red-600" />
                Confirm Panic Alert
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to send an emergency alert to your supervisor? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading || panicAlertMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePanicAlert}
                disabled={isLoading || panicAlertMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading || panicAlertMutation.isPending ? 'Sending...' : 'Confirm Alert'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Hours Worked - Prominent Display */}
      <Card className="shadow-card mb-6">
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Hours Worked Today</h3>
            <div className="text-4xl font-bold text-primary">{todayStats.hoursWorked}</div>
            <p className="text-sm text-muted-foreground">hours</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="location" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="messages">Duties</TabsTrigger>
        </TabsList>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Navigation className="h-5 w-5 text-primary" />
                Live Location Tracking
              </CardTitle>
              <CardDescription>
                Your current position and tracking status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 rounded-lg overflow-hidden">
                <LiveLocationMap 
                  officerName={user?.name || 'Officer'}
                  officerId={user?.username || 'OFF001'}
                  officerPosition={{
                    lat: 15.6000, // Default to Goa coordinates
                    lon: 73.8000
                  }}
                  className="h-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Duty Assignments
              </CardTitle>
              <CardDescription>
                Your latest duty assignments and status updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] overflow-y-auto space-y-3">
                {dutiesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-muted-foreground">Loading duties...</div>
                  </div>
                ) : dutiesData?.duties?.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-muted-foreground">No duty assignments found</div>
                  </div>
                ) : (
                  dutiesData?.duties?.map((duty: any) => (
                    <div 
                      key={duty.dutyId} 
                      className={`p-3 rounded-lg border ${
                        duty.dutyDetails.status === 'Active'
                          ? 'bg-green-50 border-green-200' 
                          : duty.dutyDetails.status === 'Checkout Pending'
                          ? 'bg-yellow-50 border-yellow-200'
                          : duty.dutyDetails.status === 'Completed'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-secondary/30 border-border/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-medium text-sm">{duty.dutyDetails.post}</div>
                            <Badge 
                              variant={
                                duty.dutyDetails.status === 'Active' ? 'default' :
                                duty.dutyDetails.status === 'Checkout Pending' ? 'secondary' :
                                duty.dutyDetails.status === 'Completed' ? 'outline' : 'secondary'
                              }
                              className="text-xs"
                            >
                              {duty.dutyDetails.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1 mb-1">
                              <MapPin className="h-3 w-3" />
                              {duty.dutyDetails.zone}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(duty.timestamps.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default MobileOfficerDashboard;
