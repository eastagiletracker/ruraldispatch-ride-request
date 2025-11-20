/**
 * Simple role-based permission middleware for session-based authentication
 * Checks user role from session data passed in headers
 */

const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        // Get user role from headers (sent by frontend)
        const userRole = req.headers['x-user-role'];
        
        if (!userRole) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        // Define permissions for each role
        const permissions = {
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

        const rolePermissions = permissions[userRole];
        
        if (!rolePermissions) {
            return res.status(403).json({ 
                success: false, 
                message: 'Invalid role' 
            });
        }

        if (!rolePermissions[requiredPermission]) {
            return res.status(403).json({ 
                success: false, 
                message: 'Insufficient permissions',
                required: requiredPermission,
                role: userRole
            });
        }

        next();
    };
};

export { checkPermission };
