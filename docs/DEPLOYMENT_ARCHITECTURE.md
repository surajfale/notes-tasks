# Deployment Architecture

This document explains the complete deployment architecture and clarifies what gets deployed where.

## Overview

The application uses a **3-tier architecture** with services deployed on different platforms:

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                               │
│                    (Web Browsers)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    NETLIFY (CDN)                            │
│              Frontend Static Files                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  - HTML, CSS, JavaScript (SvelteKit)                  │  │
│  │  - Service Worker (PWA)                               │  │
│  │  - Static Assets (icons, images)                      │  │
│  │  - Precompressed (gzip/brotli)                        │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ API Calls
                         │ (HTTPS/JSON + JWT)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    RAILWAY                                  │
│              Backend Node.js Server                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  - Express.js REST API                                │  │
│  │  - JWT Authentication                                 │  │
│  │  - Business Logic                                     │  │
│  │  - Cron Jobs (notifications, cleanup)                │  │
│  │  - Email Service (Resend)                            │  │
│  │  - AI Service (Ollama Cloud)                         │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ MongoDB Wire Protocol
                         │ (Connection String)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  MONGODB ATLAS (Cloud)                      │
│                    Database Service                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  - users collection                                   │  │
│  │  - lists collection                                   │  │
│  │  - notes collection                                   │  │
│  │  - tasks collection                                   │  │
│  │  - notificationpreferences collection                 │  │
│  │  - notificationlogs collection                        │  │
│  │  - Automatic backups                                  │  │
│  │  - Indexes and optimization                           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## What Gets Deployed Where

### 1. Frontend → Netlify (Static Hosting)

**What**: SvelteKit application built as static files

**Deployment**:
- Netlify automatically builds from GitHub
- Runs `npm run build` in `frontend/` directory
- Deploys to global CDN
- Serves static HTML, CSS, JavaScript

**No server needed**: Frontend is just static files served by CDN

**Cost**: Free tier (100GB bandwidth/month)

### 2. Backend → Railway (Node.js Server)

**What**: Express.js REST API server

**Deployment**:
- Railway automatically deploys from GitHub
- Runs `npm start` in `backend/` directory
- Keeps server running 24/7
- Handles API requests
- Runs cron jobs automatically

**Server required**: Backend needs to stay running for:
- API endpoints
- Cron jobs (notifications)
- Real-time processing

**Cost**: Free tier ($5/month credits)

### 3. Database → MongoDB Atlas (Cloud Database)

**What**: MongoDB database cluster

**Deployment**:
- **NOT deployed by you** - it's a managed service
- MongoDB Atlas hosts and manages the database
- You just create a cluster and get a connection string
- No code deployment needed

**How it works**:
1. Create account at https://cloud.mongodb.com
2. Create a free M0 cluster
3. Get connection string
4. Add connection string to Railway environment variables
5. Backend connects to it automatically

**Cost**: Free tier (M0 cluster, 512MB storage)

## Deployment Steps Summary

### Step 1: Setup MongoDB Atlas (One-time)

```bash
# 1. Go to https://cloud.mongodb.com
# 2. Create free account
# 3. Create new cluster (M0 Free tier)
# 4. Create database user
# 5. Whitelist IP addresses (0.0.0.0/0 for Railway)
# 6. Get connection string:
#    mongodb+srv://username:password@cluster.mongodb.net/dbname
```

**Important**: MongoDB Atlas is a **managed service** - you don't deploy anything. You just use their cloud database.

### Step 2: Deploy Backend to Railway

```bash
# 1. Push code to GitHub
git push origin main

# 2. Go to https://railway.app
# 3. Create new project from GitHub repo
# 4. Railway automatically:
#    - Detects Node.js project
#    - Installs dependencies
#    - Starts server
#    - Keeps it running

# 5. Set environment variables in Railway dashboard:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your_generated_secret
NODE_ENV=production
CORS_ORIGINS=https://your-app.netlify.app
# ... other variables
```

**Railway handles**:
- Server hosting
- Automatic restarts
- Logs
- Metrics
- Cron jobs (run automatically when server starts)

### Step 3: Deploy Frontend to Netlify

```bash
# 1. Push code to GitHub (same repo)
git push origin main

# 2. Go to https://app.netlify.com
# 3. Create new site from GitHub repo
# 4. Netlify automatically:
#    - Runs npm run build
#    - Deploys static files
#    - Serves via CDN

# 5. Set environment variable in Netlify:
VITE_API_BASE_URL=https://your-app.up.railway.app/api
```

**Netlify handles**:
- Static file hosting
- CDN distribution
- SSL certificates
- Automatic builds

## Do You Need Separate Deployments?

### ❌ NO - You do NOT deploy MongoDB

MongoDB Atlas is a **managed database service**. You:
- ✅ Create a cluster on their website
- ✅ Get a connection string
- ✅ Use it in your backend
- ❌ Don't deploy any database code
- ❌ Don't manage database servers

Think of it like using Gmail - you don't deploy Gmail, you just use it.

### ✅ YES - You deploy Backend and Frontend separately

**Why separate?**
1. **Different technologies**: Static files vs Node.js server
2. **Different platforms**: Netlify (CDN) vs Railway (server)
3. **Different scaling**: Frontend scales via CDN, backend scales via server instances
4. **Different costs**: Frontend is cheaper (static), backend needs running server

## Connection Flow

### User visits website:

