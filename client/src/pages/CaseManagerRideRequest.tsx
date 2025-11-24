import { Car } from 'lucide-react';
import { getCurrentUser } from '@/utils/permissions';
import RideRequestForm from '../components/RideRequestForm';

export default function CaseManagerRideRequest() {
  const currentUser = getCurrentUser();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Request a Ride</h1>
          </div>
          <p className="text-sm text-muted-foreground md:text-base">
            Fill out the form below to request a ride for a client
          </p>
        </div>

        {/* Ride Request Form - Case Manager's info is auto-filled from login */}
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-6">
          <RideRequestForm
            caseManagerName={currentUser.fullName || ''}
            caseManagerUsername={currentUser.username || ''}
          />
        </div>
      </div>
    </div>
  );
}
