# Development Guide

> **Complete guide for setting up and developing Rural Dispatch locally**

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
```bash
# Node.js (v18.0.0 or higher)
node --version  # Should be >= 18.0.0

# npm (v9.0.0 or higher)
npm --version

# Git
git --version

# MongoDB (local) OR MongoDB Atlas account
mongod --version  # Optional if using Atlas
```

### Recommended Tools
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
- **Postman** or **Insomnia** for API testing
- **MongoDB Compass** for database inspection
- **ngrok** for webhook testing

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/ride-request-mvp-johan.git
cd ride-request-mvp-johan
```

### 2. Install Dependencies

```bash
# Install all dependencies (root, client, shared)
npm run install-all

# Or install individually
npm install          # Root dependencies
cd client && npm install
cd ../shared && npm install
```

### 3. Verify Installation

```bash
# Check if all packages installed correctly
npm list --depth=0
cd client && npm list --depth=0
```

---

## Environment Configuration

### 1. Create Environment Files

#### Root `.env` (Server Configuration)
```bash
cp .env.example .env
```

Edit `/ride-request-mvp-johan/.env`:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ride-request-app
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ride-request-app

# Server Configuration
NODE_ENV=development
PORT=5000

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# SMS Providers (Optional for development)
# Twilio Configuration (Primary)
TWILIO_MESSAGING_SERVICE_SID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WEBHOOK_URL=http://localhost:5000/api/notifications/webhook/twilio
TWILIO_STATUS_CALLBACK_URL=http://localhost:5000/api/notifications/status/twilio
# Set to 'true' to disable status callbacks during development
TWILIO_DISABLE_STATUS_CALLBACK=true

# Vonage Configuration (Fallback)
VONAGE_API_KEY=
VONAGE_API_SECRET=
VONAGE_FROM_NUMBER=
VONAGE_WEBHOOK_URL=http://localhost:5000/api/notifications/webhook/vonage
```

### 2. Get API Keys

