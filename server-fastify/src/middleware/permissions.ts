/**
 * Role-based permissions system
 * Defines what each user role can do in the system
 */

export type SystemRole = 'admin' | 'dispatcher' | 'driver' | 'case_manager';

export type Permission =
  | 'canViewDashboard'
  | 'canViewAllRides'
  | 'canAssignRides'
  | 'canManageRides'
  | 'canCreateServiceProvider'
  | 'canViewServiceProviders'
  | 'canEditServiceProviders'
  | 'canDeleteServiceProviders'
  | 'canCreateVehicle'
  | 'canViewVehicles'
  | 'canEditVehicles'
  | 'canDeleteVehicles'
  | 'canCreateUser'
  | 'canViewUsers'
  | 'canEditUsers'
  | 'canDeleteUsers'
  | 'canCreateInternalRideRequest'
  | 'canManageSystemUsers'
  | 'canViewSystemUsers'
  | 'canViewAssignedRides'
  | 'canViewMyRides'
  | 'canUpdateRideStatus'
  | 'canViewDispatcherHub'
  | 'canAccessManager';

/**
 * Permission matrix defining what each role can do
 */
export const PERMISSIONS: Record<SystemRole, Record<Permission, boolean>> = {
  admin: {
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

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: SystemRole, permission: Permission): boolean {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;
  return rolePermissions[permission] === true;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: SystemRole): Record<Permission, boolean> | null {
  return PERMISSIONS[role] || null;
}
