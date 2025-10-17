# Deployment Guide

This guide covers deploying the Notes & Tasks application to production.

## Backend Deployment (Railway)

### Prerequisites
- Railway account (https://railway.app)
- MongoDB Atlas cluster (production)

### Steps

1. **Push code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "chore: prepare for deployment"
   git push origin main
   ```

2. **Create new Railway project**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `backend` directory as the root

3. **Set environment variables in Railway**
   ```
   MONGODB_URI=your_production_mongodb_uri
   JWT_SECRET=your_secure_jwt_secret
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   PORT=3000
   CORS_ORIGINS=https://your-app.netlify.app
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   AUTH_RATE_LIMIT_MAX_REQUESTS=5
   ```

4. **Generate JWT Secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

5. **Deploy**
   - Railway will automatically deploy
   - Note your Railway URL (e.g., `https://your-app.up.railway.app`)

### Railway Configuration Files

- `railway.json` - Railway-specific config (already created)
- Backend automatically uses PORT from environment

## Frontend Deployment (Netlify)

### Prerequisites
- Netlify account (https://netlify.com)
- Railway backend URL from above

### Steps

1. **Update API URL for production**
   - Edit `frontend/lib/core/config/app_config.dart`
   - Add environment-based URL selection (see below)

2. **Build Flutter web**
   ```bash
   cd frontend
   flutter build web --release
   ```

3. **Deploy to Netlify**

   **Option A: Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=frontend/build/web
   ```

   **Option B: Netlify Dashboard**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Deploy manually"
   - Drag and drop `frontend/build/web` folder

   **Option C: Connect to GitHub (Recommended)**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import from Git"
   - Choose your repository
   - Configure build settings:
     - Base directory: `frontend`
     - Build command: `flutter build web --release`
     - Publish directory: `frontend/build/web`

4. **Set environment variable in Netlify**
   - Go to Site settings → Environment variables
   - Add: `API_BASE_URL=https://your-app.up.railway.app/api`

5. **Update CORS in Railway**
   - Go back to Railway dashboard
   - Update `CORS_ORIGINS` environment variable with your Netlify URL
   - Example: `https://your-app.netlify.app`

### Netlify Configuration

The `netlify.toml` file (already created) handles:
- SPA routing (redirects all routes to index.html)
- Build settings
- Cache headers

## Post-Deployment

### Test the deployment

1. **Test backend**
   ```bash
   curl https://your-app.up.railway.app/health
   ```

2. **Test frontend**
   - Visit your Netlify URL
   - Register a new account
   - Create notes and tasks

### Update MongoDB Atlas

Make sure your MongoDB Atlas cluster allows connections from:
- Railway IP addresses (or use `0.0.0.0/0` for all IPs)
- Your development IP (for local testing)

Go to MongoDB Atlas → Network Access → Add IP Address

## Environment Variables Reference

### Backend (Railway)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret key for JWT tokens | Generated 64-char hex string |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3000` (Railway sets automatically) |
| `CORS_ORIGINS` | Allowed origins | `https://your-app.netlify.app` |

### Frontend (Netlify)

| Variable | Description | Example |
|----------|-------------|---------|
| `API_BASE_URL` | Backend API URL | `https://your-app.up.railway.app/api` |

## Troubleshooting

### Backend Issues

**"MongoDB connection failed"**
- Check MongoDB Atlas IP whitelist
- Verify MONGODB_URI is correct
- Check Railway logs: `railway logs`

**"CORS errors"**
- Verify CORS_ORIGINS matches your Netlify URL exactly
- Include the protocol (https://)
- Redeploy after changing environment variables

### Frontend Issues

**"Network error"**
- Check API_BASE_URL is set correctly
- Verify backend is running (test `/health` endpoint)
- Check browser console for CORS errors

**"404 on refresh"**
- Netlify should handle this with redirects
- Verify `netlify.toml` is in the repository root

## Custom Domains (Optional)

### Backend (Railway)
- Go to Railway project settings
- Add custom domain
- Update DNS records as instructed
- Update CORS_ORIGINS in environment variables

### Frontend (Netlify)
- Go to Netlify site settings → Domain management
- Add custom domain
- Configure DNS records
- SSL certificate is automatic

## Monitoring

### Railway
- View logs: Railway dashboard → Deployments → Logs
- View metrics: Railway dashboard → Metrics

### Netlify
- View analytics: Netlify dashboard → Analytics
- View logs: Netlify dashboard → Deploys → Deploy log

## CI/CD

Both platforms support automatic deployments:

- **Railway**: Automatically deploys on push to main branch
- **Netlify**: Automatically builds and deploys on push to main branch

Configure branch deploy previews in respective dashboards.

## Costs

- **Railway**: Free tier includes $5/month credits
- **Netlify**: Free tier includes 100GB bandwidth/month
- **MongoDB Atlas**: Free M0 tier available

Both should be sufficient for development and small production apps.
