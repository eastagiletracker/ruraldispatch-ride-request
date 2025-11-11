import { Car } from 'lucide-react';
import RideRequestForm from '../components/RideRequestForm';
import { getCurrentUser } from '@/utils/permissions';

export default function CaseManagerRideRequest() {
    const currentUser = getCurrentUser();

    return (
        <div className='min-h-screen bg-gray-50'>
            <div className="container mx-auto px-4 py-6 md:py-8">
                {/* Page Header */}
                <div className="mb-6 md:mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Car className="h-5 w-5 text-primary" />
                        </div>
                        <h1 className='text-3xl md:text-4xl font-bold text-foreground'>
                            Request a Ride
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm md:text-base">
                        Fill out the form below to request a ride for a client
                    </p>
                </div>

                {/* Ride Request Form - Case Manager's info is auto-filled from login */}
                <div className='flex flex-col gap-6 w-full justify-center items-center max-w-4xl mx-auto'>
                    <RideRequestForm 
                        caseManagerName={currentUser.fullName || ''}
                        caseManagerUsername={currentUser.username || ''}
                    />
                </div>
            </div>
        </div>
    );
}
