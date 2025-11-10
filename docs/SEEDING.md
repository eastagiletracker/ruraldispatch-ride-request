# 🌱 Database Seeding Guide# 🌱 Database Seeding Guide



Complete documentation for the seeding system in this application.Complete documentation for the seeding system in this application.



------



## 📋 Quick Start## 📋 Quick Start



### Run All Seeds### Run All Seeds

```bash```bash

npm run seednpm run seed

# or# or

npm run seed:allnpm run seed:all

``````



### Run Individual Seeds (By Role)### Run Individual Seeds (By Role)

```bash```bash

# System Users (Authentication)# System Users (Authentication)

npm run seed:admins              # Creates 3 adminsnpm run seed:admins              # Creates 3 admins

npm run seed:dispatchers         # Creates 1 dispatchernpm run seed:dispatchers         # Creates 1 dispatcher

npm run seed:case-managers       # Creates 1 case managernpm run seed:case-managers       # Creates 1 case manager



# Service Users (No Web Login)# Service Users (No Web Login)

npm run seed:riders              # Creates 2 ridersnpm run seed:riders              # Creates 2 riders

npm run seed:caregivers          # Creates 2 caregiversnpm run seed:caregivers          # Creates 2 caregivers



# Service Providers & Infrastructure# Service Providers & Infrastructure

npm run seed:drivers             # Creates 3 drivers + 1 fleet managernpm run seed:drivers             # Creates 3 drivers + 1 fleet manager

npm run seed:vehicles            # Creates fleet vehiclesnpm run seed:vehicles            # Creates fleet vehicles

npm run seed:rides               # Creates demo ridesnpm run seed:rides               # Creates demo rides

``````



------



## 📂 Seed Files Organization## 📂 Seed Files Organization



### File Structure by Role### File Structure by Role



``````

server/seed/server/seed/

├── SYSTEM USERS (Authentication - system-users collection)├── SYSTEM USERS (Authentication - system-users collection)

│   ├── seedAdmins.js ........................ 3 admins│   ├── seedAdmins.js ........................ 3 admins

│   ├── seedDispatchers.js .................. 1 dispatcher│   ├── seedDispatchers.js .................. 1 dispatcher

│   └── seedCaseManagers.js ................. 1 case manager│   └── seedCaseManagers.js ................. 1 case manager

││

├── SERVICE USERS (users collection - no web login)├── SERVICE USERS (users collection - no web login)

│   ├── seedRiders.js ....................... 2 riders│   ├── seedRiders.js ....................... 2 riders

│   └── seedCaregivers.js ................... 2 caregivers│   └── seedCaregivers.js ................... 2 caregivers

││

├── SERVICE PROVIDERS (service-providers collection)├── SERVICE PROVIDERS (service-providers collection)

│   └── seedDrivers.js ...................... 3 drivers + 1 fleet manager│   └── seedDrivers.js ...................... 3 drivers + 1 fleet manager

││

├── INFRASTRUCTURE├── INFRASTRUCTURE

│   ├── seedVehicles.js ..................... fleet vehicles│   ├── seedVehicles.js ..................... fleet vehicles

│   └── seedRides.js ........................ 9 demo rides│   └── seedRides.js ........................ 9 demo rides

││

└── ORCHESTRATION└── ORCHESTRATION

    └── seed.js ............................ runs all seeds in sequence    └── seed.js ............................ runs all seeds in sequence

``````



------



## 🌐 Architecture Overview## 🌐 Architecture Overview



The seeding system is **MANUAL and SEPARATE** from app initialization:The seeding system is **MANUAL and SEPARATE** from app initialization:



### Development Workflow### Development Workflow

``````

1. Start app:1. Start app:

   npm run dev                 # Starts server + client in dev mode   npm run dev                 # Starts server + client in dev mode



2. Run seeds MANUALLY in separate terminal:2. Run seeds MANUALLY in separate terminal:

   npm run seed                # Runs all seeds in sequence   npm run seed                # Runs all 5 seed scripts



3. App starts FIRST (before any data exists)3. App starts FIRST (before any data exists)

   - Server initializes: server/index.js → init()   - Server initializes: server/index.js → init()

   - Connects to MongoDB   - Connects to MongoDB

   - Sets up API routes   - Sets up API routes

   - Waits for requests (NO auto-seeding)   - Waits for requests (NO auto-seeding)



4. Then you seed SECOND (after app is running)4. Then you seed SECOND (after app is running)

   - Seed scripts create demo data   - Seed scripts create demo data

   - App serves that data to frontend   - App serves that data to frontend

