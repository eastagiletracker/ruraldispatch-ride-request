# Authentication & Authorization Guide

## Overview

Rural Dispatch uses a **two-layer authentication system** with role-based access control (RBAC):

1. **Portal Password** (`hackct25`) - Shared password for initial access
2. **User Credentials** (username/password) - Individual login from `system_users` table

The application authenticates users via the `system_users` table. Service providers (drivers) have **profile data** in `service_providers` with email/password fields, but these are **NOT used for authentication**.

---

## Current Authentication Flow

```
1. User visits protected route
   ↓
2. Redirected to /portal-access
   - Enter portal password: hackct25
   - Password stored in localStorage (24-hour expiration)
   ↓
3. Redirected to /signin
   - Enter USERNAME and password (not email!)
    - POST to /api/auth/login
    - Authenticates against system_users table
   ↓
4. Role-based redirect:
   - admin → /dashboard
   - dispatcher → /dispatcher-hub
   - driver → /my-rides
   - case_manager → /ride-request
   ↓
5. Access routes based on role permissions
```

---

## User Roles

### 1. Admin (3 Users)
**Who**: System administrators
**Access Level**: Full system access
**Permissions**:
- Access System Manager (manage all data: riders, providers, vehicles, case managers, drivers)
- Create/edit/delete users, providers, vehicles
- View all rides
- Assign drivers to rides
- Request rides for users

**Demo Credentials**: 
- `natecooper` / `natecooper123` | +18313251472
- `cassiebrinen` / `cassiebrinen123` | +18777804236
- `dominiquemorris` / `dominiquemorris123` | +18777804236

---

### 2. Dispatcher (Dispatch Staff)
**Who**: Team members coordinating ride requests
**Access Level**: Ride coordination and assignment
**Permissions**:
- View all pending ride requests
- Assign drivers to rides
- Manage ride requests and statuses
- Create service providers and vehicles
- Request rides for users
- Edit ride assignments
- **Cannot** delete providers or vehicles
- **Cannot** delete system users (admins/case managers)
- **Cannot** access System Manager

**Demo Credentials**: 
- `dispatcher` / `dispatch123` | +18777804236

---

### 3. Case Manager
**Who**: People managing rides for others (caregivers, guardians, social workers)
**Access Level**: Limited - ride requests only
**Permissions**:
- Request rides on behalf of riders
- Search for existing riders
- View ride request history
- **Cannot** assign drivers or vehicles
- **Cannot** see all rides (only their requests)
- **Cannot** access System Manager
- **Cannot** manage dispatchers or admins

**Demo Credentials**: 
- `johanguse` / `johanguse123` | +5547991274449

---

### 4. Driver (Profile-based)
**Who**: People providing transportation services
**Access Level**: Personal rides only
**Permissions**:
- View rides assigned to them
- Update status of their rides
- View personal ride history
- **Cannot** see other drivers' rides
- **Cannot** assign rides
- **Cannot** access System Manager

**Demo Drivers** (from service_providers):
- Michael Chen | +16465551234
- Patricia Smith | +12125555678
- David Martinez | +13105559999

**Note**: Drivers currently access system via admin/case manager assignment (future enhancement: direct driver login)

---

### 5. Riders (Service Users)
**Who**: People who need transportation
**Access Level**: SMS updates + ride tracking
**Permissions**:
- Receive SMS updates about rides
- Track pickup/dropoff status
- **Cannot** log into web app

**Demo Riders**:
- Maria Rodriguez | +12125551234
- James Wilson | +14155554444

---

### 6. Caregivers (Service Users)
**Who**: Family members managing rides for riders
**Access Level**: Indirect - rides managed by case managers
**Permissions**:
- Associated with riders
- Can be contacted for ride coordination
- **Cannot** log into web app

**Demo Caregivers**:
- Sarah Johnson | +14155552222
- Emily Chen | +16465551111

---

## System Manager (Admin Only)

The System Manager has 6 tabs for managing data:

| Tab | Manages | Table | Description |
|-----|---------|------------|-------------|
| **Riders** | People who need rides | `users` | Service users requesting transportation |
| **Providers** | Drivers & staff | `service_providers` | Driver profiles assigned to rides |
| **Vehicles** | Fleet vehicles | `vehicles` | Cars, vans, accessible vehicles |
| **Case Managers** | Case manager accounts | `system_users` (role='case_manager') | Login credentials for case managers |
| **Drivers** | Driver management | `service_providers` | Drivers available for assignment |
| **Admins** | Other admin accounts | `system_users` (role='admin') | Admin team members |

