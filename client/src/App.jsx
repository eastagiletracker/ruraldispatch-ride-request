import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from '@/components/ui/sonner'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ServiceProviderHome from './pages/ServiceProviderHome'
import Dashboard from './pages/Dashboard'
import CreateRideRequest from './pages/CreateRideRequest'
import VehicleHome from "./pages/VehicleHome";
import SMSConsent from "./pages/SMSConsent";
import SMSOptOut from "./pages/SMSOptOut";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import SMSTerms from "./pages/SMSTerms";


function AppRoutes() {
  return (
    <Router future={{ v7_startTransition: true }}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex-grow">
          <Routes>
            <Route path="/" element={<CreateRideRequest />} />
            <Route path="/service-provider" element={<ServiceProviderHome />} />
            <Route path="/vehicle" element={<VehicleHome />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sms-consent" element={<SMSConsent />} />
            <Route path="/sms-opt-out" element={<SMSOptOut />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/sms-terms" element={<SMSTerms />} />
          </Routes>
        </main>
        <Footer />
        <Toaster />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App 