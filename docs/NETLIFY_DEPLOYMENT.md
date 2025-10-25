# Netlify Deployment Guide

This guide explains how to deploy the Notes & Tasks SvelteKit application to Netlify.

## Prerequisites

- A Netlify account (free tier works fine)
- GitHub repository connected to Netlify
- Backend API deployed and accessible (e.g., on Railway)

## Automatic Deployment Setup

### 1. Connect Repository to Netlify

1. Log in to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Choose your Git provider (GitHub, GitLab, etc.)
4. Select your repository
5. Netlify will auto-detect the `netlify.toml` configuration

### 2. Configure Environment Variables

In the Netlify dashboard, go to **Site settings** → **Environment variables** and add:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `VITE_API_BASE_URL` | `https://your-backend.railway.app/api` | Your backend API URL |
| `NODE_VERSION` | `20` | Node.js version (already in netlify.toml) |

**Important**: Replace `https://your-backend.railway.app/api` with your actual backend API URL.

### 3. Deploy

1. Click "Deploy site"
2. Netlify will:
   - Install dependencies
   - Run `npm run build` in the `frontend` directory
   - Deploy the `build` folder
   - Enable precompression (gzip/brotli)
   - Apply security headers
   - Configure SPA redirects

### 4. Verify Deployment

After deployment completes:

1. Visit your Netlify URL (e.g., `https://your-site.netlify.app`)
2. Test the following:
   - Registration and login
   - Creating notes and tasks
   - Navigation between pages
   - Offline functionality
   - Theme switching

## Configuration Details

### Build Settings

The `netlify.toml` file configures:

- **Base directory**: `frontend`
- **Publish directory**: `build`
- **Build command**: `npm run build`
- **Node version**: 20

### Precompression

The SvelteKit static adapter is configured with `precompress: true`, which generates:
- `.gz` files (gzip compression)
- `.br` files (brotli compression)

Netlify automatically serves these compressed files when supported by the browser.

### SPA Routing

The redirect rule in `netlify.toml` ensures all routes serve `index.html`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This enables client-side routing for SvelteKit.

### Security Headers

The following security headers are automatically applied:

- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Enables XSS filtering
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features
- **Content-Security-Policy**: Restricts resource loading

### Caching Strategy

- **Static assets** (`/assets/*`): Cached for 1 year (immutable)
- **Compressed files** (`*.br`, `*.gz`): Cached for 1 year
- **HTML files** (`index.html`): No caching (always fresh)
- **Service worker** (`sw.js`): No caching (if added in future)

## Custom Domain (Optional)

To use a custom domain:

1. Go to **Site settings** → **Domain management**
2. Click "Add custom domain"
3. Follow the instructions to configure DNS
4. Netlify will automatically provision an SSL certificate

## Continuous Deployment

Netlify automatically deploys when you push to your main branch:

1. Push changes to GitHub
2. Netlify detects the push
3. Runs the build process
4. Deploys if successful
5. Notifies you via email

### Deploy Previews

Netlify creates deploy previews for pull requests:

1. Create a pull request
2. Netlify builds and deploys a preview
3. Test the preview before merging
4. Merge to deploy to production

## Troubleshooting

### Build Fails

**Check build logs** in Netlify dashboard:
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility
- Check for TypeScript errors

### Environment Variables Not Working

- Ensure variables start with `VITE_` prefix
- Redeploy after adding/changing variables
- Check that variables are set in Netlify UI, not just `.env`

### 404 Errors on Refresh

- Verify the redirect rule in `netlify.toml`
- Ensure `fallback: 'index.html'` is set in `svelte.config.js`

### API Connection Issues

- Verify `VITE_API_BASE_URL` is correct
- Check CORS configuration on backend
- Ensure backend is deployed and accessible

### Slow Load Times

- Check bundle size with `npm run build`
- Verify precompression is enabled
- Use Lighthouse to identify issues
- Check Network tab in browser DevTools

## Performance Optimization

The deployment is optimized for performance:

- **Code splitting**: Automatic with SvelteKit
- **Lazy loading**: Route-based code splitting
- **Precompression**: Gzip and Brotli enabled
- **Caching**: Aggressive caching for static assets
- **CDN**: Netlify's global CDN
- **HTTP/2**: Enabled by default

## Monitoring

Monitor your deployment:

1. **Netlify Analytics**: Built-in analytics (paid feature)
2. **Browser DevTools**: Check Network and Performance tabs
3. **Lighthouse**: Run audits for performance, accessibility, SEO
4. **Error Tracking**: Consider adding Sentry or similar

## Rollback

To rollback to a previous deployment:

1. Go to **Deploys** in Netlify dashboard
2. Find the previous successful deploy
3. Click "Publish deploy"

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [SvelteKit Deployment Guide](https://kit.svelte.dev/docs/adapter-static)
- [Netlify Build Configuration](https://docs.netlify.com/configure-builds/file-based-configuration/)
