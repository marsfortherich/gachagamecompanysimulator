# Deployment Guide

This guide covers deploying Gacha Game Company Simulator to various hosting platforms.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Build Process](#build-process)
- [Deployment Targets](#deployment-targets)
  - [GitHub Pages](#github-pages)
  - [Netlify](#netlify)
  - [Vercel](#vercel)
  - [Generic Static Hosting](#generic-static-hosting)
- [Environment Configuration](#environment-configuration)
- [PWA Configuration](#pwa-configuration)
- [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying, ensure the following:

### Code Quality
- [ ] All tests pass: `npm run test:run`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No linting errors: `npm run lint`
- [ ] Build completes successfully: `npm run build`

### Configuration
- [ ] Environment variables are set correctly
- [ ] Base URL is configured for your deployment target
- [ ] Debug console is disabled for production
- [ ] Console logging is stripped in production

### Assets
- [ ] PWA icons are in place (`public/icons/`)
- [ ] Manifest.json is configured correctly
- [ ] Favicon is present

### Quick Validation
```bash
# Run all checks at once
npm run validate

# Build and test
npm run prepare:deploy
```

---

## Build Process

### Development Build
```bash
npm run dev
```
Starts a local development server with hot reload at `http://localhost:3000`.

### Production Build
```bash
npm run build
```
Creates an optimized production build in the `dist/` directory:
- Minified JavaScript and CSS
- Tree-shaken unused code
- Optimized asset loading
- PWA service worker generated

### Preview Production Build
```bash
npm run preview
```
Serves the production build locally for testing before deployment.

### Build Analysis
```bash
npm run build:analyze
```
Generates a bundle analysis report to identify large dependencies.

---

## Deployment Targets

### GitHub Pages

GitHub Pages is ideal for free hosting with a custom domain.

#### Automatic Deployment (Recommended)

1. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Source: GitHub Actions

2. **Push to main branch** - the workflow automatically builds and deploys:
   ```bash
   git push origin main
   ```

3. **Access your site** at:
   ```
   https://<username>.github.io/<repository-name>/
   ```

#### Manual Deployment

1. Set the base URL:
   ```bash
   # .env.production
   VITE_BASE_URL=/your-repo-name/
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy the `dist/` folder using `gh-pages` or manually.

#### Custom Domain

1. Add a `CNAME` file to `public/`:
   ```
   your-domain.com
   ```

2. Update base URL:
   ```bash
   VITE_BASE_URL=/
   ```

3. Configure DNS with your domain registrar.

---

### Netlify

Netlify provides automatic deployments, previews, and edge functions.

#### Automatic Deployment

1. **Connect Repository**:
   - Log in to [Netlify](https://netlify.com)
   - "Add new site" → "Import an existing project"
   - Select your GitHub repository

2. **Build Settings** (auto-detected from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Deploy** - Netlify automatically builds on every push.

#### Environment Variables

Set in Netlify Dashboard → Site settings → Environment variables:
- `VITE_BASE_URL`: `/`
- `VITE_DROP_CONSOLE`: `true`
- `VITE_ENABLE_ANALYTICS`: `true`

#### Deploy Previews

Every pull request gets a unique preview URL for testing.

#### Custom Domain

1. Go to Domain settings
2. Add custom domain
3. Configure DNS

---

### Vercel

Vercel offers zero-config deployments optimized for React.

#### Automatic Deployment

1. **Connect Repository**:
   - Log in to [Vercel](https://vercel.com)
   - "Import Project" → Select your repository

2. **Framework Detection** (auto from `vercel.json`):
   - Framework: Vite
   - Build command: `npm run build`
   - Output: `dist`

3. **Deploy** - Vercel builds automatically on every push.

#### Environment Variables

Set in Vercel Dashboard → Settings → Environment Variables.

#### Preview Deployments

Each branch and PR gets a unique preview URL.

---

### Generic Static Hosting

For other static hosting providers (AWS S3, Firebase Hosting, etc.):

1. **Build the project**:
   ```bash
   VITE_BASE_URL=/ npm run build
   ```

2. **Upload the `dist/` folder** to your hosting provider.

3. **Configure SPA routing** - redirect all routes to `index.html`:

   **Nginx**:
   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
   }
   ```

   **Apache (.htaccess)**:
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   ```

4. **Set cache headers**:
   - `/assets/*`: `Cache-Control: public, max-age=31536000, immutable`
   - `/sw.js`: `Cache-Control: no-cache, no-store, must-revalidate`
   - `/index.html`: `Cache-Control: no-cache`

---

## Environment Configuration

### Environment Files

| File | Purpose |
|------|---------|
| `.env` | Default values (committed) |
| `.env.local` | Local overrides (not committed) |
| `.env.development` | Development settings |
| `.env.production` | Production settings |

### Key Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_BASE_URL` | Base path for deployment | `/` |
| `VITE_SOURCEMAP` | Generate source maps | `false` |
| `VITE_DROP_CONSOLE` | Remove console.* calls | `true` in prod |
| `VITE_ENABLE_DEBUG_CONSOLE` | Enable debug console | `false` in prod |
| `VITE_ENABLE_ANALYTICS` | Enable analytics | `true` in prod |

### Platform-Specific Overrides

Each platform can override these in their dashboard:
- **Netlify**: Site settings → Environment variables
- **Vercel**: Settings → Environment Variables
- **GitHub Pages**: Repository secrets → Actions

---

## PWA Configuration

The game is PWA-ready for offline play and installation.

### Features

- **Offline Support**: Service worker caches assets
- **Installable**: Add to home screen on mobile/desktop
- **Background Sync**: Save data syncs when online

### Manifest Configuration

Edit `public/manifest.json`:

```json
{
  "name": "Gacha Game Company Simulator",
  "short_name": "GachaSim",
  "theme_color": "#6366f1",
  "background_color": "#1a1a2e"
}
```

### Icons

Place icons in `public/icons/`:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

### Testing PWA

1. Build and preview: `npm run build && npm run preview`
2. Open Chrome DevTools → Application → Service Workers
3. Test offline mode in Network tab

---

## Troubleshooting

### Build Failures

**TypeScript errors:**
```bash
npm run typecheck
# Fix errors shown
```

**Missing dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### 404 on Page Refresh

SPA routing not configured. Ensure redirects are set up for your host.

### Assets Not Loading

Check `VITE_BASE_URL` matches your deployment path:
- GitHub Pages: `/repository-name/`
- Custom domain: `/`

### Service Worker Issues

Force update:
1. Open DevTools → Application → Service Workers
2. Click "Update" or "Unregister"
3. Hard refresh (Ctrl+Shift+R)

### Large Bundle Size

Analyze the bundle:
```bash
npm run build:analyze
```

Consider:
- Lazy loading routes
- Dynamic imports for heavy components
- Removing unused dependencies

---

## Deployment Workflow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Local Development                         │
│  npm run dev → npm run test:run → npm run lint              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Pre-Deployment                            │
│  npm run validate → npm run build → npm run preview         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    git push origin main                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌────────┐   ┌────────┐   ┌────────┐
         │ GitHub │   │Netlify │   │ Vercel │
         │ Pages  │   │        │   │        │
         └────────┘   └────────┘   └────────┘
```