---

## Database Tables

### 1. system_users (Authentication)
**Purpose**: User login credentials and authorization
**Authentication**: YES - this is what `/api/auth/login` checks
**Tables**:
```javascript
{
  uuid: number,
  username: string (unique),
  passwordHash: string (bcrypt),
  role: 'admin' | 'case_manager',
  fullName: string,
  email: string,
  phone: string,
  isActive: boolean,
  lastLogin: Date
}
```

**Roles & Access**:
- `admin` (3 users) - Full system access including System Manager
- `case_manager` (1+ users) - Request rides for others

**Login Method**: Username + Password (not email!)

---

### 2. service_providers (Driver Profiles & Assignment)
**Purpose**: Driver/staff profiles and ride assignments
**Authentication**: NO - drivers currently managed via service-provider records
**Fields**:
```javascript
{
  uuid: number,
  fullName: string,
  title: string,
  organization: string,
  mobilePhone: string,
  serviceProviderRole: 'Driver' | 'Fleet Manager' | 'Staff',
  specializations: string,
  email: string,
  password: string  // For reference/future auth only
}
```

**Current Drivers**:
- Michael Chen - Wheelchair accessible, Long distance
- Patricia Smith - Medical appointments, Senior care
- David Martinez - Medical appointments, Bilingual
- Lisa Anderson - Fleet Manager

**Note**: Email/password in service_providers are **NOT currently used for authentication**. Future enhancement will allow drivers to log in directly.

---

### 3. users Table (Riders & Caregivers)
**Purpose**: Service users requesting and managing rides
**Authentication**: NO - riders/caregivers don't log in
**Fields**:
```javascript
{
  uuid: number,
  fullName: string,
  phone: string,
  dob: string,
  race: string,
  maritalStatus: string,
  residence: {
    current: string,
    last: string
  },
  income: {
    current: string,
    last: string
  },
  serviceUserRole: ['rider'] | ['caregiver'] | ['rider', 'caregiver'],
  veteranStatus: string,
  disabilityStatus: string,
  smsConsent: {
    given: boolean,
    timestamp: Date,
    ipAddress: string
  }
}
```

**Current Demo Users**:
- Maria Rodriguez (rider)
- James Wilson (rider)
- Sarah Johnson (caregiver)
- Emily Chen (caregiver/relative)

---

### 4. vehicles Table
**Purpose**: Fleet vehicles available for assignment
**Authentication**: NO
**Fields**:
```javascript
{
  uuid: number,
  make: string,
  model: string,
  year: number,
  licensePlate: string,
  capacity: number,
  wheelchair_accessible: boolean,
  serviceProviderId: number  // Provider managing vehicle
}
```

---

### 5. rides Table
**Purpose**: Ride requests with rider, driver, and status
**Authentication**: NO
**Fields**:
```javascript
{
  uuid: number,
  serviceUserUuid: number,  // Rider
  serviceUserName: string,
  assignedDriverUuid: number,  // Driver assigned
  assignedVehicleUuid: number,  // Vehicle assigned
  status: 'UNASSIGNED' | 'ACTIVE' | 'COMPLETED',
  rideStatus: number,  // Detailed status code
  rideRequestStatus: number,  // Request status code
  pickupAddress: string,
  dropOffAddress: string,
  pickupRequestedTime: Date,
  rideStartedActualTime: Date,
  purpose: string,
  notes: string
}
```

---

## Routes & Permissions

### Public Routes
- `/sms-consent` - SMS consent management
- `/sms-opt-out` - SMS opt-out
- `/terms` - Terms of service
- `/privacy` - Privacy policy

### Authentication Routes
- `/portal-access` - Portal password screen
- `/signin` - User login screen

### Protected Routes

**Admin** (natecooper, cassiebrinen, dominiquemorris):
- `/dashboard` - Main dashboard with all rides
- `/manager` - System Manager (6 tabs: Riders, Providers, Vehicles, Case Managers, Drivers, Admins)
- `/service-provider` - Add new service providers
- `/vehicle` - Add new vehicles
- `/` and `/ride-request` - Create and assign ride requests
- All delete/deactivate functions in System Manager

**Case Manager** (johanguse):
- `/ride-request` - Create ride requests for service users
- `/dashboard` - View ride requests and status
- **Cannot access**: System Manager, provider/vehicle management

