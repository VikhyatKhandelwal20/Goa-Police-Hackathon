import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { 
  Shield, 
  LogOut, 
  User, 
  Home, 
  Navigation,
  Menu,
  X,
  Map,
  FileUp
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface MobileLayoutProps {
  children: ReactNode;
}

const MobileLayout = ({ children }: MobileLayoutProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      {/* Mobile Header */}
      <header className="bg-gradient-primary shadow-police border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-foreground">
                  Police Deployment
                </h1>
                <p className="text-xs text-primary-foreground/80">
                  Bandobast Management
                </p>
              </div>
            </div>

            {/* Menu Button */}
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="text-sm font-medium text-primary-foreground">
                  {user?.name}
                </div>
                <div className="text-xs text-primary-foreground/80">
                  {user?.rank} • {user?.role === 'supervisor' ? 'Supervisor' : 'Officer'}
                </div>
              </div>
              
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-foreground hover:bg-primary-foreground/20 p-2"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col h-full">
                    {/* User Info */}
                    <div className="flex items-center space-x-3 p-4 border-b">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{user?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user?.rank} • {user?.role === 'supervisor' ? 'Supervisor' : 'Officer'}
                        </div>
                      </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4">
                      <div className="space-y-2">
                        {navigationItems.map((item) => (
                          <Button
                            key={item.name}
                            variant="ghost"
                            className="w-full justify-start hover:bg-primary/10 hover:text-primary"
                            onClick={() => {
                              navigate(item.path);
                              setIsMenuOpen(false);
                            }}
                          >
                            <item.icon className="w-4 h-4 mr-3" />
                            {item.name}
                          </Button>
                        ))}
                      </div>
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:bg-destructive/10"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-40">
        <div className={`grid gap-1 p-2 ${navigationItems.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {navigationItems.map((item, index) => (
            <Button
              key={item.name}
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1 h-16 text-xs"
              onClick={() => navigate(item.path)}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.name}</span>
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;
