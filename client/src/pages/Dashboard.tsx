import RideRequests from '../components/RideRequests';
import {useState} from "react";
import AssignDriver from "../components/AssignDriver";

export default function Dashboard() {

    const [selectedRideRequestId, setSelectedRideRequestId] = useState(null);

    function closeAssignDriverPanel()
    {
        setSelectedRideRequestId(null);
    }

    return (
        <div className='min-h-screen bg-gray-50'>
            <div className="container mx-auto px-4 py-6 md:py-8">
                {/* Page Header */}
                <div className="mb-6 md:mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base">
                        Manage ride requests and assignments
                    </p>
                </div>

                {/* Content */}
                <RideRequests callbackFn={setSelectedRideRequestId} />

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
