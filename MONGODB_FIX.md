# MongoDB Atlas Configuration for Render

## Issue Fixed:
The SSL/TLS error was caused by:
1. Missing database name in connection string
2. Missing TLS configuration options
3. Potentially incompatible Node.js version

## Changes Made:

### 1. Updated MongoDB Connection String
Added database name and proper parameters:
```
mongodb+srv://johanguse_db_user:5olFTK0V7ZrFxLrt@cluster0.n7wsemq.mongodb.net/ride-request-app?retryWrites=true&w=majority&appName=Cluster0
```

### 2. Updated `server/database/setup.js`
Added TLS configuration options:
```javascript
const client = await new MongoClient(dbUri, {
    tls: true,
    tlsAllowInvalidCertificates: false,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
}).connect();
```

### 3. Added Node.js Engine in `package.json`
Ensures Render uses Node 18+:
```json
"engines": {
  "node": ">=18.0.0",
  "npm": ">=9.0.0"
}
```

## MongoDB Atlas Configuration Steps:

### 1. Whitelist Render's IP Addresses
- Go to [MongoDB Atlas](https://cloud.mongodb.com)
- Select your cluster → Network Access
- Click "Add IP Address"
- Choose "Allow Access from Anywhere" (0.0.0.0/0)
  - This is required for Render's dynamic IPs
- Click "Confirm"

### 2. Verify Database User Permissions
- Go to Database Access
- Ensure user `johanguse_db_user` has:
  - Role: `readWrite` on database `ride-request-app`
  - Or use `Atlas admin` for full access

### 3. Update Connection String in Render
- Go to your Render dashboard
- Select your service
- Go to **Environment** tab
- Update `MONGODB_URI` to:
  ```
  mongodb+srv://johanguse_db_user:5olFTK0V7ZrFxLrt@cluster0.n7wsemq.mongodb.net/ride-request-app?retryWrites=true&w=majority&appName=Cluster0
  ```

### 4. Redeploy on Render
- After updating environment variables
- Click "Manual Deploy" → "Deploy latest commit"
- Or push a new commit to trigger auto-deploy

## Testing Locally:

```bash
# Test the connection
npm run dev

# Should see in logs:
# "Connected to MongoDB"
# "Server running on port 5000"
```

## Troubleshooting:

If you still get errors:

1. **Check MongoDB Atlas Status**
   - Ensure cluster is running (not paused)

2. **Verify Credentials**
   - Username: `johanguse_db_user`
   - Password: `5olFTK0V7ZrFxLrt`
   - These must match in Atlas

3. **Check Network Access**
   - Must allow 0.0.0.0/0 for Render

4. **Check Render Logs**
   ```bash
   # In Render dashboard, check the Logs tab
   # Look for MongoDB connection messages
   ```

5. **Test Connection String**
   ```bash
   # Use mongosh to test locally
   mongosh "mongodb+srv://johanguse_db_user:5olFTK0V7ZrFxLrt@cluster0.n7wsemq.mongodb.net/ride-request-app"
   ```

## Security Note:

⚠️ **Important**: Your credentials are now visible in this chat. After deployment, you should:
1. Rotate your MongoDB password in Atlas
2. Update the connection string in Render environment variables
3. Never commit `.env` file to git (ensure it's in `.gitignore`)
