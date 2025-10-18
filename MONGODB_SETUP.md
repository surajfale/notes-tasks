# MongoDB Atlas Setup Guide

This guide walks you through setting up MongoDB Atlas for the Notes & Tasks application.

## Step 1: Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with email or Google/GitHub
3. Complete email verification

## Step 2: Create a New Project

1. After login, click **"New Project"**
2. Project Name: `notes-tasks-app`
3. Click **"Next"** and **"Create Project"**

## Step 3: Create a Cluster

1. Click **"Build a Database"** or **"Create"**
2. Choose **"M0 FREE"** tier
   - 512 MB storage
   - Shared RAM
   - No credit card required
3. **Provider**: AWS, Google Cloud, or Azure (choose closest region)
4. **Region**: Select region nearest to you
5. **Cluster Name**: `NotesTasksCluster` (or keep default)
6. Click **"Create Deployment"**

## Step 4: Create Database User

1. A popup will appear for **Security Quickstart**
2. **Authentication Method**: Username and Password
3. **Username**: `notestasksuser` (or your choice)
4. **Password**: Click "Autogenerate Secure Password" or create your own
   - **IMPORTANT**: Save this password! You'll need it for connection string
5. Click **"Create User"**

## Step 5: Configure Network Access

1. In the same popup, under **"Where would you like to connect from?"**
2. For development, choose **"My Local Environment"**
3. Click **"Add My Current IP Address"**
4. For production/testing from anywhere, you can also add:
   - IP Address: `0.0.0.0/0` (allows all IPs - use with caution)
   - Description: "Allow all (temporary)"
5. Click **"Finish and Close"**

## Step 6: Get Connection String

1. Click **"Connect"** on your cluster
2. Choose **"Drivers"**
3. **Driver**: Node.js
4. **Version**: 5.5 or later
5. Copy the connection string:
   ```
   mongodb+srv://notestasksuser:<password>@notestaskscluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Replace `<password>`** with your actual database user password
7. Add your database name (e.g., `notestasksdb`) before the `?`:
   ```
   mongodb+srv://notestasksuser:yourpassword@notestaskscluster.xxxxx.mongodb.net/notestasksdb?retryWrites=true&w=majority
   ```

## Step 7: Create Collections and Indexes

### Option A: Using MongoDB Compass (GUI)

1. Download [MongoDB Compass](https://www.mongodb.com/products/tools/compass)
2. Connect using your connection string
3. Create database: `notestasksdb`
4. Create collections: `users`, `lists`, `notes`, `tasks`
5. Create indexes (see below)

### Option B: Using MongoDB Shell

1. From Atlas UI, click **"Connect"** → **"Shell"**
2. Or install [mongosh](https://www.mongodb.com/docs/mongodb-shell/) locally
3. Connect:
   ```bash
   mongosh "mongodb+srv://notestaskscluster.xxxxx.mongodb.net/notestasksdb" --apiVersion 1 --username notestasksuser
   ```
4. Create indexes:
   ```javascript
   use notestasksdb
   
   // Users collection indexes
   db.users.createIndex({ username: 1 }, { unique: true })
   db.users.createIndex({ email: 1 }, { unique: true })
   
   // Lists collection indexes
   db.lists.createIndex({ userId: 1, updatedAt: -1 })
   
   // Notes collection indexes
   db.notes.createIndex({ userId: 1, listId: 1, updatedAt: -1 })
   db.notes.createIndex({ userId: 1, isArchived: 1 })
   db.notes.createIndex({ userId: 1, tags: 1 })
   
   // Tasks collection indexes
   db.tasks.createIndex({ userId: 1, listId: 1, dueAt: 1 })
   db.tasks.createIndex({ userId: 1, isCompleted: 1 })
   ```

### Option C: Let the Backend Create Them (Automatic)

The Node.js backend includes Mongoose schemas with index definitions. On first run, Mongoose will automatically create indexes. No manual setup needed!

## Step 8: Configure Environment Variables

In your backend project, create `.env` file:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://notestasksuser:yourpassword@notestaskscluster.xxxxx.mongodb.net/notestasksdb?retryWrites=true&w=majority

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# JWT Expiration
JWT_EXPIRES_IN=7d

# CORS Allowed Origins (comma-separated)
CORS_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

**Generate a strong JWT_SECRET**:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64
```

## Step 9: Test Connection

**Important**: Always use localhost for testing, not production URLs.

Create a test script `test-connection.js`:

```javascript
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    console.log('Database:', mongoose.connection.db.databaseName);
    return mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });
```

Run it:
```bash
node test-connection.js
```

You should see: `✅ MongoDB Connected Successfully!`

Or test with backend:
```bash
cd backend
npm run dev
# Then test: curl http://localhost:3000/health
```

## Step 10: Verify Collections

After running your backend once, verify in Atlas:

1. Go to Atlas Dashboard
2. Click **"Browse Collections"** on your cluster
3. You should see:
   - Database: `notestasksdb`
   - Collections: `users`, `lists`, `notes`, `tasks`

## Production Setup Checklist

When moving to production:

- [ ] Create a dedicated production cluster (not M0 free tier for high traffic)
- [ ] Use strong, unique database user password
- [ ] Restrict IP whitelist to your production server IPs only
- [ ] Enable MongoDB Atlas monitoring and alerts
- [ ] Set up automated backups (available in paid tiers)
- [ ] Use environment-specific databases (dev, staging, prod)
- [ ] Rotate JWT_SECRET regularly
- [ ] Enable MongoDB Atlas Performance Advisor
- [ ] Set up connection string as environment variable (never commit to git)

## Troubleshooting

### Connection Timeout
- **Cause**: IP not whitelisted
- **Fix**: Add your IP in Network Access settings

### Authentication Failed
- **Cause**: Wrong password in connection string
- **Fix**: Verify password, ensure special characters are URL-encoded

### Database User Not Authorized
- **Cause**: User doesn't have permissions
- **Fix**: In Database Access, ensure user has "Read and write to any database" role

### URL Encoding Special Characters
If your password contains special characters, URL-encode them:
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `?` → `%3F`
- `#` → `%23`

Example:
```
Password: p@ssw0rd!
Encoded: p%40ssw0rd!
Connection string: mongodb+srv://user:p%40ssw0rd!@cluster.mongodb.net/db
```

## Resources

- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Connection String Format](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
