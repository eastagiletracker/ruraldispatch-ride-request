/**
 * Role-based Access Control (RBAC) Utility
 *
 * Roles:
 * - admin: Full access to all features
 * - dispatcher: View/manage/assign ride requests, manage dashboard
 * - driver: View assigned rides, update ride status
 * - case_manager: Submit ride requests via public form (minimal internal access)
 */

/**
 * Check if portal authentication is still valid (within 24 hours)
 * Returns true if authenticated and not expired, false otherwise
 */
export function isPortalAuthValid(): boolean {
    // Check both localStorage and sessionStorage
    const localAuth = localStorage.getItem('app_authenticated');
    const sessionAuth = sessionStorage.getItem('app_authenticated');
    
    const authData = localAuth || sessionAuth;
    
    if (!authData) {
        return false;
    }
    
    try {
        const parsed = JSON.parse(authData);
        const now = new Date().getTime();
        
        // Check if authenticated and not expired
        if (parsed.authenticated === true && parsed.expiresAt > now) {
            return true;
        }
        
        // If expired, clean up
        localStorage.removeItem('app_authenticated');
        sessionStorage.removeItem('app_authenticated');
        return false;
    } catch (error) {
        // If parsing fails (old format 'true' string), clean up
        localStorage.removeItem('app_authenticated');
        sessionStorage.removeItem('app_authenticated');
        return false;
    }
}

export type UserRole = 'admin' | 'dispatcher' | 'driver' | 'case_manager';

export interface UserPermissions {
    // Dashboard & Ride Management
    canViewDashboard: boolean;
    canViewAllRides: boolean;
    canAssignRides: boolean;
    canManageRides: boolean;

    // Service Provider & Vehicle Management
    canCreateServiceProvider: boolean;
    canViewServiceProviders: boolean;
    canEditServiceProviders: boolean;
    canDeleteServiceProviders: boolean;

    canCreateVehicle: boolean;
    canViewVehicles: boolean;
    canEditVehicles: boolean;
    canDeleteVehicles: boolean;

    // User Management (Service Users - riders, etc.)
    canCreateUser: boolean;
    canViewUsers: boolean;
    canEditUsers: boolean;
    canDeleteUsers: boolean;

    // Internal Ride Request Creation
    canCreateInternalRideRequest: boolean;

    // System User Management (Admin users)
    canManageSystemUsers: boolean;
    canViewSystemUsers: boolean;

    // Driver-specific
    canViewAssignedRides: boolean;
    canViewMyRides: boolean;
    canUpdateRideStatus: boolean;

    // Dispatcher-specific
    canViewDispatcherHub: boolean;

    // Admin-specific
    canAccessManager: boolean;
}

/**
 * Get the current user's role from session storage
 */
export function getCurrentUserRole(): UserRole | null {
    const role = sessionStorage.getItem('user_role');
    return role as UserRole | null;
}

/**
 * Get the current user's full info from session storage
 */
export function getCurrentUser() {
    return {
        username: sessionStorage.getItem('username'),
        role: getCurrentUserRole(),
        fullName: sessionStorage.getItem('user_fullname'),
        uuid: sessionStorage.getItem('user_uuid'),
        isAuthenticated: sessionStorage.getItem('user_authenticated') === 'true'
    };
}

/**
 * Get permissions for a specific role
 */