**Service Users** (Riders & Caregivers):
- No direct web login
- Accessed via SMS or case manager creation
- View ride status via SMS or web link

**Drivers** (via service_providers):
- Future enhancement: Direct web login
- Currently managed via System Manager → Drivers tab
- Can be activated/deactivated by admins

### Permission Checks

**Backend** (`server-fastify/src/middleware/permissions.ts`):
- `/admin/*` routes: Requires admin role
- `/manager` routes: Requires admin role
- `/service-provider` routes: Requires admin role
- `/vehicle` routes: Requires admin role
- `/ride-request` routes: Requires admin OR case_manager role

**Frontend**:
- Links hidden based on user role
- Redirects to `/unauthorized` if access denied
- AuthContext provides role-based navigation

---

## Demo Credentials

Quick reference for testing:

### System Users (Web App Login)

| Role | Username | Password | Phone | Purpose |
|------|----------|----------|-------|---------|
| Admin | `natecooper` | `natecooper123` | +18313251472 | Full system access + Manager |
| Admin | `cassiebrinen` | `cassiebrinen123` | +18777804236 | Full system access + Manager |
| Admin | `dominiquemorris` | `dominiquemorris123` | +18777804236 | Full system access + Manager |
| Dispatcher | `dispatcher` | `dispatch123` | +18777804236 | Coordinate rides + assign drivers |
| Case Manager | `johanguse` | `johanguse123` | +5547991274449 | Request rides for users |

**Note**: All logins use USERNAME, not email!

---

### Service Users (Riders & Caregivers)

| Name | Phone | Role | Purpose |
|------|-------|------|---------|
| Maria Rodriguez | +12125551234 | Rider | Request transportation |
| James Wilson | +14155554444 | Rider | Request transportation |
| Sarah Johnson | +14155552222 | Caregiver | Manage rides for others |
| Emily Chen | +16465551111 | Caregiver/Relative | Manage rides for others |

**Note**: Service users don't log in; rides requested by case managers or admins

---

### Service Providers (Drivers)

| Name | Phone | Organization | Specialty |
|------|-------|--------------|-----------|
| Michael Chen | +16465551234 | EASTCONN | Wheelchair accessible, Long distance |
| Patricia Smith | +12125555678 | EASTCONN | Medical appointments, Senior care |
| David Martinez | +13105559999 | Generations Health | Medical appointments, Bilingual |
| Lisa Anderson | +14155553333 | EASTCONN | Fleet Manager |

**Note**: Drivers currently managed via service-provider records (future: direct driver login)

---

## Adding New Drivers

To add a new driver to the system:

### Step 1: Create Service Provider Profile
Add via System Manager → Providers or seed script:
```javascript
{
  fullName: "New Driver",
  title: "Driver",
  organization: "EASTCONN",
  mobilePhone: "+1234567890",
  email: "newdriver@email.com",
  password: "password123"
}
```

### Step 2: Create System User Login
If they need web app access, add to system-users:
```javascript
{
  username: "newdriver",
  password: "password123",  // Will be hashed with bcrypt
  role: "driver",
  fullName: "New Driver",
  email: "newdriver@email.com"
}
```

---

## Portal Password

**Current Password**: `hackct25`
**Storage**: localStorage with 24-hour expiration
**Behavior**:
- Users enter once per 24 hours
- Persists across browser sessions
- Shared by all users
- Logout does NOT clear portal password

**Security Note**: ⚠️ For production, move portal password to environment variable.

---

## Seeding Demo Users

The system uses a single seed command to populate all demo data:

```bash
# Run all seeds
bun run seed                    # Seeds all demo data (users, providers, vehicles, rides)

# Reset and reseed
bun run seed:reset              # Clear database and reseed from scratch
```

For detailed setup instructions, see the [README.md](../README.md)

### System Users (Authentication)
- **Admins (3)**: natecooper, cassiebrinen, dominiquemorris
- **Dispatchers (1)**: dispatcher
- **Case Manager (1)**: johanguse
- **Total**: 5 users with web authentication

### Service Users (Riders & Caregivers)
- **Riders (2)**: Maria Rodriguez, James Wilson
- **Caregivers (2)**: Sarah Johnson, Emily Chen
- **Total**: 4 users (no web login, accessed via SMS or case manager)