#### Twilio Setup (Optional)
1. Sign up at [Twilio Console](https://console.twilio.com/)
2. Get Account SID and Auth Token from dashboard
3. Buy a phone number with SMS capability
4. Copy credentials to `.env`

#### Vonage Setup (Optional)
1. Sign up at [Vonage Dashboard](https://dashboard.nexmo.com/)
2. Get API Key and Secret from Settings
3. Copy credentials to `.env`

---

## Database Setup

### Option 1: Local MongoDB

#### Install MongoDB
```bash
# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Windows
# Download from https://www.mongodb.com/try/download/community
```

#### Verify MongoDB is Running
```bash
# Check status
brew services list | grep mongodb  # macOS
sudo systemctl status mongodb      # Linux

# Connect to MongoDB shell
mongosh
# Or older versions:
mongo

# In MongoDB shell:
show dbs
use ride-request-app
```

### Option 2: MongoDB Atlas (Cloud)

1. **Create Account**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Create Cluster**:
   - Choose Free tier (M0)
   - Select region closest to you
   - Name: `ride-request-cluster`
3. **Create Database User**:
   - Username: `dev-user`
   - Password: Generate strong password
   - Save credentials securely
4. **Configure Network Access**:
   - Add IP: `0.0.0.0/0` (allow from anywhere - development only)
   - Or add your current IP
5. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your user password
   - Update `.env` with connection string

### Seed Database

```bash
# Seed system users (admin, dispatcher, driver, case_manager)
npm run seed:system-users

# Seed all demo data
npm run seed

# Or seed individually
npm run seed:users      # Service users (riders)
npm run seed:providers  # Service providers (drivers)
npm run seed:vehicles   # Vehicles
npm run seed:rides      # Ride requests
```

### Verify Data

```bash
# Using MongoDB shell
mongosh "mongodb://localhost:27017/ride-request-app"

# List collections
show collections

# Check system users
db['system-users'].find().pretty()

# Check service users
db.users.find().limit(5).pretty()
```

---

## Running the Application

### Development Mode (Recommended)

```bash
# From root directory - runs both client and server
npm run dev

# This starts:
# - Server on http://localhost:5000
# - Client on http://localhost:3001
```

### Run Individually

```bash
# Terminal 1: Server only
npm run server

# Terminal 2: Client only
npm run client
```

### Access the Application

1. **Open Browser**: http://localhost:3001
2. **Portal Password**: `hackct25`
3. **Sign In** with demo credentials:
   - Admin: `admin` / `admin123`
   - Dispatcher: `dispatcher` / `dispatch123`
   - Driver: `driver` / `driver123`
   - Case Manager: `casemanager` / `case123`

---

## Development Workflow

### Project Structure
```
ride-request-mvp-johan/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   ├── utils/       # Utility functions
│   │   ├── types/       # TypeScript types
│   │   └── schemas/     # Zod schemas
│   └── vite.config.ts
├── server/              # Express backend
│   ├── database/        # DB operations
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   └── constants/       # Status constants
├── shared/              # Shared validation schemas
│   └── schemas/
└── docs/                # Documentation
```

### Hot Reloading

Both client and server support hot reloading:
- **Client**: Vite HMR - instant updates
- **Server**: Nodemon - auto-restarts on file changes

### Making Changes

#### Frontend Changes
1. Edit files in `client/src/`
2. Browser auto-refreshes
3. Check browser console for errors
4. Use React DevTools for debugging

#### Backend Changes
1. Edit files in `server/`
2. Server auto-restarts
3. Check terminal for errors
4. Test API with Postman

#### Shared Schema Changes
1. Edit files in `shared/schemas/`
2. Both client and server auto-reload
3. Test form validation

### Code Style

```bash
# Format code (if Prettier is configured)
npm run format

# Lint code (if ESLint is configured)
npm run lint

# TypeScript type checking
cd client && npx tsc --noEmit
```

---

## Testing

### Manual Testing Checklist

#### Authentication Flow
```bash
# 1. Test portal access
- Navigate to http://localhost:3001
- Enter password: hackct25
- Should redirect to sign-in

# 2. Test user sign-in
- Try each role (admin, dispatcher, driver, case_manager)
- Verify role-based navigation
- Check user badge in navbar

# 3. Test logout
- Click logout button
- Should redirect to sign-in (not portal)
- Verify session cleared
```

#### Ride Request Creation
```bash
# 1. Create new user
- Click "Add a User" (admin/dispatcher only)
- Fill in all required fields
- Verify user created in database

# 2. Create ride request
- Search for user
- Fill in ride details
- Test Google Maps autocomplete
- Submit form
- Verify ride request in dashboard

# 3. Assign driver
- Open ride request
- Click "Assign Driver"
- Search and select driver
- Verify assignment
```

#### SMS Testing (if configured)
```bash
# 1. Update ride status
- Change ride status to trigger SMS
- Check server logs for SMS sent
- Verify SMS received on phone

# 2. Test opt-out
- Reply "STOP" to SMS
- Check user opt-out status in database
- Verify no more SMS sent

# 3. Test two-way SMS
- Send SMS from phone
- Check incoming SMS in dashboard
- Reply from dashboard
```

### API Testing with curl

```bash
# Health check
curl http://localhost:5000/health

# Get all users
curl http://localhost:5000/api/users | jq

# Get ride requests
curl http://localhost:5000/api/riderequests | jq

# Create ride request
curl -X POST http://localhost:5000/api/riderequests \
  -H "Content-Type: application/json" \
  -d '{
    "serviceUserUuid": "test-user-uuid",
    "pickupAddress": "123 Main St",
    "dropOffAddress": "456 Oak Ave",
    "pickupRequestedTime": "2025-01-15T10:00:00Z",
    "dropOffRequestedTime": "2025-01-15T11:00:00Z"
  }' | jq
```

### Database Testing

```bash
# Connect to MongoDB
mongosh "mongodb://localhost:27017/ride-request-app"

# Useful queries
db['system-users'].find({}, { username: 1, role: 1 })
db.users.countDocuments()
db['ride-requests'].find().sort({ createdAt: -1 }).limit(5)
db.notifications.find({ rideUuid: "your-ride-uuid" })

# Clear specific collection (careful!)
db['ride-requests'].deleteMany({})

# Reset database (re-run seeds)
db.dropDatabase()
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Error: EADDRINUSE: address already in use :::5000
# Solution: Change port in .env
PORT=5001

# Also update client/vite.config.ts proxy target
```

#### MongoDB Connection Failed
```bash
# Error: MongoServerError: Authentication failed
# Solutions:
1. Check MONGODB_URI in .env
2. Verify username/password
3. Check network access in Atlas
4. Ensure MongoDB is running locally

# Test connection
mongosh "your-mongodb-uri"
```

#### Google Maps Not Loading
```bash
# Error: Google Maps API key missing
# Solutions:
1. Check VITE_GOOGLE_MAPS_API_KEY in client/.env
2. Verify API key is valid
3. Check API restrictions in Google Cloud Console
4. Enable required APIs
5. Restart dev server after adding key
```

#### SMS Not Sending
```bash
# Check provider status
curl http://localhost:5000/api/notifications/provider-status | jq

# Solutions:
1. Verify SMS provider credentials in .env
2. Check account balance (Twilio/Vonage)
3. Verify phone number format (+1234567890)
4. Check server logs for errors
5. Test with test credentials first
```

#### TypeScript Errors
```bash
# Error: Property 'env' does not exist on type 'ImportMeta'
# Solution: Already fixed in vite-env.d.ts

# Run type checking
cd client && npx tsc --noEmit

# If errors persist:
1. Restart VS Code TypeScript server
2. Delete node_modules and reinstall
3. Check tsconfig.json paths
```

#### Hot Reload Not Working
```bash
# Client not refreshing
1. Check browser console for errors
2. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
3. Restart Vite dev server

# Server not restarting
1. Check nodemon is installed
2. Verify server/nodemon.json configuration
3. Check for syntax errors
```

### Debug Mode

#### Enable Verbose Logging
```javascript
// In server/index.js (temporarily)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

#### Check Environment Variables
```bash
# Server
node -e "console.log(process.env.MONGODB_URI)"

# Client (Vite)
# In client/src/main.tsx
console.log('API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
```

### Getting Help

1. **Check Logs**:
   - Server: Terminal where `npm run dev` is running
   - Client: Browser DevTools Console
   - Database: MongoDB logs

2. **Documentation**:
   - `/docs` folder for detailed guides
   - `CLAUDE.md` for project overview
   - API docs in `/docs/API_REFERENCE.md` (if exists)

3. **Common Commands**:
   ```bash
   npm run dev           # Start everything
   npm run seed          # Reset demo data
   npm run install-all   # Reinstall dependencies
   ```

---

## Next Steps

1. **Read Documentation**: Check `/docs` for specific guides
2. **Explore Codebase**: Start with `CLAUDE.md` for architecture overview
3. **Try Features**: Test all user roles and features
4. **Make Changes**: Follow development workflow above
5. **Check Tests**: Run manual testing checklist before commits

## Additional Resources

- [Authentication Guide](./AUTHENTICATION.md)
- [SMS Setup Guide](./SMS_SETUP.md)
- [Seeding Guide](./SEEDING.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Toll-Free Verification](./TOLL_FREE_VERIFICATION.md)