export function getPermissionsForRole(role: UserRole): UserPermissions {
    const permissions: Record<UserRole, UserPermissions> = {
        admin: {
            // Full access to everything
            canViewDashboard: true,
            canViewAllRides: true,
            canAssignRides: true,
            canManageRides: true,
            canCreateServiceProvider: true,
            canViewServiceProviders: true,
            canEditServiceProviders: true,
            canDeleteServiceProviders: true,
            canCreateVehicle: true,
            canViewVehicles: true,
            canEditVehicles: true,
            canDeleteVehicles: true,
            canCreateUser: true,
            canViewUsers: true,
            canEditUsers: true,
            canDeleteUsers: true,
            canCreateInternalRideRequest: true,
            canManageSystemUsers: true,
            canViewSystemUsers: true,
            canViewAssignedRides: true,
            canViewMyRides: false,
            canUpdateRideStatus: true,
            canViewDispatcherHub: true,
            canAccessManager: true,
        },
        dispatcher: {
            // Ride management and assignment
            canViewDashboard: true,
            canViewAllRides: true,
            canAssignRides: true,
            canManageRides: true,
            canCreateServiceProvider: true,
            canViewServiceProviders: true,
            canEditServiceProviders: true,
            canDeleteServiceProviders: false,
            canCreateVehicle: true,
            canViewVehicles: true,
            canEditVehicles: true,
            canDeleteVehicles: false,
            canCreateUser: true,
            canViewUsers: true,
            canEditUsers: true,
            canDeleteUsers: false,
            canCreateInternalRideRequest: true,
            canManageSystemUsers: false,
            canViewSystemUsers: false,
            canViewAssignedRides: true,
            canViewMyRides: false,
            canUpdateRideStatus: true,
            canViewDispatcherHub: true,
            canAccessManager: false,
        },
        driver: {
            // View and update assigned rides only
            canViewDashboard: false,
            canViewAllRides: false,
            canAssignRides: false,
            canManageRides: false,
            canCreateServiceProvider: false,
            canViewServiceProviders: false,
            canEditServiceProviders: false,
            canDeleteServiceProviders: false,
            canCreateVehicle: false,
            canViewVehicles: false,
            canEditVehicles: false,
            canDeleteVehicles: false,
            canCreateUser: false,
            canViewUsers: false,
            canEditUsers: false,
            canDeleteUsers: false,
            canCreateInternalRideRequest: false,
            canManageSystemUsers: false,
            canViewSystemUsers: false,
            canViewAssignedRides: true,
            canViewMyRides: true,
            canUpdateRideStatus: true,
            canViewDispatcherHub: false,
            canAccessManager: false,
        },
        case_manager: {
            // Case managers can create ride requests for their clients
            canViewDashboard: false,
            canViewAllRides: false,
            canAssignRides: false,
            canManageRides: false,
            canCreateServiceProvider: false,
            canViewServiceProviders: false,
            canEditServiceProviders: false,
            canDeleteServiceProviders: false,
            canCreateVehicle: false,
            canViewVehicles: false,
            canEditVehicles: false,
            canDeleteVehicles: false,
            canCreateUser: true,
            canViewUsers: true,
            canEditUsers: false,
            canDeleteUsers: false,
            canCreateInternalRideRequest: true,
            canManageSystemUsers: false,
            canViewSystemUsers: false,
            canViewAssignedRides: false,
            canViewMyRides: false,
            canUpdateRideStatus: false,
            canViewDispatcherHub: false,
            canAccessManager: false,
        },
    };

    return permissions[role];
}

/**
 * Get permissions for the current user
 */
export function getCurrentUserPermissions(): UserPermissions | null {
    const role = getCurrentUserRole();
    if (!role) return null;
    return getPermissionsForRole(role);
}

/**
 * Check if current user has a specific permission
 */
export function hasPermission(permission: keyof UserPermissions): boolean {
    const permissions = getCurrentUserPermissions();
    if (!permissions) return false;
    return permissions[permission];
}

/**
 * Check if current user has ALL of the specified permissions
 */
export function hasAllPermissions(requiredPermissions: (keyof UserPermissions)[]): boolean {
    return requiredPermissions.every(permission => hasPermission(permission));
}

/**
 * Check if current user has ANY of the specified permissions
 */
export function hasAnyPermission(requiredPermissions: (keyof UserPermissions)[]): boolean {
    return requiredPermissions.some(permission => hasPermission(permission));
}

/**
 * Check if current user has a specific role
 */
export function hasRole(role: UserRole): boolean {
    return getCurrentUserRole() === role;
}

/**
 * Check if current user has ANY of the specified roles
 */
export function hasAnyRole(roles: UserRole[]): boolean {
    const currentRole = getCurrentUserRole();
    return currentRole ? roles.includes(currentRole) : false;
}

/**
 * Route access configuration
 */
export const RouteAccess = {
    '/dashboard': ['admin', 'dispatcher', 'driver'],
    '/dispatcher-hub': ['admin', 'dispatcher'], // Dispatcher control center
    '/my-rides': ['admin', 'driver'], // Driver's personalized ride view
    '/': ['admin', 'dispatcher', 'case_manager'], // Internal create ride request
    '/ride-request': ['admin', 'dispatcher', 'case_manager'], // Ride request form (same as home)
    '/service-provider': ['admin', 'dispatcher'],
    '/vehicle': ['admin', 'dispatcher'],
    '/manager': ['admin'], // Admin-only system manager
} as const;

/**
 * Check if current user can access a specific route
 */
export function canAccessRoute(path: string): boolean {
    const allowedRoles = RouteAccess[path as keyof typeof RouteAccess];

    // If route is not in config, assume it's protected and requires admin
    if (allowedRoles === undefined) {
        return hasRole('admin');
    }

    return hasAnyRole([...allowedRoles] as UserRole[]);
}
