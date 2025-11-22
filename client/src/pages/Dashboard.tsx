import { useEffect, useState } from 'react';
import AssignDriver from '../components/AssignDriver';
import RideRequests from '../components/RideRequests';
import SchedulerStatus from '../components/SchedulerStatus';
import { getCurrentUserRole, hasAnyRole } from '../utils/permissions';

export default function Dashboard() {
  const [selectedRideRequestId, setSelectedRideRequestId] = useState(null);

  // Only show scheduler for admin and dispatcher roles
  const canViewScheduler = hasAnyRole(['admin', 'dispatcher']);

  // Debug logging
  useEffect(() => {
    const currentRole = getCurrentUserRole();
    console.log('Dashboard - User role:', currentRole);
    console.log('Dashboard - Can view scheduler:', canViewScheduler);
  }, [canViewScheduler]);

  function closeAssignDriverPanel() {
    setSelectedRideRequestId(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage ride requests and assignments
          </p>
        </div>

        {/* Content */}
        <RideRequests callbackFn={setSelectedRideRequestId} />

        {/* Scheduled Tasks Status - Admin/Dispatcher Only - Bottom of Page
                {canViewScheduler && (
                    <div className="mt-8">
                        <SchedulerStatus />
                    </div>
                )} */}

        {/* Assign Driver Dialog */}
        {selectedRideRequestId && (
          <AssignDriver
            selectedRideRequestId={selectedRideRequestId}
            cancelFn={closeAssignDriverPanel}
          />
        )}
      </div>
    </div>
  );
}
