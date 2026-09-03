# Quick Start Checklist for Render Deployment

## Pre-Deployment (Local Setup)

- [ ] Clone/update project from GitHub
- [ ] Run `php artisan key:generate --show` and save the APP_KEY
- [ ] Update `.env.production` with your details
- [ ] Test locally: `php artisan serve` and `npm run dev`
- [ ] Commit all changes: `git add . && git commit -m "Prepare for Render deployment"`
- [ ] Push to GitHub: `git push origin main`

## Render Dashboard Setup

### Step 1: Create PostgreSQL Database
- [ ] Go to https://render.com/dashboard
- [ ] Click "New +" → "PostgreSQL"
- [ ] Name: `laravel-db`
- [ ] Database: `laravel_production`
- [ ] User: `laravel_user`
- [ ] Plan: Free ($0)
- [ ] Copy connection details (host, user, password, database)

### Step 2: Create Laravel Backend Service
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Name: `laravel-backend`
- [ ] Environment: PHP
- [ ] Build Command: `bash laravel-backend/render-build.sh`
- [ ] Start Command: `cd laravel-backend && php -S 0.0.0.0:$PORT public/index.php`
- [ ] Plan: Free ($0)
- [ ] Set Environment Variables:
  - [ ] `APP_ENV` = `production`
  - [ ] `APP_DEBUG` = `false`
  - [ ] `APP_KEY` = (from local generation)
  - [ ] `DB_CONNECTION` = `pgsql`
  - [ ] `DB_HOST` = (from database service)
  - [ ] `DB_PORT` = `5432`
  - [ ] `DB_DATABASE` = `laravel_production`
  - [ ] `DB_USERNAME` = (from database service)
  - [ ] `DB_PASSWORD` = (from database service)
  - [ ] `FRONTEND_URL` = (will update later)
  - [ ] `LOG_CHANNEL` = `stack`
  - [ ] `CACHE_STORE` = `database`
  - [ ] `SESSION_DRIVER` = `database`
- [ ] Click "Create Web Service"
- [ ] Wait 5-10 minutes for deployment
- [ ] Check Logs tab for any errors

### Step 3: Create React Frontend Service
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Name: `react-frontend`
- [ ] Environment: Node
- [ ] Build Command: `bash react-frontend/render-build.sh`
- [ ] Start Command: `cd react-frontend && npm run preview -- --host 0.0.0.0`
- [ ] Plan: Free ($0)
- [ ] Set Environment Variables:
  - [ ] `VITE_API_URL` = `https://laravel-backend-xxxx.onrender.com/api`
- [ ] Click "Create Web Service"
- [ ] Wait 5-10 minutes for deployment

### Step 4: Update CORS & Frontend URL
- [ ] Note your frontend URL from Render (e.g., https://react-frontend-xxxx.onrender.com)
- [ ] Go to Laravel Backend service
- [ ] Update environment variable: `FRONTEND_URL` = your frontend URL
- [ ] Restart backend service
- [ ] Test API from frontend

## Verification Tests

### Backend API Tests
```bash
# Check if backend is running
curl https://your-backend.onrender.com

# Test registration
curl -X POST https://your-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Test login
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Frontend Tests
- [ ] Visit https://react-frontend-xxxx.onrender.com
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab for errors
- [ ] Check Network tab for API calls
- [ ] Test login functionality
- [ ] Test creating/viewing posts
- [ ] Test user profile access

## Monitoring & Maintenance

- [ ] Set up email alerts in Render Dashboard
- [ ] Monitor service logs weekly
- [ ] Check database storage usage
- [ ] Set up automated backups for database
- [ ] Plan for scaling if free tier runs out

## Troubleshooting

If services fail to deploy:
1. [ ] Check Logs tab in Render Dashboard
2. [ ] Look for error messages
3. [ ] Common issues:
   - [ ] Missing APP_KEY → Run locally and copy
   - [ ] DB connection error → Verify DB credentials
   - [ ] Build failure → Check build script syntax
   - [ ] CORS errors → Update allowed origins in Laravel

If frontend can't reach backend:
1. [ ] Check `VITE_API_URL` environment variable
2. [ ] Verify CORS is enabled in Laravel
3. [ ] Restart both services
4. [ ] Check browser Network tab for actual URL being called

## Optional Enhancements

- [ ] Set up custom domain
- [ ] Enable automatic deployments on GitHub push
- [ ] Add error tracking (Sentry)
- [ ] Set up Redis for better caching
- [ ] Configure email service (SendGrid, Mailgun)
- [ ] Add SSL certificate (automatic with Render)

## Useful Links

- Deployment Guide: See `RENDER_DEPLOYMENT_GUIDE.md`
- Render Docs: https://render.com/docs
- Laravel Docs: https://laravel.com/docs
- React Docs: https://react.dev/docs
