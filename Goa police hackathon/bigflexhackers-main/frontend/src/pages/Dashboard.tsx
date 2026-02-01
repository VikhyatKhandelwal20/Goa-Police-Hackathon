import { useAuthStore } from '@/store/authStore';
import { useIsMobile } from '@/hooks/use-mobile';
import SupervisorDashboard from '@/components/dashboard/SupervisorDashboard';
import OfficerDashboard from '@/components/dashboard/OfficerDashboard';
import MobileSupervisorDashboard from '@/components/dashboard/MobileSupervisorDashboard';
import MobileOfficerDashboard from '@/components/dashboard/MobileOfficerDashboard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MobileLayout from '@/components/layout/MobileLayout';

const Dashboard = () => {
  const { user } = useAuthStore();
  const isMobile = useIsMobile();

  // Show loading state while detecting mobile
  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Render mobile or desktop layout based on screen size
  if (isMobile) {
    return (
      <MobileLayout>
        {user?.role === 'supervisor' ? <MobileSupervisorDashboard /> : <MobileOfficerDashboard />}
      </MobileLayout>
    );
  }

  return (
    <DashboardLayout>
      {user?.role === 'supervisor' ? <SupervisorDashboard /> : <OfficerDashboard />}
    </DashboardLayout>
  );
};

export default Dashboard;