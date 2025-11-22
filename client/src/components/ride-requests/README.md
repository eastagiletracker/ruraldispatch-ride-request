# Ride Requests Components

This folder contains a modular breakdown of the RideRequests component, organized for better maintainability and reusability.

## Structure

```
ride-requests/
├── index.tsx                    # Main component that orchestrates everything
├── types.ts                     # TypeScript interfaces and types
├── helpers.ts                   # Utility functions (getRider, getDriver, getRiderName)
├── SkeletonComponents.tsx       # Loading skeleton components
├── PendingRideCard.tsx          # Mobile card view for pending rides
├── PendingRideRow.tsx           # Desktop table row for pending rides
├── AssignedRideCard.tsx         # Mobile card view for assigned rides
├── AssignedRideRow.tsx          # Desktop table row for assigned rides
├── CompletedRideCard.tsx        # Mobile card view for completed rides
├── CompletedRideRow.tsx         # Desktop table row for completed rides
├── CancelRideModal.tsx          # Modal for canceling ride requests
└── SmsModal.tsx                 # Modal for viewing SMS conversations
```

## Components

### Main Component
- **index.tsx**: Contains the main RideRequests component with state management, data fetching, and the three main sections (Pending, Assigned, Completed).

### Type Definitions
- **types.ts**: Defines the `RideRequest` and `RideRequestsProps` interfaces used throughout the components.

### Helpers
- **helpers.ts**: Utility functions for safely accessing rider/driver data from ride objects.

### Skeleton Components
- **SkeletonComponents.tsx**: Loading states for both card and table views.

### Pending Rides
- **PendingRideCard.tsx**: Mobile-optimized card for pending ride requests.
- **PendingRideRow.tsx**: Desktop table row for pending ride requests.

### Assigned Rides
- **AssignedRideCard.tsx**: Mobile-optimized card for active assigned rides.
- **AssignedRideRow.tsx**: Desktop table row for active assigned rides.

### Completed Rides
- **CompletedRideCard.tsx**: Mobile-optimized card for completed rides.
- **CompletedRideRow.tsx**: Desktop table row for completed rides.

### Modals
- **CancelRideModal.tsx**: Confirmation dialog for canceling ride requests.
- **SmsModal.tsx**: Dialog for viewing SMS conversation history for a ride.

## Usage

The component is re-exported from `/components/RideRequests.tsx` for backward compatibility:

```tsx
import RideRequests from '@/components/RideRequests';

<RideRequests callbackFn={handleAssignDriver} />
```

## Benefits of This Structure

1. **Modularity**: Each component has a single, clear responsibility.
2. **Reusability**: Card and row components can be reused or customized independently.
3. **Maintainability**: Easier to locate and modify specific features.
4. **Testability**: Smaller components are easier to unit test.
5. **Type Safety**: Shared types ensure consistency across all components.
6. **Code Organization**: Similar to the `manager/` folder structure for consistency.

## Future Improvements

- Consider extracting the data fetching logic into a custom hook
- Add unit tests for each component
- Consider adding a `useRideRequests` hook for state management
- Extract the filtering/sorting logic into separate utility functions
