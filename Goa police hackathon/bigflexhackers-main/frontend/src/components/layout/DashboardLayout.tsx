import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { 
  Shield, 
  LogOut, 
  User, 
  Home, 
  Navigation,
  Map,
  FileUp
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = user?.role === 'supervisor' 
    ? [
        { name: 'Dashboard', icon: Home, path: '/dashboard' },
        { name: 'Live Map', icon: Map, path: '/supervisor/live-map' },
        { name: 'Upload Roster', icon: FileUp, path: '/supervisor/roster-upload' },
      ]
    : [
        { name: 'Dashboard', icon: Home, path: '/dashboard' },
        { name: 'My Location', icon: Navigation, path: '/my-location' },
      ];

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-primary shadow-police border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary-foreground">
                  Police Deployment
                </h1>
                <p className="text-sm text-primary-foreground/80">
                  Bandobast Management
                </p>
              </div>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-primary-foreground">
                  {user?.name}
                </div>
                <div className="text-xs text-primary-foreground/80">
                  {user?.rank} • {user?.role === 'supervisor' ? 'Supervisor' : 'Officer'}
                </div>
              </div>
              <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout with top padding to account for fixed header */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <nav className="w-64 bg-card shadow-card border-r min-h-screen">
          <div className="p-6">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="w-full justify-start hover:bg-primary/10 hover:text-primary"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;