### Service Providers (Drivers & Fleet)
- **Drivers (3)**: Michael Chen, Patricia Smith, David Martinez
- **Fleet Manager (1)**: Lisa Anderson
- **Total**: 4 providers

### Demo Rides (9 total)
- **Unassigned (3)**: Maria Rodriguez, James Wilson, Sarah Johnson
- **Active (3)**: Maria Rodriguez, James Wilson, Sarah Johnson
- **Completed (3)**: James Wilson, Emily Chen, Maria Rodriguez

---

## Testing Authentication

### Quick Test Flow

1. **Admin Access - System Manager**
   - Login: `natecooper` / `natecooper123`
   - Navigate: Click "System Manager" in sidebar
   - Features available:
     - **Riders tab**: View/search all service users, create new riders
     - **Providers tab**: View service providers (drivers, fleet managers)
     - **Vehicles tab**: Manage fleet vehicles
     - **Case Managers tab**: Create/deactivate case managers with modal confirmation
     - **Drivers tab**: View/deactivate drivers with loading spinner
     - **Admins tab**: View other admin users
   - Special UX: Delete/Deactivate trigger modal → Confirmation → Spinning loader → Action completes

2. **Dispatcher Access - Coordinate Rides**
   - Login: `dispatcher` / `dispatch123`
   - Navigate: Click "Dashboard" in sidebar
   - Features available:
     - View all pending ride requests
     - Assign drivers to rides
     - Manage ride requests
     - Create service providers and vehicles
     - Request rides for users
     - **Cannot access**: System Manager, delete operations

3. **Case Manager Access - Ride Requests**
   - Login: `johanguse` / `johanguse123`
   - Navigate: Click "Ride Request" in sidebar
   - Features available:
     - Search riders (try: "Maria", "James", "Sarah", "Emily")
     - Create ride request for selected rider
     - See assigned drivers
     - Track ride status (Unassigned → Assigned → Active → Completed)
     - **Cannot access**: System Manager, provider/vehicle management

