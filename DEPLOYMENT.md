# 🚀 Production Deployment Guide

## Overview

This guide walks you through deploying the Driver Tracker app to production with proper security and performance configurations.

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Firebase project created and configured
- [ ] EmailJS account set up (optional, for PIN recovery)
- [ ] Domain name registered (if using custom domain)
- [ ] SSL certificate ready (handled by hosting platforms)

### 2. Security Configuration
- [ ] Firestore security rules deployed
- [ ] Environment variables configured
- [ ] API keys secured and not in code
- [ ] .env files added to .gitignore

### 3. Code Quality
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] ESLint warnings resolved
- [ ] Production build tested locally

## 🔧 Firebase Configuration

### 1. Create Firebase Project

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init
```

### 2. Configure Firestore

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes (if any)
firebase deploy --only firestore:indexes
```

### 3. Set up Firebase Hosting (Optional)

```bash
# Configure Firebase Hosting
firebase init hosting

# Build and deploy
npm run build
firebase deploy --only hosting
```

## 🌐 Deployment Platforms

### Option 1: Netlify (Recommended)

#### Step 1: Connect Repository
1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Select the main branch

#### Step 2: Build Configuration
```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://api.emailjs.com;"
```

#### Step 3: Environment Variables
In Netlify dashboard, go to Site settings > Environment variables:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### Option 2: Vercel

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Deploy
```bash
# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

#### Step 3: Configure Environment Variables
```bash
# Add environment variables
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
# ... add all other variables
```

#### Step 4: Vercel Configuration
```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Option 3: GitHub Pages

#### Step 1: Build Configuration
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      env:
        VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
        VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
        VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
        VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
        VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
        VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
        VITE_FIREBASE_MEASUREMENT_ID: ${{ secrets.VITE_FIREBASE_MEASUREMENT_ID }}
        VITE_EMAILJS_SERVICE_ID: ${{ secrets.VITE_EMAILJS_SERVICE_ID }}
        VITE_EMAILJS_TEMPLATE_ID: ${{ secrets.VITE_EMAILJS_TEMPLATE_ID }}
        VITE_EMAILJS_PUBLIC_KEY: ${{ secrets.VITE_EMAILJS_PUBLIC_KEY }}
        
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## 📧 EmailJS Setup (Optional)

### 1. Create EmailJS Account
1. Go to [EmailJS](https://www.emailjs.com/)
2. Sign up for a free account
3. Create an email service (Gmail, Outlook, etc.)

### 2. Create Email Template
Create a template with these variables:
- `{{to_email}}` - Recipient email
- `{{recovery_code}}` - 8-digit recovery code
- `{{app_name}}` - Application name
- `{{valid_for}}` - Code validity period

### 3. Configure Domain Restrictions
In EmailJS dashboard:
1. Go to Account > Security
2. Add your domain to allowed origins
3. Enable domain restrictions

## 🔍 Testing Production Build

### Local Testing
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Test PWA functionality
# Open Chrome DevTools > Application > Service Workers
```

### Performance Testing
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run Lighthouse audit
lighthouse https://your-domain.com --output html --output-path ./lighthouse-report.html
```

## 📊 Monitoring & Analytics

### 1. Firebase Analytics
Already configured in the app. Monitor:
- User engagement
- Feature usage
- Error rates

### 2. Performance Monitoring
```javascript
// Add to main.tsx if needed
import { getPerformance } from 'firebase/performance';

if (import.meta.env.PROD) {
  const perf = getPerformance(app);
}
```

### 3. Error Tracking
Consider adding Sentry or similar:
```bash
npm install @sentry/react @sentry/tracing
```

## 🔄 CI/CD Pipeline

### Automated Deployment
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run lint
    - run: npm run build
    
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v1.2
      with:
        publish-dir: './dist'
        production-branch: main
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 🚨 Post-Deployment Checklist

### Immediate Testing
- [ ] App loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Data sync to Firestore works
- [ ] Offline functionality works
- [ ] PWA installation works
- [ ] PIN protection works (if enabled)
- [ ] Email recovery works (if configured)

### Performance Verification
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Service Worker caching works

### Security Verification
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] Firestore rules working
- [ ] No API keys exposed in client
- [ ] CSP headers configured

## 🔧 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Environment Variables Not Working
- Check variable names (must start with `VITE_`)
- Verify values are set in hosting platform
- Restart build after adding variables

#### Firestore Permission Denied
- Check security rules are deployed
- Verify user authentication
- Check Firebase project configuration

#### PWA Not Installing
- Verify HTTPS is enabled
- Check service worker registration
- Ensure manifest.json is accessible

### Getting Help
- Check browser console for errors
- Review Firebase console logs
- Check hosting platform build logs
- Review network requests in DevTools

## 📞 Support

For deployment issues:
1. Check this documentation first
2. Review platform-specific documentation
3. Check GitHub issues
4. Create a new issue with deployment logs

---

**Last Updated**: December 2024
**Version**: 1.0