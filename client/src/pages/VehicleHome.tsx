import { Car } from 'lucide-react';
import CreateVehicle from '../components/CreateVehicle';

export default function VehicleHome() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Vehicle Management</h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            Register and manage vehicles in your fleet
          </p>
        </div>

        {/* Content */}
        <CreateVehicle />
      </div>
    </div>
  );
}