``````



---### Data Flow (Development)

```

## 👥 Demo Credentials & Users┌──────────────┐

│ npm run dev  │

### System Users (Web Login - system-users collection)└──────┬───────┘

       │

**Admins (Full System Access)**  ┌────▼─────────────┐

```  │ App starts       │

natecooper              / natecooper123  │ Listens on :3001 │

cassiebrinen            / cassiebrinen123  │ (empty DB)       │

dominiquemorris         / dominiquemorris123  └──────────────────┘

```       │ (in another terminal)

  ┌────▼─────────────┐

**Dispatcher (Coordinate Rides)**  │ npm run seed     │

```  └──────┬───────────┘

dispatcher              / dispatch123         │

```  ┌──────▼────────────────────┐

  │ Seeds 41 demo records      │

**Case Manager (Request Rides)**  │ Users, Providers, Vehicles│

```  │ Rides, System Users        │

johanguse               / johanguse123  └───────┬────────────────────┘

```          │

  ┌───────▼──────────────┐

### Service Users (No Web Login - users collection)  │ Frontend fetches data│

  │ Shows on dashboard   │

**Riders**  └──────────────────────┘

- Maria Rodriguez (+12125551234)```

- James Wilson (+14155554444)

---

**Caregivers**

- Sarah Johnson (+14155552222)## 📂 Seed Files Location & Execution

- Emily Chen (+16465551111)

**Location:** `/server/seed/`

### Service Providers (No Web Login - service-providers collection)

**Files:**

**Drivers**```

- Michael Chen (+16465551234) - EASTCONN - Wheelchair, Long distance/server/seed/

- Patricia Smith (+12125555678) - EASTCONN - Medical appointments, Senior care├── seed.js                  ← Master orchestrator (runs all 5)

- David Martinez (+13105559999) - Generations Health - Medical appointments, Bilingual├── seedSystemUsers.js       ← System users (admin, dispatcher, driver)

├── seedUsers.js             ← Service users (riders, caregivers)

**Fleet Manager**├── seedProviders.js         ← Service providers (transportation, medical)

- Lisa Anderson (+14155553333) - EASTCONN - Fleet Manager├── seedVehicles.js          ← Fleet vehicles with driver assignments

├── seedRides.js             ← Ride requests (unassigned, active, completed)

---└── SEEDING.md               ← Documentation

```

## ⚠️ Seed Execution Order (Critical!)

**Execution Flow:**

Seeds must run in this specific order:

```

```npm run seed

1. seedAdmins.js              (3 system users)    ↓

2. seedDispatchers.js         (1 system user)server/seed/seed.js (master)

3. seedCaseManagers.js        (1 system user)    ↓

4. seedRiders.js              (2 service users)  ← MUST run BEFORE rides!Spawns child processes for each seed in sequence:

5. seedCaregivers.js          (2 service users)    ├─ [1/5] seedSystemUsers.js

6. seedDrivers.js             (4 service providers)    ├─ [2/5] seedUsers.js

7. seedVehicles.js            (vehicles)    ├─ [3/5] seedProviders.js

8. seedRides.js               (9 demo rides)     ← Uses UUIDs from step 4-5    ├─ [4/5] seedVehicles.js

```    └─ [5/5] seedRides.js

    ↓

**⚠️ RIDES DEPEND ON USERS!**Each waits for previous to complete (sequential, not parallel)

    ↓

If you skip `seedRiders.js` or `seedCaregivers.js`, rides won't link to riders correctly. The `seedRides.js` script:All 41 demo records created

1. Fetches all existing service users from database    ↓

2. Creates a `userMap` { fullName → uuid }✅ Complete

3. Matches ride data names against real users```

4. Uses ACTUAL database UUIDs in rides

---

---

## 👥 Demo Credentials & Users

## 📊 Total Demo Data Created

### System Users (Web Login - system-users collection)

| Type | Count | Details |

|------|-------|---------|**Admins (Full System Access)**

| **System Users** | 5 | 3 admins, 1 dispatcher, 1 case manager |```

| **Service Users** | 4 | 2 riders, 2 caregivers |natecooper              / natecooper123

| **Service Providers** | 4 | 3 drivers, 1 fleet manager |cassiebrinen            / cassiebrinen123

| **Vehicles** | ~10 | Fleet vehicles |dominiquemorris         / dominiquemorris123

| **Demo Rides** | 9 | 3 unassigned, 3 active, 3 completed |```