```
1. Browser requests https://your-app.netlify.app
   │
   ▼
2. Netlify CDN serves static files (HTML, CSS, JS)
   │
   ▼
3. JavaScript loads in browser
   │
   ▼
4. User logs in
   │
   ▼
5. JavaScript sends API request to Railway:
   POST https://your-app.up.railway.app/api/auth/login
   │
   ▼
6. Railway backend receives request
   │
   ▼
7. Backend connects to MongoDB Atlas:
   mongodb+srv://cluster.mongodb.net/db
   │
   ▼
8. MongoDB Atlas returns user data
   │
   ▼
9. Backend sends response to browser
   │
   ▼
10. Browser displays user's notes/tasks
```

## Cron Jobs in Deployment

### Where do cron jobs run?

**Answer**: On Railway (backend server)

**How**:
1. Backend server starts on Railway
2. `server.js` initializes cron jobs automatically
3. Cron jobs run as long as server is running
4. Railway keeps server running 24/7

**No separate deployment needed** for cron jobs - they're part of the backend code.

### Cron Job Flow:

```
Railway Server Starts
    │
    ├─► Express.js starts
    ├─► MongoDB connection established
    ├─► Cron jobs initialized
    │   ├─► Notification job (9 AM daily)
    │   └─► Cleanup job (Sunday 2 AM)
    │
    └─► Server ready to handle requests

Every day at 9 AM:
    │
    ├─► Cron triggers notification job
    ├─► Queries MongoDB for tasks
    ├─► Sends emails via Resend API
    └─► Logs results

Every Sunday at 2 AM:
    │
    ├─► Cron triggers cleanup job
    ├─► Deletes old logs from MongoDB
    └─► Logs results
```

## Environment Variables by Platform

### Railway (Backend)

```bash
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# Authentication
JWT_SECRET=your_64_char_hex_string
JWT_EXPIRES_IN=7d

# Server
NODE_ENV=production
PORT=3000  # Railway sets automatically

# CORS
CORS_ORIGINS=https://your-app.netlify.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Cron Jobs
NOTIFICATION_CRON_SCHEDULE=0 9 * * *
NOTIFICATION_TIMEZONE=UTC
NOTIFICATION_CLEANUP_CRON_SCHEDULE=0 2 * * 0
NOTIFICATION_LOGS_RETENTION_DAYS=90

# Email (Optional)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=https://your-app.netlify.app

# AI (Optional)
OLLAMA_API_URL=https://ollama.com/api/chat
OLLAMA_API_KEY=your_ollama_api_key
OLLAMA_MODEL=gpt-oss:120b-cloud
```

### Netlify (Frontend)

```bash
# Only one variable needed
VITE_API_BASE_URL=https://your-app.up.railway.app/api
```

### MongoDB Atlas (Database)

**No environment variables** - just create cluster and get connection string

## Cost Breakdown

| Service | Free Tier | What You Get |
|---------|-----------|--------------|
| **MongoDB Atlas** | M0 Cluster | 512MB storage, shared CPU |
| **Railway** | $5/month credits | ~500 hours runtime |
| **Netlify** | 100GB bandwidth | Unlimited sites, auto SSL |
| **Resend** (Email) | 100 emails/day | Email API for notifications |
| **Ollama Cloud** (AI) | Varies | AI content enhancement |

**Total for small app**: $0-5/month (all free tiers)

## Scaling Considerations

### When you need to scale:

**Frontend (Netlify)**:
- ✅ Automatically scales via CDN
- ✅ No action needed
- ✅ Handles millions of users

**Backend (Railway)**:
- Upgrade to paid plan for more resources
- Add more server instances
- Consider load balancer

**Database (MongoDB Atlas)**:
- Upgrade from M0 to M10+ cluster
- More storage and RAM
- Dedicated CPU

## Troubleshooting

### Backend can't connect to MongoDB

**Problem**: `MongoNetworkError: connection refused`

**Solution**:
1. Check MongoDB Atlas IP whitelist
2. Add `0.0.0.0/0` to allow all IPs (Railway uses dynamic IPs)
3. Verify connection string is correct
4. Check database user credentials

### Frontend can't reach backend

**Problem**: `Network Error` or CORS errors

**Solution**:
1. Verify `VITE_API_BASE_URL` in Netlify
2. Check `CORS_ORIGINS` in Railway includes Netlify URL
3. Ensure Railway backend is running
4. Test backend health: `curl https://your-app.up.railway.app/health`

### Cron jobs not running

**Problem**: No notification emails sent

**Solution**:
1. Check Railway logs for cron messages
2. Verify `NODE_ENV` is not set to `test`
3. Check cron schedule is valid
4. Ensure server is running (Railway keeps it up)

## Summary

### What you deploy:

1. ✅ **Backend code** → Railway (Node.js server)
2. ✅ **Frontend code** → Netlify (static files)
3. ❌ **Database** → Use MongoDB Atlas (managed service, no deployment)

### What runs where:

- **Netlify**: Static files only (HTML, CSS, JS)
- **Railway**: Backend server + Cron jobs
- **MongoDB Atlas**: Database (managed by MongoDB)

### Key points:

- MongoDB Atlas is a **service you use**, not something you deploy
- Cron jobs run automatically on Railway when backend starts
- Frontend and backend are separate deployments
- All three services communicate via internet (HTTPS/MongoDB protocol)
- Free tiers available for all services

You only need **ONE Railway deployment** for the backend, and it automatically connects to MongoDB Atlas using the connection string!
