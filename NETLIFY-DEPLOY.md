# Deploy to Specific Netlify Site

## Method 1: Link Your Site (Recommended)

### First Time Setup

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```
   This opens a browser to authenticate.

3. **Link to your site:**
   ```bash
   cd frontend
   netlify link
   ```
   
   Choose one of:
   - **Use existing site** → Select from your sites
   - **Create new site** → Follow prompts
   - **Enter site ID** → Paste your site ID

   This creates a `.netlify/state.json` file with your site info.

### Deploy

After linking once, just run:
```bash
cd frontend
netlify deploy --prod --dir=build/web
```

It will automatically deploy to your linked site!

---

## Method 2: Use Site ID Directly

### Get Your Site ID

1. Go to https://app.netlify.com
2. Select your site
3. Go to **Site settings** → **Site details**
4. Copy the **Site ID** (looks like: `abc123-xyz789`)

### Deploy with Site ID

```bash
cd frontend
netlify deploy --prod --dir=build/web --site=YOUR_SITE_ID
```

**Example:**
```bash
netlify deploy --prod --dir=build/web --site=notes-tasks-xyz123
```

---

## Method 3: Use Site Name

If you know your site's subdomain:

```bash
netlify deploy --prod --dir=build/web --site=your-site-name
```

**Example:**
```bash
netlify deploy --prod --dir=build/web --site=notes-tasks
```

---

## Method 4: Drag & Drop (One-time deploys)

1. Build your app first:
   ```bash
   .\deploy-frontend.ps1 https://your-backend-url.up.railway.app
   ```

2. Go to your specific site:
   - Visit https://app.netlify.com
   - Click on your site
   - Go to **Deploys** tab
   - Drag `frontend/build/web` folder to the deploy area

---

## Complete Workflow

### Initial Setup (Once)

```powershell
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Link to your site
cd frontend
netlify link
cd ..
```

### Deploy (Every time)

```powershell
# 1. Build with your Railway backend URL
.\deploy-frontend.ps1 https://your-backend-url.up.railway.app

# 2. Deploy
cd frontend
netlify deploy --prod --dir=build/web
cd ..
```

---

## Troubleshooting

### "No site ID found"

**Solution:** Link your site first:
```bash
cd frontend
netlify link
```

### "Unauthorized"

**Solution:** Login again:
```bash
netlify login
```

### "Site not found"

**Solution:** Check your site ID/name:
1. Go to https://app.netlify.com
2. Verify the site exists
3. Check the site ID in settings

### Deploy to wrong site

**Solution:** Unlink and relink:
```bash
cd frontend
netlify unlink
netlify link
```

---

## Configuration File

After linking, a `.netlify/state.json` file is created in `frontend/`:

```json
{
  "siteId": "your-site-id-here"
}
```

**Commit this file** to always deploy to the same site from any machine.

---

## CI/CD Alternative

For automatic deployments, connect your GitHub repo:

1. Go to https://app.netlify.com
2. Click **Add new site** → **Import from Git**
3. Choose your repository
4. Set build settings:
   - Base directory: `frontend`
   - Build command: *(leave empty - we build locally)*
   - Publish directory: `frontend/build/web`

Then commit your built files or use GitHub Actions to build and deploy.