| **TOTAL** | ~32 | Records across all collections |

**Dispatcher (Coordinate Rides)**

---```

dispatcher              / dispatch123

## 📋 Detailed Seed Files```



### seedAdmins.js**Case Manager (Request Rides)**

**Purpose**: Creates 3 admin system users with full system access```

johanguse               / johanguse123

**What it does**:```

- Clears all existing admin users

- Creates 3 demo admins: natecooper, cassiebrinen, dominiquemorris### Service Users (No Web Login - users collection)

- Includes Swarm NYC team members

**Riders**

**How to run**:- Maria Rodriguez (+12125551234)

```bash- James Wilson (+14155554444)

npm run seed:admins

```**Caregivers**

- Sarah Johnson (+14155552222)

---- Emily Chen (+16465551111)



### seedDispatchers.js### Service Providers (No Web Login - service-providers collection)

**Purpose**: Creates 1 dispatcher system user for ride coordination

**Drivers**

**What it does**:- Michael Chen (+16465551234) - EASTCONN - Wheelchair, Long distance

- Clears all existing dispatcher users- Patricia Smith (+12125555678) - EASTCONN - Medical appointments, Senior care

- Creates 1 demo dispatcher: dispatcher- David Martinez (+13105559999) - Generations Health - Medical appointments, Bilingual



**Permissions**:**Fleet Manager**

- View all rides in dashboard- Lisa Anderson (+14155553333) - EASTCONN - Fleet Manager

- Assign drivers and vehicles to rides

- Update ride statuses---

- Request rides for users

## ⚠️ Seed Execution Order (Critical!)

**How to run**:

```bashSeeds must run in this specific order:

npm run seed:dispatchers

``````

1. seedAdmins.js              (3 system users)

---2. seedDispatchers.js         (1 system user)

3. seedCaseManagers.js        (1 system user)

### seedCaseManagers.js4. seedRiders.js              (2 service users)  ← MUST run BEFORE rides!

**Purpose**: Creates 1 case manager system user for ride requests5. seedCaregivers.js          (2 service users)

6. seedDrivers.js             (4 service providers)

**What it does**:7. seedVehicles.js            (vehicles)

- Clears all existing case manager users8. seedRides.js               (9 demo rides)     ← Uses UUIDs from step 4-5

- Creates 1 demo case manager: johanguse```



**Permissions**:**⚠️ RIDES DEPEND ON USERS!**

- Request rides on behalf of riders

- Search for existing ridersIf you skip `seedRiders.js` or `seedCaregivers.js`, rides won't link to riders correctly. The `seedRides.js` script:

- View ride request history1. Fetches all existing service users from database

2. Creates a `userMap` { fullName → uuid }

**How to run**:3. Matches ride data names against real users

```bash4. Uses ACTUAL database UUIDs in rides

npm run seed:case-managers

```---



---## 📊 Total Demo Data Created



### seedRiders.js| Type | Count | Details |

**Purpose**: Creates 2 service users (riders) who need transportation|------|-------|---------|

| **System Users** | 5 | 3 admins, 1 dispatcher, 1 case manager |

**What it does**:| **Service Users** | 4 | 2 riders, 2 caregivers |

- Clears all existing rider records| **Service Providers** | 4 | 3 drivers, 1 fleet manager |

- Creates demo riders: Maria Rodriguez, James Wilson| **Vehicles** | ~10 | Fleet vehicles |

- Includes phone numbers and contact info| **Demo Rides** | 9 | 3 unassigned, 3 active, 3 completed |

| **TOTAL** | ~32 | Records across all collections |

**Data Includes**:

- Full name, phoneSeeds must run in this specific order:

- Date of birth, race, marital status

- Income level, residence information```

- SMS consent tracking1. seedSystemUsers.js      (11 system users)

2. seedUsers.js            (5 service users)  ← MUST run BEFORE rides!

**Important**: These UUIDs are used by `seedRides.js` to link rides!3. seedProviders.js        (5 providers)

4. seedVehicles.js         (10 vehicles)

**How to run**:5. seedRides.js            (10 rides)         ← Uses UUIDs from step 2

```bash```

npm run seed:riders

```**⚠️ RIDES DEPEND ON USERS!**



---If you skip `seedUsers.js`, rides won't link to riders and you'll see "Unknown Rider" errors.



### seedCaregivers.jsThe `seedRides.js` script:

**Purpose**: Creates 2 service users (caregivers) who manage rides for others1. Fetches all existing service users from database

