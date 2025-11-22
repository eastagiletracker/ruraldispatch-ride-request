import { Building } from 'lucide-react';
import CreateProvider from '../components/CreateProvider';

export default function ServiceProviderHome() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Service Provider</h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            Register and manage transportation service providers
          </p>
        </div>

        {/* Content */}
        <CreateProvider />
      </div>
    </div>
  );
}
