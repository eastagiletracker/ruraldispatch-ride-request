import { getApiUrl } from '@/lib/api';
import type {
  CloseSessionResponse,
  Notification,
  NotificationStats,
  ServiceProvider,
  User,
  Vehicle,
} from '@/types';

export const fetchTopUserMatches = async (searchTerm: string): Promise<User[]> => {
  try {
    const matches = await fetch(getApiUrl(`/api/users/fuzzy/${searchTerm}`));
    if (!matches.ok) {
      console.error('Failed to fetch user matches:', matches.statusText);
      return [];
    }
    return await matches.json();
  } catch (error) {
    console.error('Error fetching user matches:', error);
    return [];
  }
};

export const fetchTopProviderMatches = async (searchTerm: string): Promise<ServiceProvider[]> => {
  try {
    const matches = await fetch(getApiUrl(`/api/providers/fuzzy/${searchTerm}`));
    if (!matches.ok) {
      console.error('Failed to fetch provider matches:', matches.statusText);
      return [];
    }
    return await matches.json();
  } catch (error) {
    console.error('Error fetching provider matches:', error);
    return [];
  }
};

export const fetchTopVehicleMatches = async (searchTerm: string): Promise<Vehicle[]> => {
  try {
    const matches = await fetch(getApiUrl(`/api/vehicles/fuzzy/${searchTerm}`));
    if (!matches.ok) {
      console.error('Failed to fetch vehicle matches:', matches.statusText);
      return [];
    }
    return await matches.json();
  } catch (error) {
    console.error('Error fetching vehicle matches:', error);
    return [];
  }
};

export const fetchCollection = async <T = unknown>(collectionName: string): Promise<T[]> => {
  const response = await fetch(getApiUrl(`/api/${collectionName}`));
  return await response.json();
};

export const fetchDocument = async <T = unknown>(
  collectionName: string,
  documentId: string
): Promise<T> => {
  const response = await fetch(getApiUrl(`/api/${collectionName}/${documentId}`));

  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.statusText}`);
  }

  const text = await response.text();
  if (!text) {
    throw new Error('Empty response from server');
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    console.error('Invalid JSON response:', text);
    throw new Error('Invalid JSON response from server');
  }
};

export const fetchFieldsOfDocument = async <T = unknown>(
  collectionName: string,
  documentId: string,
  fieldNames: string[]
): Promise<T> => {
  const response = await fetch(
    getApiUrl(`/api/${collectionName}/${documentId}/fields/${fieldNames.join(',')}`)
  );
  return await response.json();
};

export const createDocument = async <T = unknown>(
  collectionName: string,
  document: T
): Promise<Response> => {
  return await fetch(getApiUrl(`/api/${collectionName}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(document),
  });
};

export const updateDocument = async <T = unknown>(
  collectionName: string,
  documentId: string,
  replacementDoc: T
): Promise<boolean> => {
  const response = await fetch(getApiUrl(`/api/${collectionName}/${documentId}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(replacementDoc),
  });
  if (response.ok) {
    // Success - let the calling component handle the success message
    return true;
  } else {
    const errorData = await response.json();
    // Error - throw to let the calling component handle it
    const errorMessage = errorData.error || errorData.message || 'Failed to update document';
    const details = errorData.details
      ? `\nDetails: ${JSON.stringify(errorData.details, null, 2)}`
      : '';
    throw new Error(errorMessage + details);
  }
};

// Notification API functions
export const fetchNotificationsByRide = async (rideUuid: string): Promise<Notification[]> => {
  const response = await fetch(getApiUrl(`/api/notifications/ride/${rideUuid}`));
  const data = await response.json();
  return data.notifications || [];
};

export const fetchActiveNotifications = async (rideUuid: string): Promise<Notification[]> => {
  const response = await fetch(getApiUrl(`/api/notifications/active/${rideUuid}`));
  const data = await response.json();
  return data.notifications || [];
};

export const fetchNotificationStats = async (rideUuid: string): Promise<NotificationStats> => {
  const response = await fetch(getApiUrl(`/api/notifications/stats/${rideUuid}`));
  const data = await response.json();
  return (
    data.stats || { totalNotifications: 0, deliveredCount: 0, failedCount: 0, pendingCount: 0 }
  );
};

export const closeRideSession = async (rideUuid: string): Promise<CloseSessionResponse> => {
  const response = await fetch(getApiUrl(`/api/notifications/close-session/${rideUuid}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return await response.json();
};