2. Creates a `userMap` { fullName → uuid }

**What it does**:3. Matches ride data names against real users

- Clears all existing caregiver records4. Uses ACTUAL database UUIDs in rides

- Creates demo caregivers: Sarah Johnson, Emily Chen

- Includes phone numbers and contact info---



**Data Includes**:## 📋 Available Seed Scripts

- Full name, phone

- Date of birth, race, marital status---

- Income level, residence information

- SMS consent tracking## 📋 Seed Files Reference

**Purpose**: Creates system users (authentication & authorization)

**Important**: These UUIDs are used by `seedRides.js` to link rides!

**What it does**:

**How to run**:- Clears all existing system users

```bash- Creates demo users for all 4 roles: admin, dispatcher, driver, case_manager

npm run seed:caregivers- Includes Swarm NYC team members and legacy demo users

```

**Roles**:

---- **admin**: Full system access, manage all features

- **dispatcher**: Manage ride requests, dispatch drivers

### seedDrivers.js- **driver**: View assigned rides, update ride status

**Purpose**: Creates 3 drivers and 1 fleet manager in service-providers collection- **case_manager**: Submit ride requests, manage cases



**What it does**:**How to run**:

- Clears all existing provider records```bash

- Creates 4 demo providers:npm run seed:system-users

  - Michael Chen (Driver) - EASTCONN```

  - Patricia Smith (Driver) - EASTCONN

  - David Martinez (Driver) - Generations Health**Current Users**:

  - Lisa Anderson (Fleet Manager) - EASTCONN

#### Riders (Case Managers)

**Data Includes**:- `johanguse` / `johanguse123` - Johan Guse (johan@swarmnyc.com)

- Full name, title, organization- `natecooper` / `natecooper123` - Nate Cooper (nate@swarmnyc.com)

- Mobile phone number

- Service provider role (Driver, Fleet Manager)#### Admins

- Specializations- `cassiebrinen` / `cassiebrinen123` - Cassie Brinen (cassie@swarmnyc.com)

- Email and password (reference only, NOT for authentication!)- `dominiquemorris` / `dominiquemorris123` - Dominique Morris (dominique@swarmnyc.com)

- `devswarm` / `devswarm123` - Virtual Phone Eastconn (dev@swarmnyc.com)

**Important Note**:

These are PROFILE records that get assigned to rides. For drivers to LOG IN to the app, they need a separate system-users account (created separately as per authentication system).#### Drivers

- `gusedriver` / `gusedriver123` - Guse (guse@swarmnyc.com)

**How to run**:- `driver-demo` / `driver123` - Driver User (legacy)

```bash

npm run seed:drivers---

```

### 2. `seedUsers.js` - Service Users

---**Purpose**: Creates service users (riders, caregivers, relatives, guardians, case managers)



### seedVehicles.js**What it does**:

**Purpose**: Creates ~10 fleet vehicles with accessibility features- Clears all existing service users

- Creates demo riders and caregivers with realistic profiles

**What it does**:- Includes SMS consent information

- Clears all existing vehicle records

- Creates demo vehicles with realistic specifications**Data Includes**:

- Includes vehicle display names, fleet IDs, capacity, service areas- Full name, phone, date of birth

- Tracks accessibility features (wheelchair accessible, etc.)- Race, marital status, income level

- Residence information

**Data Includes**:- Service user roles (rider, caregiver, relative, etc.)

- displayName: Friendly name (e.g., "2023 Toyota Sienna (Silver) - XYZ1234")- Veteran/disability status

- fleetId: Internal identifier- SMS consent tracking

- capacity: Passenger capacity

- serviceArea: Geographic coverage**How to run**:

- accessibilityFeatures: Comma-separated list```bash

npm run seed:users

**Example Vehicles**:```

- 2023 Toyota Sienna (Silver) - 8 passengers, wheelchair accessible

- 2022 Honda Odyssey (Black) - 7 passengers, wheelchair accessible**Example Users**:

- 2023 Ford Transit (White) - 15 passengers, wheelchair accessible- Johan Guse (Rider)

- Nate Cooper (Rider)

**How to run**:- Maria Rodriguez (Rider & Caregiver)

```bash- Sarah Johnson (Caregiver)

npm run seed:vehicles- James Davis (Caregiver & Relative)

```

---

---

### 3. `seedProviders.js` - Service Providers

### seedRides.js**Purpose**: Creates service provider profiles (drivers and staff) that get assigned to rides

