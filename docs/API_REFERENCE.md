# API Reference

> **Complete API documentation for Rural Dispatch backend**

## Base URL
```
Development: http://localhost:5001/api
Production: https://your-domain.com/api
```

## Table of Contents
- [Authentication](#authentication)
- [Users](#users)
- [Ride Requests](#ride-requests)
- [Service Providers (Drivers)](#service-providers)
- [Vehicles](#vehicles)
- [Maps](#maps)
- [Notifications (SMS)](#notifications)
- [System Users](#system-users)
- [Health Check](#health-check)

---

## Authentication

### Login
```http
POST /api/auth/login
```

**Request Body**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "uuid": "system-user-1",
    "username": "admin",
    "role": "admin",
    "fullName": "System Administrator",
    "email": "admin@ruraldispatch.org"
  },
  "message": "Login successful"
}
```

**Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Users

### Get All Users
```http
GET /api/users
```

**Query Parameters**:
- None

**Response** (200 OK):
```json
[
  {
    "uuid": "user-123",
    "fullName": "John Doe",
    "phone": "+12025550123",
    "dob": "1985-06-15",
    "race": "white",
    "maritalStatus": "married",
    "residence": {
      "current": "123 Main St, City, State 12345",
      "currentPlaceId": "ChIJ...",
      "last": "456 Oak Ave, City, State 12345",
      "lastPlaceId": "ChIJ..."
    },
    "income": {
      "current": "35000",
      "last": "30000"
    },
    "serviceUserRole": ["rider"],
    "veteranStatus": "not veteran",
    "disabilityStatus": "no",
    "smsConsent": {
      "given": true,
      "timestamp": "2025-01-10T12:00:00Z",
      "optedOut": false
    },
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-10T12:00:00Z"
  }
]
```

### Get User by UUID
```http
GET /api/users/:uuid
```

**Parameters**:
- `uuid` (path) - User UUID

**Response**: Same as single user object above

### Search Users (Fuzzy)
```http
GET /api/users/fuzzy/:searchTerm
```

**Parameters**:
- `searchTerm` (path) - Search term (name or phone)

**Example**:
```http
GET /api/users/fuzzy/john
GET /api/users/fuzzy/202555
```

**Response**: Array of matching users

### Create User
```http
POST /api/users
```

**Request Body**:
```json
{
  "fullName": "Jane Smith",
  "phone": "+12025550199",
  "dob": "1990-03-20",
  "race": "black",
  "maritalStatus": "single",
  "residence": {
    "current": "789 Elm St, City, State 12345",
    "currentPlaceId": "ChIJ...",
    "last": "321 Pine Rd, City, State 12345",
    "lastPlaceId": "ChIJ..."
  },
  "income": {
    "current": "40000",
    "last": "35000"
  },
  "serviceUserRole": ["rider", "caregiver"],
  "veteranStatus": "veteran",
  "disabilityStatus": "yes"
}
```

**Response** (201 Created):
```json
{
  "uuid": "user-456",
  "fullName": "Jane Smith",
  ...
}
```

### Update User
```http
PUT /api/users/:uuid
```

**Parameters**:
- `uuid` (path) - User UUID

**Request Body** (partial update supported):
```json
{
  "fullName": "Updated Name",
  "phone": "+12025550199",
  "dob": "1990-03-20",
  "residence": {
    "current": "789 Elm St, City, State 12345",
    "currentPlaceId": "ChIJ..."
  },
  "serviceUserRole": ["rider", "caregiver"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": { ... }
}
```

### Get User by Phone
```http
GET /api/users/phone/:phone
```

**Parameters**:
- `phone` (path) - Phone number (with country code)

**Example**:
```http
GET /api/users/phone/+12025550123
```

**Response** (200 OK): Single user object or 404 if not found

### Get User Fields
```http
GET /api/users/:id/:fields
```

**Parameters**:
- `id` (path) - User UUID
- `fields` (path) - Comma-separated field names

**Example**:
```http
GET /api/users/user-123/fullName,phone,email
```

**Response** (200 OK):
```json
{
  "fullName": "John Doe",
  "phone": "+12025550123",
  "email": "john@example.com"
}
```

### Get Users by Fields
```http
GET /api/users/fields/:fields
```

**Parameters**:
- `fields` (path) - Comma-separated field names to retrieve for all users

**Example**:
```http
GET /api/users/fields/fullName,phone
```

**Response** (200 OK): Array of users with only specified fields

### Update SMS Consent
```http
POST /api/users/sms-consent
```

**Request Body**:
```json
{
  "phoneNumber": "+12025550123",
  "consentGiven": true,
  "timestamp": "2025-01-10T12:00:00Z",
  "ipAddress": "192.168.1.100"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Consent recorded"
}
```

### Delete User
```http
DELETE /api/users/:uuid
```

**Parameters**:
- `uuid` (path) - User UUID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Ride Requests

### Get All Ride Requests
```http
GET /api/riderequests
```

**Response** (200 OK):
```json
[
  {
    "uuid": 1001,
    "serviceUserUuid": "user-123",
    "serviceUserRole": "rider",
    "pickupAddress": "123 Main St, City, State",
    "pickupAddressPlaceId": "ChIJ...",
    "dropOffAddress": "456 Medical Center Dr, City, State",
    "dropOffAddressPlaceId": "ChIJ...",
    "assignedDriverUuid": "provider-789",
    "assignedVehicleUuid": "vehicle-456",
    "roundTrip": false,
    "pickupRequestedTime": "2025-01-15T10:00:00Z",
    "dropOffRequestedTime": "2025-01-15T11:00:00Z",
    "rideStatus": 100,
    "rideRequestStatus": 1000,
    "purpose": "Medical appointment",
    "notes": "Patient needs wheelchair assistance",
    "createdAt": "2025-01-10T08:00:00Z",
    "updatedAt": "2025-01-10T09:00:00Z"
  }
]
```

### Get Ride Request by UUID
```http
GET /api/riderequests/:uuid
```

**Parameters**:
- `uuid` (path) - Ride request UUID (numeric)

**Response**: Same as single ride request object above

### Create Ride Request
```http
POST /api/riderequests
```

**Request Body**:
```json
{
  "serviceUserUuid": "user-123",
  "serviceUserRole": "rider",
  "pickupAddress": "123 Main St, City, State",
  "pickupAddressPlaceId": "ChIJ...",
  "dropOffAddress": "456 Medical Center Dr, City, State",
  "dropOffAddressPlaceId": "ChIJ...",
  "roundTrip": false,
  "pickupRequestedTime": "2025-01-15T10:00:00Z",
  "dropOffRequestedTime": "2025-01-15T11:00:00Z",
  "purpose": "Medical appointment",
  "notes": "Patient needs wheelchair assistance"
}
```

**Response** (201 Created):
```json
{
  "uuid": 1002,
  "serviceUserUuid": "user-123",
  ...
}
```

### Update Ride Request
```http
PUT /api/riderequests/:uuid
```

**Parameters**:
- `uuid` (path) - Ride request UUID

**Request Body** (partial update supported):
```json
{
  "rideStatus": 200,
  "assignedDriverUuid": "provider-789",
  "assignedVehicleUuid": "vehicle-456",
  "notes": "Updated notes"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Ride request updated",
  "rideRequest": { ... }
}
```

**Note**: Updating ride status triggers SMS notifications automatically

### Delete Ride Request
```http
DELETE /api/riderequests/:id
```

**Parameters**:
- `id` (path) - Ride request UUID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Ride request deleted successfully"
}
```

---

## Service Providers

### Get All Providers
```http
GET /api/providers
```

**Response** (200 OK):
```json
[
  {
    "uuid": "provider-789",
    "fullName": "Mike Driver",
    "mobilePhone": "+12025550188",
    "email": "mike@example.com",
    "licenseNumber": "DL12345678",
    "licenseExpiry": "2026-12-31",
    "vehicleType": "sedan",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

### Get Provider by UUID
```http
GET /api/providers/:uuid
```

### Search Providers (Fuzzy)
```http
GET /api/providers/fuzzy/:searchTerm
```

**Example**:
```http
GET /api/providers/fuzzy/mike
```

### Create Provider
```http
POST /api/providers
```

**Request Body**:
```json
{
  "fullName": "Sarah Driver",
  "mobilePhone": "+12025550177",
  "email": "sarah@example.com",
  "licenseNumber": "DL87654321",
  "licenseExpiry": "2027-06-30",
  "vehicleType": "van",
  "isActive": true
}
```

**Response** (201 Created):
```json
{
  "uuid": "provider-790",
  "fullName": "Sarah Driver",
  ...
}
```

### Update Provider
```http
PUT /api/providers/:uuid
```

**Request Body** (partial update):
```json
{
  "fullName": "Updated Driver Name",
  "mobilePhone": "+12025550188",
  "email": "updated@example.com",
  "title": "Senior Driver",
  "organization": "EASTCONN",
  "serviceProviderRole": "Driver",
  "specializations": "Wheelchair accessible, Medical appointments"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Provider updated successfully",
  "provider": { ... }
}
```

### Delete Provider
```http
DELETE /api/service-providers/:uuid
```

---

## Vehicles

### Get All Vehicles
```http
GET /api/vehicles
```

**Response** (200 OK):
```json
[
  {
    "uuid": "vehicle-456",
    "displayName": "Blue Van #1",
    "fleetId": "FLEET-001",
    "make": "Ford",
    "model": "Transit",
    "year": 2022,
    "licensePlate": "ABC-1234",
    "vin": "1FTBW3XM0NKA12345",
    "color": "blue",
    "capacity": 6,
    "wheelchairAccessible": true,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

### Search Vehicles (Fuzzy)
```http
GET /api/vehicles/fuzzy/:searchTerm
```

**Example**:
```http
GET /api/vehicles/fuzzy/blue
GET /api/vehicles/fuzzy/ABC
```

### Create Vehicle
```http
POST /api/vehicles
```

**Request Body**:
```json
{
  "displayName": "Red Sedan #2",
  "fleetId": "FLEET-002",
  "make": "Toyota",
  "model": "Camry",
  "year": 2023,
  "licensePlate": "XYZ-5678",
  "vin": "4T1B11HK5LU123456",
  "color": "red",
  "capacity": 4,
  "wheelchairAccessible": false,
  "isActive": true
}
```

**Response** (201 Created):
```json
{
  "uuid": "vehicle-457",
  "displayName": "Red Sedan #2",
  ...
}
```

### Update Vehicle
```http
PUT /api/vehicles/:uuid
```

**Request Body** (partial update):
```json
{
  "displayName": "Updated Van Name",
  "fleetId": "FLEET-001",
  "make": "Ford",
  "model": "Transit",
  "year": 2023,
  "licensePlate": "ABC-1234",
  "vin": "1FTBW3XM0NKA12345",
  "color": "blue",
  "capacity": 8,
  "wheelchairAccessible": true,
  "walkerAccessible": true,
  "serviceAnimalFriendly": true,
  "oxygenTankAccessible": true,
  "serviceArea": "Northeast Connecticut"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Vehicle updated successfully",
  "vehicle": { ... }
}
```

### Delete Vehicle
```http
DELETE /api/vehicles/:uuid
```

---

## Maps

### Calculate Travel Time
```http
POST /api/maps/calculate-travel-time
```

**Description**: Calculate travel time between two addresses using Google Maps Distance Matrix API

**Request Body**:
```json
{
  "origin": "123 Main St, New York, NY",
  "destination": "456 Medical Center Dr, New York, NY"
}
```

**Response** (200 OK):
```json
{
  "durationMinutes": 25,
  "durationText": "25 mins",
  "durationSeconds": 1500,
  "distanceText": "12.5 mi",
  "distanceMeters": 20117,
  "origin": "123 Main St, New York, NY",
  "destination": "456 Medical Center Dr, New York, NY"
}
```

**Error Responses**:
- `400 Bad Request` - No route found between addresses
- `500 Internal Server Error` - Google Maps API not configured

---

## Notifications

### Get Notifications by Ride
```http
GET /api/notifications/ride/:rideUuid
```

**Parameters**:
- `rideUuid` (path) - Ride request UUID

**Response** (200 OK):
```json
[
  {
    "_id": "notification-001",
    "rideUuid": 1001,
    "phoneNumber": "+12025550123",
    "message": "Your ride has been confirmed! Driver Mike will pick you up at 10:00 AM.",
    "direction": "outbound",
    "provider": "twilio",
    "messageSid": "SM...",
    "status": "delivered",
    "timestamp": "2025-01-10T09:00:00Z",
    "deliveredAt": "2025-01-10T09:00:05Z"
  }
]
```

### Get Notifications by Phone
```http
GET /api/notifications/phone/:phoneNumber
```

**Example**:
```http
GET /api/notifications/phone/+12025550123
```

### Get Active Session Notifications
```http
GET /api/notifications/active/:rideUuid
```

**Description**: Returns ongoing SMS conversation for a ride

### Get Notification Stats
```http
GET /api/notifications/stats/:rideUuid
```

**Response** (200 OK):
```json
{
  "rideUuid": 1001,
  "totalMessages": 8,
  "sent": 5,
  "received": 3,
  "delivered": 4,
  "failed": 0,
  "lastMessage": {
    "message": "Thanks for the update!",
    "timestamp": "2025-01-10T10:30:00Z",
    "direction": "inbound"
  }
}
```

### Get Provider Status
```http
GET /api/notifications/provider-status
```

**Response** (200 OK):
```json
{
  "success": true,
  "status": {
    "twilio": {
      "configured": true,
      "isPrimary": true
    },
    "vonage": {
      "configured": true,
      "isFallback": true
    }
  }
}
```

### Get Scheduler Status
```http
GET /api/notifications/scheduler-status
```

**Description**: Get scheduler status for debugging scheduled SMS tasks

**Response** (200 OK):
```json
{
  "success": true,
  "scheduler": {
    "isRunning": true,
    "scheduledTasksCount": 5,
    "tasks": [
      {
        "rideUuid": "ride-123",
        "type": "one_hour_prior",
        "scheduledTime": "2025-01-15T09:00:00Z"
      }
    ]
  },
  "timestamp": "2025-01-15T08:30:00Z"
}
```

### Send SMS
```http
POST /api/notifications/send
```

**Description**: Send an SMS message manually

**Request Body**:
```json
{
  "to": "+12025550123",
  "message": "Your driver will arrive in 10 minutes",
  "rideUuid": "ride-123",
  "messageType": "manual_notification"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "messageSid": "SM...",
  "status": "queued",
  "to": "+12025550123"
}
```

### Close SMS Session
```http
POST /api/notifications/close-session/:rideUuid
```

**Description**: Marks SMS conversation as closed

### Twilio Inbound Webhook
```http
POST /api/notifications/webhook/twilio
```

**Content-Type**: `application/x-www-form-urlencoded`

**Request Body** (Twilio format):
```
From=+12025550123
To=+18777804236
Body=Hello, when will my driver arrive?
MessageSid=SM...
```

**Response** (200 OK):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>
```

### Vonage Inbound Webhook
```http
POST /api/notifications/webhook/vonage
```

**Content-Type**: `application/json`

**Request Body** (Vonage format):
```json
{
  "msisdn": "12025550123",
  "to": "18777804236",
  "messageId": "message-id",
  "text": "Hello, when will my driver arrive?",
  "type": "text",
  "keyword": "HELLO",
  "message-timestamp": "2025-01-10 10:00:00"
}
```

### Twilio Status Callback
```http
POST /api/notifications/status/twilio
```

**Description**: Receives delivery status updates from Twilio

### Vonage Delivery Receipt
```http
POST /api/notifications/status/vonage
```

**Description**: Receives delivery receipts from Vonage

---

## System Users

### Get All System Users
```http
GET /api/auth/users
```

**Response** (200 OK):
```json
[
  {
    "uuid": "system-user-1",
    "username": "admin",
    "role": "admin",
    "fullName": "System Administrator",
    "email": "admin@ruraldispatch.org",
    "phone": "+12025550100",
    "isActive": true,
    "lastLogin": "2025-01-10T08:00:00Z",
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

### Get System Users by Role
```http
GET /api/auth/system-users?role=:role
```

**Query Parameters**:
- `role` (query) - Filter by role: `admin`, `dispatcher`, `driver`, `case_manager`

**Example**:
```http
GET /api/auth/system-users?role=dispatcher
```

**Response** (200 OK): Array of system users with specified role

### Toggle User Status
```http
PATCH /api/auth/system-users/:uuid/toggle-status
```

**Parameters**:
- `uuid` (path) - System user UUID

**Description**: Toggle user between active/inactive status

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User status toggled",
  "user": {
    "uuid": "system-user-1",
    "isActive": false,
    "updatedAt": "2025-01-10T12:00:00Z"
  }
}
```

### Get System User by UUID
```http
GET /api/auth/users/:uuid
```

### Create System User
```http
POST /api/auth/users
```

**Request Body**:
```json
{
  "username": "newuser",
  "password": "securepassword123",
  "role": "dispatcher",
  "fullName": "New Dispatcher",
  "email": "newuser@ruraldispatch.org",
  "phone": "+12025550199"
}
```

**Response** (201 Created):
```json
{
  "uuid": "system-user-5",
  "username": "newuser",
  "role": "dispatcher",
  "fullName": "New Dispatcher",
  ...
}
```

### Update System User
```http
PUT /api/auth/users/:uuid
```

**Request Body** (partial update):
```json
{
  "fullName": "Updated Name",
  "email": "newemail@ruraldispatch.org"
}
```

### Deactivate User
```http
POST /api/auth/users/:uuid/deactivate
```

### Activate User
```http
POST /api/auth/users/:uuid/activate
```

### Delete System User
```http
DELETE /api/auth/users/:uuid
```

---

## Health Check

### Server Health
```http
GET /health
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2025-01-10T10:00:00Z",
  "uptime": 3600,
  "environment": "development"
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200  | OK - Request successful |
| 201  | Created - Resource created successfully |
| 400  | Bad Request - Invalid input |
| 401  | Unauthorized - Authentication required |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource not found |
| 500  | Internal Server Error - Server error |

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message here",
  "details": "Additional error details (optional)"
}
```

**Examples**:

```json
{
  "success": false,
  "error": "User not found"
}
```

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "fullName": "Full name is required",
    "phone": "Invalid phone number format"
  }
}
```

---

## Testing with curl

### Authentication
```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq
```

### Users
```bash
# Get all users
curl http://localhost:5001/api/users | jq

# Create user
curl -X POST http://localhost:5001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "phone": "+12025550199",
    "dob": "1990-01-01",
    "race": "white",
    "maritalStatus": "single",
    "residence": {"current": "123 Main St", "last": "456 Oak Ave"},
    "income": {"current": "40000", "last": "35000"},
    "serviceUserRole": ["rider"],
    "veteranStatus": "not veteran",
    "disabilityStatus": "no"
  }' | jq
```

### Ride Requests
```bash
# Create ride request
curl -X POST http://localhost:5001/api/riderequests \
  -H "Content-Type: application/json" \
  -d '{
    "serviceUserUuid": "user-123",
    "pickupAddress": "123 Main St",
    "dropOffAddress": "456 Medical Center",
    "pickupRequestedTime": "2025-01-15T10:00:00Z",
    "dropOffRequestedTime": "2025-01-15T11:00:00Z",
    "purpose": "Medical appointment"
  }' | jq

# Update ride status
curl -X PUT http://localhost:5001/api/riderequests/1001 \
  -H "Content-Type: application/json" \
  -d '{"rideStatus": 200}' | jq
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding for production:
- Login: 5 attempts per minute per IP
- API calls: 100 requests per minute per IP
- SMS webhooks: No limit (verified by signature)

---

## Authentication & Authorization

**Note**: The API currently uses session-based authentication stored in `sessionStorage` on the client. For production, implement JWT-based authentication with tokens.

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **admin** | Full access to all endpoints |
| **dispatcher** | Manage rides, users, providers, vehicles |
| **driver** | View assigned rides, update status |
| **case_manager** | Create rides for existing users only |

---

## Webhook Security

### Twilio Signature Validation
```javascript
// Validate Twilio webhook signature
const crypto = require('crypto');

function validateTwilioSignature(req) {
  const signature = req.headers['x-twilio-signature'];
  const url = `https://yourdomain.com${req.originalUrl}`;
  const params = req.body;

  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);

  const expectedSignature = crypto
    .createHmac('sha1', process.env.TWILIO_AUTH_TOKEN)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');

  return signature === expectedSignature;
}
```

### Vonage Signature Validation
```javascript
// Validate Vonage webhook signature
function validateVonageSignature(req) {
  const signature = req.query.sig;
  const params = { ...req.query };
  delete params.sig;

  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const hash = crypto
    .createHash('md5')
    .update(sortedParams + process.env.VONAGE_API_SECRET)
    .digest('hex');

  return signature === hash;
}
```

---

## Additional Resources

- [System Design](./SYSTEM_DESIGN.md) - Architecture and technical overview
- [SMS Setup](./SMS_SETUP.md)
- [Authentication](./AUTHENTICATION.md)
- [Deployment](./DEPLOYMENT.md)
