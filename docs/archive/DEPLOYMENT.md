# Deployment Guide: Anamnese-App to Netlify

## 📋 Overview

This document provides step-by-step instructions for deploying the Anamnese-App web version to Netlify.

**Security Note:** This deployment follows DSGVO/GDPR (Privacy by Design) and CRA (Cyber Resilience Act) requirements with secure defaults and no hardcoded secrets.

## 🎯 Prerequisites

- [x] Netlify account (free tier is sufficient)
- [x] GitHub repository access
- [x] Node.js >= 18.0.0 installed locally
- [x] npm >= 9.0.0 installed locally

## 🔧 Local Build Verification

Before deploying, verify the production build works locally:

```bash
# Install dependencies
npm install

# Run type-check
npm run type-check

# Run tests
npm test

# Build production web bundle
npm run web:build

# Verify build artifacts exist
ls -la web/dist/
```

Expected output in `web/dist/`:
- `bundle.js` - Main application bundle
- `index.html` - Entry HTML file
- `*.png` - Static assets (images)
- `bundle.js.LICENSE.txt` - License information

## 🚀 Deployment Methods

### Method 1: Continuous Deployment via GitHub (Recommended)

1. **Connect Repository to Netlify:**
   - Log in to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Select "Deploy with GitHub"
   - Authorize Netlify to access your GitHub account
   - Select the `DiggAiHH/Anamnese-App` repository

2. **Configure Build Settings:**
   - **Branch to deploy:** `main` (or your preferred branch)
   - **Build command:** `npm run web:build`
   - **Publish directory:** `web/dist`
   - **Build environment:**
     - `NODE_VERSION = 18`
     - `NPM_FLAGS = --legacy-peer-deps`

3. **Deploy:**
   - Click "Deploy site"
   - Netlify will automatically build and deploy
   - Wait for build to complete (~2-5 minutes)
   - Site will be available at `https://<random-name>.netlify.app`

4. **Optional: Configure Custom Domain:**
   - Go to "Domain settings"
   - Add your custom domain
   - Follow DNS configuration instructions

### Method 2: Manual Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build the app:**
   ```bash
   npm run web:build
   ```

3. **Login to Netlify:**
   ```bash
   netlify login
   ```

4. **Deploy:**
   ```bash
   # For draft/preview deploy
   netlify deploy --dir=web/dist

   # For production deploy
   netlify deploy --prod --dir=web/dist
   ```

5. **Follow CLI prompts:**
   - Create new site or link to existing
   - Select team
   - Choose site name (optional)

### Method 3: Drag & Drop Deploy

1. **Build the app locally:**
   ```bash
   npm run web:build
   ```

2. **Deploy via Netlify UI:**
   - Log in to [Netlify](https://app.netlify.com)
   - Drag and drop the `web/dist/` folder to the deployment area
   - Site will be deployed immediately

**Note:** This method is NOT recommended for production as it doesn't support continuous deployment.

## 🔒 Security Configuration

The `netlify.toml` file includes:

1. **Security Headers:**
   - `X-Content-Type-Options: nosniff` - Prevents MIME-type sniffing
   - `X-Frame-Options: DENY` - Prevents clickjacking
   - `X-XSS-Protection` - Enables browser XSS filter
   - `Content-Security-Policy` - Restricts resource loading (CRA compliant)
   - `Referrer-Policy` - Privacy protection for outbound links
   - `Permissions-Policy` - Restricts browser features (camera, mic, geolocation)

2. **Cache Headers:**
   - Static assets cached for 1 year (immutable)
   - HTML not cached (always fresh)

3. **SPA Routing:**
   - All routes redirect to `index.html` for React Router support

## 🧪 Post-Deployment Verification

After deployment, verify the following:

1. **Core Functionality:**
   - [ ] App loads at deployed URL
   - [ ] Language selection works (19 languages available)
   - [ ] Navigation between screens works
   - [ ] GDPR consent screen displays correctly
   - [ ] Patient info form works
   - [ ] Questionnaire loads and navigation works

2. **Security Headers:**
   ```bash
   curl -I https://your-site.netlify.app
   ```
   Verify all security headers are present.

3. **Console Check:**
   - Open browser DevTools (F12)
   - Check Console for errors
   - Verify no PII (Personal Identifiable Information) is logged

4. **Storage Check:**
   - Test local storage persistence
   - Note: SQLite and native features are NOT available on web (platform-specific)
   - Verify fallback mechanisms work correctly

## 🌍 Cross-Platform Notes

The web deployment has the following platform-specific behaviors:

- ✅ **Available:** Core questionnaire, GDPR consent, language selection, calculator, export (clipboard)
- ⚠️ **Limited:** Storage (LocalStorage instead of SQLite), encryption (WebCrypto instead of quick-crypto)
- ❌ **Unavailable:** Native features (STT/TTS voice, secure keychain, native file system, native share)

The app gracefully degrades and shows appropriate "Feature Unavailable" banners when native features are not supported.

## 📊 Build Logs & Evidence

All build logs are captured in `buildLogs/` directory:
- `web_build_production_<timestamp>.out.log` - Build output
- `web_build_production_<timestamp>.err.log` - Build errors (if any)

## 🆘 Troubleshooting

### Build Fails on Netlify

**Problem:** Build fails with "Cannot find module" or TypeScript errors

**Solution:**
1. Verify `package.json` and `package-lock.json` are committed
2. Check Node version matches requirement (>= 18.0.0)
3. Add `NPM_FLAGS = --legacy-peer-deps` in Netlify build settings

### App Shows White Screen

**Problem:** Deployed app shows blank white screen

**Solution:**
1. Check browser console for errors
2. Verify `publicPath: '/'` in `webpack.config.js`
3. Verify `[[redirects]]` configuration in `netlify.toml`
4. Check that `index.html` exists in `web/dist/`

### Assets Not Loading

**Problem:** Images or bundle.js not loading (404 errors)

**Solution:**
1. Verify publish directory is set to `web/dist`
2. Check that build command is `npm run web:build`
3. Verify webpack output path configuration

### Security Headers Missing

**Problem:** Security headers not present in HTTP response

**Solution:**
1. Verify `netlify.toml` is in repository root
2. Check Netlify deployment logs for configuration warnings
3. Use Netlify's "Rewrites and redirects" UI to verify rules

## 📚 Additional Resources

- [Netlify Documentation](https://docs.netlify.com)
- [React Native Web Documentation](https://necolas.github.io/react-native-web/)
- [GDPR Compliance Guide](https://gdpr.eu)
- [CRA Requirements](https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act)

## 🔄 Continuous Integration

For automated deployments on every commit:

1. **Netlify automatically deploys:**
   - On every push to main/production branch
   - On pull requests (creates preview deployments)

2. **Build Status Badge:**
   Add to README.md:
   ```markdown
   [![Netlify Status](https://api.netlify.com/api/v1/badges/<site-id>/deploy-status)](https://app.netlify.com/sites/<site-name>/deploys)
   ```

## 📝 Maintenance

### Updating the Deployment

```bash
# 1. Make changes to code
# 2. Verify locally
npm run type-check
npm test
npm run web:build

# 3. Commit and push
git add .
git commit -m "Update: <description>"
git push origin main

# 4. Netlify auto-deploys within 2-5 minutes
```

### Rollback

If deployment introduces issues:
1. Go to Netlify dashboard
2. Navigate to "Deploys"
3. Find last working deployment
4. Click "Publish deploy" to rollback

---

**Last Updated:** 2026-01-22  
**Version:** 1.0.0  
**Maintainer:** DevSecOps Team