**Purpose**: Creates 9 demo ride requests with various statuses

**What it does**:

**What it does**:- Clears all existing providers

- Creates demo rides with realistic scenarios- Creates 5 demo individual drivers/staff with profiles

- Includes 3 unassigned rides (waiting for assignment)- Includes email and password fields (for contact, NOT authentication)

- Includes 3 active rides (in progress)

- Includes 3 completed rides (finished today)**Data Includes**:

- Full name, title, organization

**Ride Types**:- Mobile phone number

- **Unassigned (3)**: Waiting for driver/vehicle assignment- Service provider role (Driver, Fleet Manager, Staff)

- **Active (3)**: Currently in progress (en route, picked up, etc.)- Specializations

- **Completed (3)**: Finished today- Email and password (reference only, NOT for login!)



**Data Includes**:**How to run**:

- Service user UUID and name (matched to actual database UUIDs)```bash

- Pickup and dropoff addressesnpm run seed:providers

- Requested and actual times```

- Vehicle and driver assignment

- Round trip status**Created Providers**:

- Ride status and request status- Johan Guse - Driver, EASTCONN

- Purpose and notes- Nate Cooper - Senior Driver, EASTCONN

- Sarah Johnson - Driver, Generations Health

**Key Feature**: Uses actual database UUIDs for riders and drivers via userMap- Mike Davis - Fleet Manager, EASTCONN

- Fetches existing service users from database- Emily Chen - Caseworker, Generations Health

- Maps rider names to actual database UUIDs

- Prevents "Unknown Rider" errors**Important Note**:

- Links rides to real database recordsThese are PROFILE records that get assigned to rides. For drivers to LOG IN to the app, they also need a separate system-users account (created by `seedSystemUsers.js`).



**How to run**:---

```bash

npm run seed:rides### 4. `seedVehicles.js` - Fleet Management

```**Purpose**: Creates vehicles for the fleet with display names and specifications



---**What it does**:

- Clears all existing vehicles

### seed.js - Master Orchestrator- Creates 9 demo vehicles using new schema

**Purpose**: Runs all 8 seeds in the correct order with unified output- Includes vehicle display names, fleet IDs, capacity, service areas

- Tracks accessibility features

**What it does**:

- Executes seeds sequentially (not parallel)**New Schema Fields**:

- Provides unified console output with progress tracking- displayName: Friendly name (e.g., "2023 Toyota Sienna (Silver) - XYZ1234")

- Prints quick reference credentials at the end- fleetId: Internal identifier (e.g., "FLEET-001")

- Reports statistics for all created records- capacity: Passenger capacity

- serviceArea: Geographic coverage (e.g., "Northeast Connecticut")

**Execution Flow**:- accessibilityFeatures: Comma-separated list

```

npm run seed**How to run**:

    ↓```bash

server/seed/seed.jsnpm run seed:vehicles

    ↓```

[1/8] seedAdmins.js       → 3 admins created

[2/8] seedDispatchers.js  → 1 dispatcher created**Example Vehicles**:

[3/8] seedCaseManagers.js → 1 case manager created- 2023 Toyota Sienna (Silver) - XYZ1234 (8 passengers, wheelchair accessible)

[4/8] seedRiders.js       → 2 riders created- 2022 Honda Odyssey (Black) - ABC5678 (7 passengers, wheelchair accessible)

[5/8] seedCaregivers.js   → 2 caregivers created- 2023 Ford Transit (White) - DEF9012 (15 passengers, wheelchair accessible)

[6/8] seedDrivers.js      → 4 providers created

[7/8] seedVehicles.js     → vehicles created---

[8/8] seedRides.js        → 9 rides created

    ↓### 5. `seedRides.js` - Ride Requests

✅ Complete (32+ records)**Purpose**: Creates demo ride requests with various statuses

```

**What it does**:

**How to run**:- Creates 10 demo rides with realistic scenarios

```bash- Includes 3 unassigned rides (waiting for assignment)

npm run seed- Includes 3 active rides (in progress)

npm run seed:all- Includes 4 completed rides (finished today)

```- Realistic pickup/dropoff locations

- Ride progress tracking

---

**Ride Types**:

## 🚀 Production Environment- **Unassigned (3)**: Waiting for driver/vehicle assignment

  - Driver needed

**Current Status:** ⚠️ NO AUTO-SEEDING IN PRODUCTION  - Vehicle needed

  - Confirmation needed

**Deployment Platforms:**  

