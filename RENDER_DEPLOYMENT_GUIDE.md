# Complete Guide: Deploying Laravel + React to Render

This guide will walk you through deploying your full-stack Laravel backend and React frontend application to Render.

---

## Table of Contents
1. [Pre-Deployment Setup](#pre-deployment-setup)
2. [Project Structure Preparation](#project-structure-preparation)
3. [Create Render Services](#create-render-services)
4. [Deploy Backend](#deploy-backend)
5. [Deploy Frontend](#deploy-frontend)
6. [Connect Frontend to Backend](#connect-frontend-to-backend)
7. [Verification & Troubleshooting](#verification--troubleshooting)

---

## Pre-Deployment Setup

### 1. Prepare Your Git Repository

First, ensure your entire project is in a Git repository:

```bash
cd c:\Users\lilir\OneDrive\Desktop\laravel-project
git init
git add .
git commit -m "Initial commit: Laravel backend + React frontend"
```

Push to GitHub (or GitLab):

```bash
git remote add origin https://github.com/YOUR_USERNAME/laravel-project.git
git branch -M main
git push -u origin main
```

**Note:** Render works best with GitHub repositories for automatic deployments.

### 2. Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub account

---

## Project Structure Preparation

### 1. Update Laravel Database Configuration

Your project uses SQLite by default, but Render recommends PostgreSQL. Update your `.env` file:

**In `laravel-backend/.env`:**

```env
# Change from SQLite to PostgreSQL
DB_CONNECTION=pgsql
DB_HOST=your-database-host (Render will provide this)
DB_PORT=5432
DB_DATABASE=your-database-name
DB_USERNAME=your-username
DB_PASSWORD=your-password

# Frontend URL for CORS
FRONTEND_URL=https://your-frontend-url.onrender.com

# Laravel specific
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:your-generated-key
LOG_CHANNEL=stack
```

### 2. Prepare Laravel for Production

**Update `laravel-backend/config/cors.php`:**

```php
'allowed_origins' => [
    'https://your-frontend-url.onrender.com',
    'http://localhost:5173', // for local development
],
```

**Update `laravel-backend/app/Providers/AppServiceProvider.php`:**

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
    }
}
```

### 3. Create Render Build Scripts

**Create `laravel-backend/render-build.sh`:**

```bash
#!/usr/bin/env bash
set -e

echo "Installing dependencies..."
composer install --no-dev --no-interaction --prefer-dist

echo "Generating application key..."
php artisan key:generate --force

echo "Running migrations..."
php artisan migrate --force

echo "Seeding database (optional)..."
# php artisan db:seed --force

echo "Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Build completed!"
```

Make it executable:
```bash
chmod +x laravel-backend/render-build.sh
```

**Create `react-frontend/render-build.sh`:**

```bash
#!/usr/bin/env bash
set -e

echo "Installing dependencies..."
npm install

echo "Building React app..."
npm run build

echo "React build completed!"
```

Make it executable:
```bash
chmod +x react-frontend/render-build.sh
```

### 4. Create render.yaml Configuration

This file automatically sets up your services on Render.

**Create `render.yaml` in the root directory:**

```yaml
services:
  - type: web
    name: laravel-backend
    env: php
    buildCommand: bash laravel-backend/render-build.sh
    startCommand: php artisan serve --host 0.0.0.0 --port $PORT
    root: laravel-backend
    envVars:
      - key: APP_ENV
        value: production
      - key: APP_DEBUG
        value: false
      - key: LOG_CHANNEL
        value: stack
      - key: DB_CONNECTION
        value: pgsql
      - key: CACHE_STORE
        value: database
      - key: SESSION_DRIVER
        value: database
      - key: QUEUE_CONNECTION
        value: database
      - key: DB_HOST
        fromDatabase:
          name: laravel-db
          property: host
      - key: DB_PORT
        fromDatabase:
          name: laravel-db
          property: port
      - key: DB_DATABASE
        fromDatabase:
          name: laravel-db
          property: database
      - key: DB_USERNAME
        fromDatabase:
          name: laravel-db
          property: user
      - key: DB_PASSWORD
        fromDatabase:
          name: laravel-db
          property: password
      - key: APP_KEY
        sync: false
      - key: FRONTEND_URL
        sync: false
    # Manual secrets (set these in Render dashboard):
    # - APP_KEY: base64:your-generated-key
    # - FRONTEND_URL: https://your-frontend.onrender.com

  - type: web
    name: react-frontend
    env: node
    buildCommand: bash react-frontend/render-build.sh
    startCommand: npm run preview -- --host 0.0.0.0
    root: react-frontend
    publicDir: dist
    envVars:
      - key: VITE_API_URL
        value: https://laravel-backend-your-name.onrender.com/api

  - type: pgsql
    name: laravel-db
    version: 14
    plan: free
```

---

## Create Render Services

### Step 1: Create Database Service

1. Go to [render.com](https://render.com/dashboard)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name:** `laravel-db`
   - **Database Name:** `laravel_production`
   - **User:** `laravel_user`
   - **Plan:** Free ($0) or Starter ($7)
4. Click **"Create Database"**
5. Note the connection details (you'll need them later)

### Step 2: Create Laravel Backend Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the `laravel-project` repository
4. Configure:
   - **Name:** `laravel-backend`
   - **Environment:** PHP
   - **Build Command:** `bash laravel-backend/render-build.sh`
   - **Start Command:** `cd laravel-backend && php artisan serve --host 0.0.0.0 --port $PORT`
   - **Plan:** Free ($0) or Starter ($7)

5. Click **"Advanced"** and add environment variables:

| Key | Value |
|-----|-------|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | `base64:YOUR_KEY_HERE` (see below) |
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | (from Database service) |
| `DB_PORT` | `5432` |
| `DB_DATABASE` | `laravel_production` |
| `DB_USERNAME` | `laravel_user` |
| `DB_PASSWORD` | (from Database service) |
| `FRONTEND_URL` | `https://react-frontend-your-name.onrender.com` |
| `LOG_CHANNEL` | `stack` |
| `CACHE_STORE` | `database` |
| `SESSION_DRIVER` | `database` |

6. **Generate APP_KEY locally:**
   ```bash
   cd laravel-backend
   php artisan key:generate --show
   ```
   Copy the output and paste in the `APP_KEY` environment variable.

7. Click **"Create Web Service"**
8. Wait for deployment (5-10 minutes)

### Step 3: Create React Frontend Service

1. Click **"New +"** → **"Web Service"**
2. Select your GitHub repository
3. Configure:
   - **Name:** `react-frontend`
   - **Environment:** Node
   - **Build Command:** `cd react-frontend && npm install && npm run build`
   - **Start Command:** `cd react-frontend && npm run preview -- --host 0.0.0.0`
   - **Plan:** Free ($0)

4. Add environment variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://laravel-backend-your-name.onrender.com/api` |

5. Click **"Create Web Service"**
6. Wait for deployment

---

## Deploy Backend

### 1. Update Render.yaml (Alternative Approach)

If using `render.yaml` for infrastructure-as-code:

```bash
git add render.yaml
git commit -m "Add Render deployment configuration"
git push origin main
```

Render will automatically detect and deploy.

### 2. Manual Deployment

If you created services manually:

1. Go to your Laravel backend service in Render dashboard
2. Each time you push to `main` branch, it will auto-deploy
3. Monitor deployment logs in **Logs** tab
4. Check for any build or runtime errors

### 3. Verify Backend Deployment

```bash
# Check if API is working
curl https://laravel-backend-your-name.onrender.com/api/health

# Register a test user
curl -X POST https://laravel-backend-your-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## Deploy Frontend

### 1. Update API Endpoint

**In `react-frontend/src/` (or wherever you initialize Axios):**

```javascript
// Create a file: react-frontend/src/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for Sanctum auth
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### 2. Update React Components

**Example: Login component using the API:**

```javascript
// react-frontend/src/pages/Login.jsx
import { useState } from 'react';
import apiClient from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });
      
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
```

### 3. Verify Frontend Deployment

1. Visit `https://react-frontend-your-name.onrender.com`
2. Test login functionality
3. Verify API calls are working (check browser DevTools → Network tab)

---

## Connect Frontend to Backend

### 1. Update CORS Settings

**Ensure `laravel-backend/config/cors.php` allows your frontend:**

```php
'allowed_origins' => [
    'https://react-frontend-your-name.onrender.com',
    'http://localhost:5173',
],

'allowed_methods' => ['*'],

'allowed_headers' => ['*'],

'exposed_headers' => ['Authorization'],

'supports_credentials' => true,
```

### 2. Update Environment Variables

In Render Dashboard:

**Laravel Backend Service:**
- Add: `FRONTEND_URL=https://react-frontend-your-name.onrender.com`

**React Frontend Service:**
- Add: `VITE_API_URL=https://laravel-backend-your-name.onrender.com/api`

### 3. Restart Services

1. Go to each service in Render dashboard
2. Click the **⋯** menu → **"Restart service"**
3. Wait for services to come back online

---

## Verification & Troubleshooting

### Health Checks

Test the complete flow:

```bash
# 1. Check backend is running
curl -I https://laravel-backend-your-name.onrender.com

# 2. Check frontend is running
curl -I https://react-frontend-your-name.onrender.com

# 3. Test API endpoint
curl https://laravel-backend-your-name.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Common Issues

#### 1. **"CORS error" when frontend calls backend**
- **Solution:** Check `laravel-backend/config/cors.php` includes the frontend URL
- Restart Laravel backend service

#### 2. **"502 Bad Gateway" errors**
- **Solution:** Check service logs in Render dashboard
- Common causes: Missing `APP_KEY`, database connection issues
- Restart the service

#### 3. **Database migrations not running**
- **Solution:** Ensure build script includes `php artisan migrate --force`
- Check database connection in environment variables
- Manually run migrations:
  ```bash
  # Access service shell in Render dashboard (if available)
  php artisan migrate:fresh --seed
  ```

#### 4. **Frontend shows blank page**
- **Solution:** Check browser console for errors
- Verify `VITE_API_URL` environment variable is set
- Check that frontend build was successful in logs

#### 5. **"Application key not set" error**
- **Solution:** Generate and set `APP_KEY` in environment variables
  ```bash
  php artisan key:generate --show
  ```

### Accessing Logs

1. Go to Render Dashboard
2. Click on the service (backend or frontend)
3. Click **"Logs"** tab
4. Monitor real-time logs for errors

### Database Access

If you need to access your PostgreSQL database directly:

1. Go to **PostgreSQL service** in Render dashboard
2. Click **"Connect"** button
3. Copy the connection string
4. Use `psql` or a database client to connect

---

## Additional Optimization Tips

### 1. Enable Redis for Caching (Optional)

For better performance, replace database cache with Redis:

1. Create Redis service in Render (paid plan required)
2. Update `.env`:
   ```env
   CACHE_STORE=redis
   REDIS_HOST=your-redis-host
   REDIS_PORT=6379
   REDIS_PASSWORD=your-redis-password
   ```

### 2. Use Environment-Specific Configuration

Create separate environment files for production:

```bash
# laravel-backend/.env.production
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=info
```

### 3. Set Up Monitoring & Alerts

1. In Render dashboard → **Alerts**
2. Set up notifications for:
   - Service crashes
   - High memory usage
   - Deployment failures

### 4. Backup Your Database

1. In Render dashboard → PostgreSQL service
2. Click **"Backups"** tab
3. Enable automated backups

---

## Final Deployment Checklist

- [ ] Git repository created and pushed to GitHub
- [ ] `.env` variables properly configured for production
- [ ] `APP_KEY` generated and set
- [ ] Database service created in Render
- [ ] Laravel backend service created and deployed
- [ ] React frontend service created and deployed
- [ ] `CORS` configuration updated with frontend URL
- [ ] Environment variables set for all services
- [ ] Database migrations ran successfully
- [ ] Frontend can reach backend API
- [ ] Login/registration flow tested
- [ ] Logs monitored for errors
- [ ] SSL/HTTPS verified
- [ ] Custom domain configured (optional)

---

## Next Steps

1. **Custom Domain** (optional):
   - Go to service settings → "Custom Domains"
   - Add your domain
   - Point DNS to Render

2. **Environment-Specific Deployments**:
   - Set up staging environment
   - Use GitHub branches for automated deployments

3. **CI/CD Pipeline**:
   - Add automated tests to GitHub Actions
   - Run tests before deployment

4. **Monitoring**:
   - Set up error tracking (Sentry)
   - Monitor API performance
   - Track database queries

---

## Support Resources

- **Render Docs:** https://render.com/docs
- **Laravel Deployment:** https://laravel.com/docs/deployment
- **React Deployment:** https://react.dev/learn/start-a-new-react-project
- **Troubleshooting:** Check service logs in Render dashboard

---

Good luck with your deployment! 🚀
