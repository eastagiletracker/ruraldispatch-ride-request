import { ArrowLeft, Home, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser, getPermissionsForRole } from '@/utils/permissions';

export default function Unauthorized() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  // Determine the appropriate home route based on user role
  const getHomeRoute = () => {
    if (!user.role) return '/signin';

    const roleRoutes: Record<string, string> = {
      admin: '/dashboard',
      dispatcher: '/dispatcher-hub',
      driver: '/my-rides',
      case_manager: '/ride-request',
    };

    return roleRoutes[user.role] || '/signin';
  };

  // Get available features for the user's role
  const getAvailableFeatures = () => {
    if (!user.role) return [];

    const permissions = getPermissionsForRole(user.role);
    const features = [];

    if (permissions.canViewDashboard) features.push('Dashboard');
    if (permissions.canViewDispatcherHub) features.push('Dispatcher Hub');
    if (permissions.canViewMyRides) features.push('My Rides');
    if (permissions.canCreateInternalRideRequest) features.push('Create Ride Requests');
    if (permissions.canCreateServiceProvider) features.push('Manage Service Providers');
    if (permissions.canCreateVehicle) features.push('Manage Vehicles');
    if (permissions.canCreateUser) features.push('Manage Users');
    if (permissions.canAccessManager) features.push('System Manager');

    return features;
  };

  const availableFeatures = getAvailableFeatures();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 to-destructive/10 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription className="text-base">
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription className="text-center">
              <p className="font-semibold mb-2">Current User: {user.fullName}</p>
              <p className="text-sm text-muted-foreground capitalize">
                Role: {user.role?.replace('_', ' ')}
              </p>
            </AlertDescription>
          </Alert>

          {availableFeatures.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-center">Available Features for Your Role:</h3>
              <ul className="space-y-2">
                {availableFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center justify-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button onClick={() => navigate(getHomeRoute())} className="gap-2">
              <Home className="h-4 w-4" />
              Go to Home
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            If you believe you should have access to this page, please contact your system
            administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