- `railway.json`: Uses `npm start`- **Active (3)**: Currently in progress

- `render.yaml`: Uses `npm start`  - En route to pickup

  - Picked up, en route to dropoff

### Production Process  - Dropped off, waiting for return (round trip)

```

1. App builds:    npm run install-all && npm run build- **Completed (4)**: Finished today

2. App starts:    npm start → node server/index.js  - Medical appointments

3. Database:      Connects to production MongoDB  - Work commutes

4. Waits for:     Manual seed execution (if needed)  - Shopping trips

```  - Legal appointments



### Why NOT Auto-Seeding?**Data Includes**:

- Seeds create test/demo data- Service user UUID and name (matched to actual database UUIDs)

- Should not automatically run in production- Pickup and dropoff addresses

- Could overwrite real production data- Requested and actual times

- Manual control prevents data loss- Vehicle and driver assignment

- Round trip status

### Recommended Production Approaches- Ride status and request status

- Purpose and notes

**Option 1: ONE-TIME INITIALIZATION ENDPOINT (Recommended)**

**Key Feature**: Uses actual database UUIDs for riders and drivers via userMap

Create a `/api/admin/seed` endpoint (admin-only):- Fetches existing service users

- Checks if database is empty- Maps rider names to actual database UUIDs

- Seed only if no data exists- Prevents "Unknown Rider" errors

- Protected by authentication- Links rides to real database records



**Option 2: MANUAL SEEDING VIA SSH****How to run**:

```bash

```bashnpm run seed:rides

ssh user@production-server```

cd /app

npm run seed---

```

### 6. `seed.js` - Master Seed Script

Benefits:**Purpose**: Runs all seeds (1-6) in sequence with unified output

- Full control

- Can monitor output**What it does**:

- Can run anytime- Runs all 5 seed scripts in order

- Provides unified console output with progress tracking

---- Prints quick reference credentials at the end

- Reports statistics for all created records

## 🔍 App Initialization Sequence

**How to run**:

**File:** `server/index.js````bash

npm run seed

The app initializes WITHOUT seeding:npm run seed:all

```

```

1. require('dotenv').config()**Output**:

   ↓ Load environment variables- Progress indicators [1/5], [2/5], etc.

- Individual seed status

2. const generateApi = require("./database/api")- Quick reference credentials

   ↓ Import database API wrapper- Fleet statistics

- Ride statistics

3. init()

   ↓ Async initialization---



4. async function init() {## 🚀 Production Environment

     const api = await generateApi()

       ↓ Connect to MongoDB**Current Status:** ⚠️ NO AUTO-SEEDING IN PRODUCTION

       ↓ Get collections

       ↓ Configure search indexes**Deployment Platforms:**

       ↓ Return API object- `railway.json`: `startCommand: npm start`

     - `render.yaml`: `startCommand: npm start`

     const router = createRouter(api)

       ↓ Create Express routes### Production Process

     ```

     app.use('/api', router)1. App builds:    npm run install-all && npm run build

       ↓ Mount routes2. App starts:    npm start → node server/index.js

     3. Database:      Connects to production MongoDB

     app.listen(PORT)4. Waits for:     Manual seed execution (if needed)

       ↓ Start listening```

   }

```### Why NOT Auto-Seeding?

- Seeds create test/demo data

**NOTE:** ❌ NO SEEDING HAPPENS HERE- Should not automatically run in production

**✅ Seeding is 100% separate - run manually after app starts**- Could overwrite real production data

- Manual control prevents data loss

---

### Recommended Production Approaches

## 📝 Adding New Demo Data

**Option 1: ONE-TIME INITIALIZATION ENDPOINT (Recommended)**

To add new demo users/data:

Create a `/api/admin/seed` endpoint (admin-only):

### 1. Add System User- Checks if database is empty

Edit `server/seed/seedAdmins.js` (or seedDispatchers.js, seedCaseManagers.js):- Seed only if no data exists

```javascript- Protected by authentication

{

    username: 'unique_username',```

    password: 'password123',POST /api/admin/seed

    role: 'admin|dispatcher|case_manager',Authorization: Bearer <token>

    fullName: 'Full Name',

    email: 'email@example.com',Response:

    phone: '+1234567890'{

}  "status": "seeded",

```  "records_created": 41

}

### 2. Add Service User```

Edit `server/seed/seedRiders.js` or `server/seed/seedCaregivers.js` - Add to array

**Option 2: MANUAL SEEDING VIA SSH**

### 3. Add Driver/Provider

