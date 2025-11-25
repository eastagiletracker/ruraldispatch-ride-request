import type React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import CaseManagerRideRequest from './pages/CaseManagerRideRequest';
import CreateRideRequest from './pages/CreateRideRequest';
import Dashboard from './pages/Dashboard';
import DispatcherHub from './pages/DispatcherHub';
import Manager from './pages/Manager';
import MyRides from './pages/MyRides';
import PasswordProtection from './pages/PasswordProtection';
import Privacy from './pages/Privacy';
import PublicRideRequest from './pages/PublicRideRequest';
import ServiceProviderHome from './pages/ServiceProviderHome';
import SignIn from './pages/SignIn';
import SMS from './pages/SMS';
import SMSOptOut from './pages/SMSOptOut';
import SMSTerms from './pages/SMSTerms';
import Terms from './pages/Terms';
import Unauthorized from './pages/Unauthorized';
import VehicleHome from './pages/VehicleHome';
import {
  hasPermission,
  hasRole,
  isPortalAuthValid,
  type UserPermissions,
} from './utils/permissions';

// Simple Portal-Only Protected Route (for public demo - no user authentication)
interface SimpleProtectedRouteProps {
  children: React.ReactNode;
}

function SimpleProtectedRoute({ children }: SimpleProtectedRouteProps) {
  // Only check portal authentication (hackct25 password)
  const isAppAuthenticated = isPortalAuthValid();

  if (!isAppAuthenticated) {
    return <Navigate to="/portal-access" replace />;
  }

  return <>{children}</>;
}

// Full Protected Route Component with Role-based Access Control (for admin/dispatcher)
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof UserPermissions;
}

function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  // Check if portal authentication is still valid (within 24 hours)
  const isAppAuthenticated = isPortalAuthValid();
  const isUserAuthenticated = sessionStorage.getItem('user_authenticated') === 'true';

  if (!isAppAuthenticated) {
    return <Navigate to="/portal-access" replace />;
  }

  if (!isUserAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Check role-based permission if specified
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Router future={{ v7_startTransition: true }}>
      <Routes>
        {/* Public Routes - No authentication required */}
        <Route
          path="/sms"
          element={
            <>
              <SMS />
              <Toaster />
            </>
          }
        />
        <Route
          path="/sms-opt-out"
          element={
            <>
              <SMSOptOut />
              <Toaster />
            </>
          }
        />
        <Route
          path="/terms"
          element={
            <>
              <Terms />
              <Toaster />
            </>
          }
        />
        <Route
          path="/privacy"
          element={
            <>
              <Privacy />
              <Toaster />
            </>
          }
        />
        <Route
          path="/sms-terms"
          element={
            <>
              <SMSTerms />
              <Toaster />
            </>
          }
        />

        {/* Authentication Routes */}
        <Route
          path="/portal-access"
          element={
            <>
              <PasswordProtection />
              <Toaster />
            </>
          }
        />
        <Route
          path="/signin"
          element={
            <>
              <SignIn />
              <Toaster />
            </>
          }
        />
        <Route
          path="/unauthorized"
          element={
            <>
              <Unauthorized />
              <Toaster />
            </>
          }
        />

        {/* Public Demo Route - Only requires portal password (hackct25) */}
        {/* Simplified: No user authentication, no user search/add, no navbar */}
        <Route
          path="/"
          element={
            <SimpleProtectedRoute>
              <div className="min-h-screen flex flex-col">
                {/* No Navbar for public demo - just branding */}
                <header className="bg-white border-b shadow-sm">
                  <div className="mx-auto container px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                      <span className="text-xl font-bold text-primary">Rural Dispatch</span>
                    </div>
                  </div>
                </header>
                <main className="container mx-auto px-4 py-8 flex-grow">
                  <PublicRideRequest />
                </main>
                <Footer />
              </div>
            </SimpleProtectedRoute>
          }
        />

        {/* Legacy routes kept for admin/dispatcher access (requires full authentication) */}
        <Route
          path="/ride-request"
          element={
            <ProtectedRoute requiredPermission="canCreateInternalRideRequest">
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="container mx-auto px-4 py-8 flex-grow">
                  {hasRole('case_manager') ? <CaseManagerRideRequest /> : <CreateRideRequest />}
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/service-provider"
          element={
            <ProtectedRoute requiredPermission="canCreateServiceProvider">
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="container mx-auto px-4 py-8 flex-grow">
                  <ServiceProviderHome />
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle"
          element={
            <ProtectedRoute requiredPermission="canCreateVehicle">
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="container mx-auto px-4 py-8 flex-grow">
                  <VehicleHome />
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredPermission="canViewDashboard">
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="container mx-auto px-4 py-8 flex-grow">
                  <Dashboard />
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager"
          element={
            <ProtectedRoute requiredPermission="canAccessManager">
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <Manager />
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-rides"
          element={
            <ProtectedRoute requiredPermission="canViewMyRides">
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="container mx-auto px-4 py-8 flex-grow">
                  <MyRides />
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dispatcher-hub"
          element={
            <ProtectedRoute requiredPermission="canViewDispatcherHub">
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="container mx-auto px-4 py-8 flex-grow">
                  <DispatcherHub />
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-center" duration={7000} closeButton />
    </AuthProvider>
  );
}

export default App;
