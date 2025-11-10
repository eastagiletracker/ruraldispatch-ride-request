import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from '@/components/ui/sonner'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PasswordProtection from './pages/PasswordProtection'
import SignIn from './pages/SignIn'
import Unauthorized from './pages/Unauthorized'
import ServiceProviderHome from './pages/ServiceProviderHome'
import Dashboard from './pages/Dashboard'
import DispatcherHub from './pages/DispatcherHub'
import MyRides from './pages/MyRides'
import CreateRideRequest from './pages/CreateRideRequest'
import CaseManagerRideRequest from './pages/CaseManagerRideRequest'
import Manager from './pages/Manager'
import VehicleHome from "./pages/VehicleHome";
import SMSConsent from "./pages/SMSConsent";
import SMSOptOut from "./pages/SMSOptOut";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import SMSTerms from "./pages/SMSTerms";
import SMS from "./pages/SMS";
import { hasPermission, isPortalAuthValid, hasRole, type UserPermissions } from './utils/permissions';

// Protected Route Component with Role-based Access Control
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
        <Route path="/sms" element={<><SMS /><Toaster /></>} />
        <Route path="/sms-consent" element={<><SMSConsent /><Toaster /></>} />
        <Route path="/sms-opt-out" element={<><SMSOptOut /><Toaster /></>} />
        <Route path="/terms" element={<><Terms /><Toaster /></>} />
        <Route path="/privacy" element={<><Privacy /><Toaster /></>} />
        <Route path="/sms-terms" element={<><SMSTerms /><Toaster /></>} />

        {/* Authentication Routes */}
        <Route path="/portal-access" element={<><PasswordProtection /><Toaster /></>} />
        <Route path="/signin" element={<><SignIn /><Toaster /></>} />
        <Route path="/unauthorized" element={<><Unauthorized /><Toaster /></>} />

        {/* Protected Routes - Require authentication and role-based permissions */}
        {/* Admin/Dispatcher: Full ride request form with "Add a User" button */}
        <Route path="/" element={
          <ProtectedRoute requiredPermission="canCreateInternalRideRequest">
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="container mx-auto px-4 py-8 flex-grow">
                {hasRole('case_manager') ? <CaseManagerRideRequest /> : <CreateRideRequest />}
              </main>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        {/* Case Manager: Simplified ride request form without "Add a User" */}
        <Route path="/ride-request" element={
          <ProtectedRoute requiredPermission="canCreateInternalRideRequest">
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="container mx-auto px-4 py-8 flex-grow">
                {hasRole('case_manager') ? <CaseManagerRideRequest /> : <CreateRideRequest />}
              </main>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/service-provider" element={
          <ProtectedRoute requiredPermission="canCreateServiceProvider">
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="container mx-auto px-4 py-8 flex-grow">
                <ServiceProviderHome />
              </main>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/vehicle" element={
          <ProtectedRoute requiredPermission="canCreateVehicle">
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="container mx-auto px-4 py-8 flex-grow">
                <VehicleHome />
              </main>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute requiredPermission="canViewDashboard">
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="container mx-auto px-4 py-8 flex-grow">
                <Dashboard />
              </main>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/manager" element={
          <ProtectedRoute requiredPermission="canAccessManager">
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow">
                <Manager />
              </main>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/my-rides" element={
          <ProtectedRoute requiredPermission="canViewMyRides">
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="container mx-auto px-4 py-8 flex-grow">
                <MyRides />
              </main>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/dispatcher-hub" element={
          <ProtectedRoute requiredPermission="canViewDispatcherHub">
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="container mx-auto px-4 py-8 flex-grow">
                <DispatcherHub />
              </main>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster />
    </AuthProvider>
  );
}

export default App 