Edit `server/seed/seedDrivers.js` - Add to providers array```bash

ssh user@production-server

### 4. Add Vehiclecd /app

Edit `server/seed/seedVehicles.js` - Add to vehicles arraynpm run seed

```

### 5. Add Ride

Edit `server/seed/seedRides.js` - Add to rides arrayBenefits:

- Full control

Then run:- Can monitor output

```bash- Can run anytime

npm run seed

```**Option 3: DATABASE INITIALIZATION SCRIPT**



---Create `deploy/seed.js` that:

- Checks environment

## 🔧 Troubleshooting- Runs only if `NODE_ENV !== 'production'`

- Or explicitly flagged with `SEED_ON_DEPLOY=true`

### "Username already exists" error

- Seed scripts should clear old records automatically---

- If not, manually clear: `db.getCollection('system-users').deleteMany({})`

## 🔍 App Initialization Sequence

### "Collection already exists" error

- Try restarting MongoDB**File:** `server/index.js`

- Clear database and reseed if needed

```

### Connection errors1. require('dotenv').config()

- Ensure MongoDB is running: `mongod`   ↓ Load environment variables from .env

- Check `MONGODB_URI` in `.env` file

- Verify database credentials2. const generateApi = require("./database/api")

- Test connection: `npm run server` should connect on startup   ↓ Import database API wrapper



### Permission errors3. init()

- Ensure MongoDB user has write permissions   ↓ Start async initialization

- Check collection names match database structure

4. async function init() {

### "Unknown Rider" on dashboard     const api = await generateApi()

- `seedRides.js` didn't match riders to database UUIDs     ↓ Connect to MongoDB

- Ensure `seedRiders.js` and `seedCaregivers.js` ran before `seedRides.js`     ↓ Get collections (ride-requests, users, vehicles, etc.)

- Seeds MUST run in correct order     ↓ Configure search indexes

     ↓ Return API object with all methods

### Partial seeds (some data created, some not)     

- A seed script failed or was interrupted     const router = createRouter(api)

- Clear all data and run `npm run seed` again     ↓ Create Express routes with API

     

---     app.use('/api', router)

     ↓ Mount routes

## 📋 Environment Variables     

     app.listen(PORT)

Ensure these are set in `.env`:     ↓ Start listening for requests

   }

``````

MONGODB_URI=mongodb://user:password@host:port/database

NODE_ENV=development**NOTE:** ❌ NO SEEDING HAPPENS HERE

PORT=3001**✅ Seeding is 100% separate**

```

## 🛠️ Structure & Conventions

---

All seed scripts follow these conventions:

## ✅ Next Steps

```javascript

After seeding:// 1. Clear existing data

console.log('🗑️  Clearing existing...');

1. **Start the server:**

   ```bash// 2. Create new data

   npm run devconsole.log('👤 Creating fresh demo...');

   ```

// 3. Report status

2. **In another terminal, run seeds:**console.log('📊 SEED SUMMARY');

   ```bash

   npm run seed// 4. Display details organized by type/role

   ```console.log('📋 CREATED [...] BY [TYPE/ROLE]');



3. **Access the app:**// 5. Exit with status

   - Frontend: `http://localhost:5173`process.exit(0 or 1);

   - Backend: `http://localhost:3001````



4. **Log in with demo credentials**Console output includes:

- ✅ Success indicators

5. **Begin testing/development**- ❌ Error indicators

- ✓ Deleted items

---- 🌱 Seed start

- 🗑️ Clearing phase

## 📚 Database Collections- 👤 Creation phase

- 📊 Summary phase

After running all seeds, you'll have:- 📋 Details phase

- ✨ Completion

| Collection | Records | Purpose |

|-----------|---------|---------|---

| `system-users` | 5 | Authentication & authorization (admin, dispatcher, case manager) |

| `users` | 4 | Service users (riders, caregivers) |## 📝 Adding New Data

| `service-providers` | 4 | Service providers (drivers, fleet manager) |

| `vehicles` | ~10 | Fleet vehicles |To add new demo users/data to seed scripts:

| `ride-requests` | 9 | Ride requests (various statuses) |

| `notifications` | 0+ | Created during operations |### 1. System Users

Edit `server/seed/seedSystemUsers.js`:

**Total: ~32 demo records** ready for testing```javascript