4. **Service User Access - Rides via Case Manager**
   - **No direct login** (service users don't have web credentials)
   - Access: Case manager creates rides on their behalf
   - View: Service users can check status via SMS or web link

5. **Admin Features Testing**
   - Delete Case Manager: Click trash icon → Modal appears → Click "Delete" → Spinner loads → Row removed
   - Deactivate Driver: Click "Deactivate" button → Spinner appears on button → Driver marked inactive
   - Reactivate: Click "Activate" button → Driver marked active again

### Accessing the System Manager

- **URL**: `/admin/manager` (or click "System Manager" in sidebar after login)
- **Only accessible**: Logged in as admin (natecooper, cassiebrinen, OR dominiquemorris)
- **Permissions**: Verified via `auth.js` middleware + `permissions.js` checks
- **All actions**: Delete/deactivate/create operations logged and reflected immediately

### Testing Modal & Loading States

**Delete Case Manager Modal**:
1. System Manager → Case Managers tab
2. Hover over row → Click delete icon (trash)
3. Modal appears: "Are you sure you want to delete [Name]?"
4. Click "Delete" button (red) → Button shows spinner
5. Wait 1-2 seconds → Modal closes, entry removed from table
6. Refresh page → Confirms deletion persisted

**Deactivate Driver with Spinner**:
1. System Manager → Drivers tab
2. Find driver row (e.g., "Michael Chen")
3. Click "Deactivate" button → Button shows spinner, disabled
4. Wait 1-2 seconds → Status column updates to "Inactive"
5. Button text changes to "Activate"
6. Click "Activate" → Spinner again → Status updates to "Active"

### Common Test Scenarios

**Scenario 1: Create Ride Request as Case Manager**
```
1. Login as case manager (johanguse / johanguse123)
2. Click "Ride Request" → "Create Ride Request"
3. Search for rider: "Maria Rodriguez"
4. Select pickup location (e.g., "123 Main St")
5. Select dropoff location (e.g., "456 Oak Ave")
6. Click "Request Ride" → Ride created
7. Switch to admin account → System Manager
8. Ride appears in system (status: UNASSIGNED)
```

**Scenario 2: Manage Drivers as Admin**
```
1. Login as admin (natecooper / natecooper123)
2. System Manager → Drivers tab
3. Find "Patricia Smith" → Click "Deactivate" → Spinner appears
4. Wait for completion → Status shows "Inactive"
5. Click "Activate" → Spinner → Status shows "Active"
6. Logout & login as different admin (cassiebrinen / cassiebrinen123)
7. System Manager → Drivers tab → Verify changes persisted
```

**Scenario 3: Delete Case Manager with Confirmation**
```
1. Login as admin (dominiquemorris / dominiquemorris123)
2. System Manager → Case Managers tab
3. Click on trash icon for "johanguse" row
4. Confirmation modal appears with warning icon
5. Review warning message
6. Click "Delete" (red) → Modal shows spinner on button
7. Wait 2 seconds → Modal closes, case manager removed
8. Refresh page → Case Manager no longer in table
```

**Scenario 4: Create New Case Manager**
```
1. Login as admin
2. System Manager → Case Managers tab
3. Enter in form:
   - Name: "Test Manager"
   - Email: "test@example.com"
   - Phone: "+1234567890"
   - Password: "password123"
4. Click "Create" button
5. New entry appears in table
6. Click "Deactivate" → Spinner → Status shows "Inactive"
7. Delete if needed → Modal → Confirm
```

---

## Security Considerations

### Implemented ✅
- bcrypt password hashing (10 rounds)
- Role-based access control (frontend + backend)
- Session management (sessionStorage)
- Protected API endpoints with permission checks
- 24-hour portal password expiration

### For Production ⚠️
1. Move portal password to environment variable
2. Implement JWT tokens for API authentication
3. Add HTTPS enforcement
4. Implement password strength requirements
5. Add rate limiting to prevent brute force
6. Implement "Forgot Password" functionality
7. Add audit logging for authentication attempts
8. Enable CORS restrictions
9. Add CSRF protection
10. Implement session timeout

---

## Current Status Summary

✅ **What Works**:
- Username/password login via system-users (3 admins + 1 case manager)
- Role-based access control (admin, case_manager roles only)
- Admins can manage system via System Manager (6 tabs)
- Admins can create, deactivate, delete case managers with modal confirmations
- Admins can deactivate/activate drivers with loading spinners
- Case managers can create ride requests for service users
- Service user data separated from authentication (no duplication)
- Demo data fully organized: 4 system-users, 4 service-users, 4 providers, 9 demo rides

❌ **Future Enhancements**:
- Direct driver web login with service-provider credentials
- Two-factor authentication (2FA)
- "Forgot Password" functionality
- JWT-based API authentication instead of sessionStorage
- Email/SMS notifications for role actions

---

## Troubleshooting

### "Invalid username or password"
- Verify credentials are from system_users table
- Check username is correct (use "natecooper", NOT "nate.cooper" or email)
- Ensure seed script has been run: `bun run seed`
- Verify database connection and seed completion

### "Insufficient permissions" or "Unauthorized"
- Verify your user role in system_users table
- Admins: Check that you can access `/admin/manager`
- Case Managers: Can only access `/ride-request`, not System Manager
- Check permissions middleware in `server-fastify/src/middleware/permissions.ts`

### "Cannot find user" when creating ride request
- Search for exact name: "Maria Rodriguez" (case-sensitive)
- Verify user exists in database via System Manager → Riders tab

### Portal password not persisting
- Check browser localStorage is enabled
- Verify 24-hour expiration hasn't passed
- Clear localStorage: DevTools → Storage → localStorage → delete portal-password
- Re-enter password: `hackct25`

### System Manager shows "No drivers found"
- Verify seed completed successfully
- Drivers tab should show: Michael Chen, Patricia Smith, David Martinez, Lisa Anderson

### Can't create new case manager
- Verify you're logged in as admin
- Check that "Case Manager" dropdown role is selected
- Ensure email and phone fields are filled
- Try different phone number format if validation fails

### Modal not appearing for delete action
- Ensure JavaScript console has no errors
- Verify DeleteConfirmationModal component is imported in Manager.tsx
- Check browser console for any React/TypeScript errors
- Try refreshing page

---

## Future Enhancements

- [ ] Direct driver login with service-provider email/password
- [ ] JWT-based API authentication (replace sessionStorage)
- [ ] Two-factor authentication (2FA) for admins
- [ ] "Forgot Password" / "Reset Password" functionality
- [ ] SMS notifications for role creation/deactivation
- [ ] Email notifications for all authentication events
- [ ] Password strength requirements on creation
- [ ] Account lockout after 5 failed login attempts
- [ ] Audit logging for all admin actions (database records)
- [ ] Role-based SMS consent management
- [ ] Single Sign-On (SSO) integration (future)
