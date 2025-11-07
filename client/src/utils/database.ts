import type { User, ServiceProvider, Vehicle, Notification, NotificationStats, CloseSessionResponse } from '@/types';

export const fetchTopUserMatches = async (searchTerm: string): Promise<User[]> => {
    const matches = await fetch(`/api/users/fuzzy/${searchTerm}`);
    return await matches.json();
}

export const fetchTopProviderMatches = async (searchTerm: string): Promise<ServiceProvider[]> => {
    const matches = await fetch(`/api/providers/fuzzy/${searchTerm}`);
    return await matches.json();
}

export const fetchTopVehicleMatches = async (searchTerm: string): Promise<Vehicle[]> => {
    const matches = await fetch(`/api/vehicles/fuzzy/${searchTerm}`);
    return await matches.json();
}

export const fetchCollection = async <T = unknown>(collectionName: string): Promise<T[]> => {
    const response = await fetch(`/api/${collectionName}`);
    return await response.json();
}

export const fetchDocument = async <T = unknown>(collectionName: string, documentId: string): Promise<T> => {
    const response = await fetch(`/api/${collectionName}/${documentId}`);
    return await response.json();
}

export const fetchFieldsOfDocument = async <T = unknown>(collectionName: string, documentId: string, fieldNames: string[]): Promise<T> => {
    const response = await fetch(`/api/${collectionName}/${documentId}/fields/${fieldNames.join(',')}`);
    return await response.json();
}

export const createDocument = async <T = unknown>(collectionName: string, document: T): Promise<Response> => {
    return await fetch(`/api/${collectionName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(document),
    });
}

export const updateDocument = async <T = unknown>(collectionName: string, documentId: string, replacementDoc: T): Promise<boolean> => {
    const response = await fetch(`/api/${collectionName}/${documentId}`, {
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
        throw new Error(errorData.message || 'Failed to update document');
    }
}

// Notification API functions
export const fetchNotificationsByRide = async (rideUuid: string): Promise<Notification[]> => {
    const response = await fetch(`/api/notifications/ride/${rideUuid}`);
    const data = await response.json();
    return data.notifications || [];
}

export const fetchActiveNotifications = async (rideUuid: string): Promise<Notification[]> => {
    const response = await fetch(`/api/notifications/active/${rideUuid}`);
    const data = await response.json();
    return data.notifications || [];
}

export const fetchNotificationStats = async (rideUuid: string): Promise<NotificationStats> => {
    const response = await fetch(`/api/notifications/stats/${rideUuid}`);
    const data = await response.json();
    return data.stats || { totalNotifications: 0, deliveredCount: 0, failedCount: 0, pendingCount: 0 };
}

export const closeRideSession = async (rideUuid: string): Promise<CloseSessionResponse> => {
    const response = await fetch(`/api/notifications/close-session/${rideUuid}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    return await response.json();
}