{

---    username: 'unique_username',

    password: 'password123',

## 🎯 Best Practices    role: 'admin|dispatcher|driver|case_manager',

    fullName: 'Full Name',

### Development:    email: 'email@example.com',

✅ Run seeds AFTER app starts    phone: '+1234567890'

✅ Can run multiple times (clears old data first)}

✅ Seeds fresh demo data each time```

✅ Fast iteration on data changes

### 2. Service Users

### Production:Edit `server/seed/seedUsers.js` - Add to `demoUsers` array

✅ NEVER auto-seed on startup

✅ Use one-time initialization endpoint### 3. Providers

✅ Manual SSH seeding for special casesEdit `server/seed/seedProviders.js` - Add to `demoProviders` array

✅ Backup database before seeding

✅ Test in staging first### 4. Vehicles

Edit `server/seed/seedVehicles.js` - Add to `demoVehicles` array

### Testing:

✅ Use separate test database### 5. Rides

✅ Seed before each test runEdit `server/seed/seedRides.js` - Add to ride data array

✅ Clean up after tests

✅ Or use fixtures/mocksThen run:

```bash

---npm run seed:all

```

## 📊 Quick Summary

---

- **8 seed files** organized by role/purpose

- **32+ demo records** across all collections## 🔧 Troubleshooting

- **Manual execution** (separate from app startup)

- **Idempotent** (safe to run multiple times)### "Username already exists" error

- **Sequenced** (runs in correct dependency order)- Database still has old records

- **Comprehensive** (all roles and scenarios covered)- Seed script should clear them automatically

- Manually clear if needed: `db.getCollection('system-users').deleteMany({})`

For more details on authentication, see `docs/AUTHENTICATION.md`.

### "Collection already exists" error
- MongoDB may cache the collection
- Try: Restart MongoDB or clear database and reseed

### Connection errors
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env` file
- Verify database credentials
- Test connection: `npm run server` should connect on startup

### Permission errors
- Ensure MongoDB user has write permissions
- Check collection names match database structure

### "Unknown Rider" on dashboard
- seedRides.js didn't match riders to database UUIDs
- Ensure seedUsers.js ran before seedRides.js
- Seeds must run in correct order

### Missing dependencies
```bash
npm install uuid
```

---

## 📋 Environment Variables

Ensure these are set in `.env`:

```
MONGODB_URI=mongodb://user:password@host:port/database
NODE_ENV=development
```

---

## ✅ Next Steps

After seeding:
1. Start the server: `npm run dev`
2. Seeds will populate in separate terminal: `npm run seed`
3. Access the app at `http://localhost:5173` (or configured port)
4. Log in with seeded credentials
5. Begin testing/development

---

## 📚 Database Collections

After running all seeds, you'll have these collections:

| Collection | Records | Purpose |
|-----------|---------|---------|
| `system-users` | 11 | Authentication & authorization (login accounts) |
| `users` | 5 | Service users (riders, caregivers) |
| `service-providers` | 5 | Service providers (driver/staff profiles for ride assignment) |
| `vehicles` | 9 | Fleet vehicles |
| `ride-requests` | 10 | Ride requests (various statuses) |
| `notifications` | 0 | Created during operations |

**Total: 40 demo records** ready for testing and development

**Note**: Drivers exist in TWO collections:
- `system-users` (role='driver') - For logging into the app
- `service-providers` - For being assigned to rides

---

## 📊 Demo Data Summary

**Total Records:** 41

| Collection | Count | Details |
|------------|-------|---------|
| System Users | 11 | admin, cassiebrinen, dominiquemorris, devswarm, johanguse, natecooper, gusedriver, + 4 legacy |
| Service Users | 5 | Johan Guse, Nate Cooper, Maria Rodriguez, Sarah Johnson, James Davis |
| Service Providers | 5 | Individual drivers/staff: Johan Guse, Nate Cooper, Sarah Johnson, Mike Davis, Emily Chen |
| Vehicles | 9 | Fleet with new schema (displayName, fleetId, accessibility features) |
| Ride Requests | 10 | 3 unassigned, 3 active, 4 completed |

---

## 🎯 Best Practices

### Development:
✓ Run seeds AFTER app starts
✓ Can run multiple times (clears old data first)
✓ Seeds fresh demo data each time
✓ Fast iteration on data changes

### Production:
✓ NEVER auto-seed on startup
✓ Use one-time initialization endpoint
✓ Manual SSH seeding for special cases
✓ Backup database before seeding
✓ Test in staging first

### Testing:
✓ Use separate test database
✓ Seed before each test run
✓ Clean up after tests
✓ Or use fixtures/mocks

