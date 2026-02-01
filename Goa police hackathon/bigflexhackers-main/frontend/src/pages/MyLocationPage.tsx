import { useAuthStore } from '@/store/authStore';
import { useIsMobile } from '@/hooks/use-mobile';
import MyLocation from '@/pages/MyLocation';
import MobileLayout from '@/components/layout/MobileLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';

const MyLocationPage = () => {
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
        <MyLocation />
      </MobileLayout>
    );
  }

  return (
    <DashboardLayout>
      <MyLocation />
    </DashboardLayout>
  );
};

export default MyLocationPage;
