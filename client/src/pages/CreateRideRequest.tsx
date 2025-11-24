import { Car } from 'lucide-react';
import RequestRide from '../components/RequestRide';

export default function CreateRideRequest() {
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
            Book your transportation quickly and easily
          </p>
        </div>

        {/* Content */}
        <RequestRide />
      </div>
    </div>
  );
}
