import type { RideRequest } from './types';

// Helpers to guard optional rider/driver
export const getRider = (ride: RideRequest) =>
  ride?.rider && ride.rider.length > 0 ? ride.rider[0] : undefined;

export const getDriver = (ride: RideRequest) =>
  ride?.driver && ride.driver.length > 0 ? ride.driver[0] : undefined;

// Helper to get rider name with fallback to serviceUserName
export const getRiderName = (ride: RideRequest) => {
  const rider = getRider(ride);
  return rider?.fullName || ride?.serviceUserName || 'Unknown';
};
