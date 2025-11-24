// Helper to get rider phone with fallback to riderPhone or serviceUserPhone
export const getRiderPhone = (ride: RideRequest) => {
  const rider = getRider(ride);
  return rider?.phone || ride?.riderPhone || ride?.serviceUserPhone || 'N/A';
};
import type { RideRequest } from './types';

// Helpers to guard optional rider/driver
export const getRider = (ride: RideRequest) =>
  ride?.rider && ride.rider.length > 0 ? ride.rider[0] : undefined;

export const getDriver = (ride: RideRequest) =>
  ride?.driver && ride.driver.length > 0 ? ride.driver[0] : undefined;

// Helper to get rider name with fallback to riderName or serviceUserName
export const getRiderName = (ride: RideRequest) => {
  const rider = getRider(ride);
  return rider?.fullName || ride?.riderName || ride?.serviceUserName || 'Unknown';
};
