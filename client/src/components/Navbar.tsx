import { Building, Car, Gauge, LayoutDashboard, LogOut, Plus, Settings } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getCurrentUser, hasPermission } from '@/utils/permissions';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    // Keep app_authenticated so user doesn't need to re-enter portal password
    // sessionStorage.removeItem('app_authenticated'); // Don't remove this
    sessionStorage.removeItem('user_authenticated');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('user_role');
    sessionStorage.removeItem('user_fullname');
    sessionStorage.removeItem('user_uuid');
    navigate('/signin'); // Go directly to sign-in instead of portal-access
  };

  // Define all possible nav links with their permission requirements
  const allNavLinks = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      permission: 'canViewDashboard' as const,
    },
    {
      to: '/dispatcher-hub',
      label: 'Dispatcher Hub',
      icon: Gauge,
      permission: 'canViewDispatcherHub' as const,
    },
    {
      to: '/my-rides',
      label: 'My Rides',
      icon: Car,
      permission: 'canViewMyRides' as const,
    },
    {
      to: '/',
      label: 'Create Ride Request',
      icon: Plus,
      permission: 'canCreateInternalRideRequest' as const,
    },
    {
      to: '/service-provider',
      label: 'Create Service Provider',
      icon: Building,
      permission: 'canCreateServiceProvider' as const,
    },
    {
      to: '/vehicle',
      label: 'Create Vehicle',
      icon: Car,
      permission: 'canCreateVehicle' as const,
    },
    {
      to: '/manager',
      label: 'Manager',
      icon: Settings,
      permission: 'canAccessManager' as const,
    },
  ];

  // Filter nav links based on user permissions
  const navLinks = allNavLinks.filter((link) => hasPermission(link.permission));

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="mx-auto container px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/App Name */}
          <span className="text-xl font-bold text-primary">Rural Dispatch</span>

          {/* Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Button
                  key={link.to}
                  asChild
                  variant={isActive(link.to) ? 'default' : 'outline'}
                  size="sm"
                  className={isActive(link.to) ? '' : 'border-gray-300 hover:bg-gray-50'}
                >
                  <Link to={link.to} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{link.label}</span>
                  </Link>
                </Button>
              );
            })}

            <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />

            {/* User Role Badge */}
            {currentUser.role && (
              <Badge variant="secondary" className="hidden md:flex capitalize">
                {currentUser.role.replace('_', ' ')}
              </Badge>
            )}

            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
