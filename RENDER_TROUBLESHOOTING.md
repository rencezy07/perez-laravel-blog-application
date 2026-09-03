# Render Deployment Troubleshooting Guide

This guide covers common issues you might encounter when deploying to Render.

---

## 🔴 Critical Errors

### 1. "Application key not set" Error

**Error Message:**
```
RuntimeException: No application encryption key has been specified.
```

**Cause:** Missing or invalid `APP_KEY` environment variable.

**Solution:**

```bash
# Generate locally
php artisan key:generate --show

# Copy the output (starts with "base64:")
# Example: base64:AbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKl=
```

Steps:
1. In Render Dashboard → Your backend service
2. Go to **Environment** tab
3. Find or add `APP_KEY` variable
4. Paste the generated key
5. Click **"Save Changes"**
6. Go to **Settings** → **Restart Service**

---

### 2. "CORS error: No 'Access-Control-Allow-Origin' header"

**Error in Browser Console:**
```
Access to XMLHttpRequest at 'https://backend.onrender.com/api/auth/login' 
from origin 'https://frontend.onrender.com' has been blocked by CORS policy
```

**Cause:** Frontend URL not allowed in Laravel CORS configuration.

**Solution:**

**In `laravel-backend/config/cors.php`:**

```php
'allowed_origins' => [
    'https://your-react-frontend.onrender.com', // Add your actual frontend URL
    'http://localhost:5173', // for local development
],
```

Then:
1. Push changes to GitHub
2. Render will auto-deploy
3. Wait for deployment to complete
4. Restart the backend service

**Verify:** Check your frontend URL in Render Dashboard (it's on the service overview page)

---

### 3. "502 Bad Gateway" Error

**Shows:** Blank page or error message from Render

**Causes:**
- Service crashed during startup
- Database connection failure
- Build script error

**Debug Steps:**

1. Go to backend service → **Logs** tab
2. Look for error messages
3. Check last few lines for actual error

**Common Solutions:**

**a) Database Connection Error:**
```
SQLSTATE[08006]: Postgres connection failed
```
- Verify `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` environment variables
- Ensure PostgreSQL service is running
- Check if database exists: `DB_DATABASE`

**b) PHP Process Exited:**
```
Process exited with code 1
```
- Check full log output for actual error
- May need to manually run migrations

**c) Port Already in Use:**
```
Address already in use
```
- Restart the service in Render Dashboard

---

## 🟡 Common Issues

### 4. Database Migrations Not Running

**Problem:** Schema exists but migrations table doesn't.

**Solution:**

Access Render shell (if available):
```bash
php artisan migrate:fresh --seed
```

Or add to your build script:
```bash
php artisan migrate:refresh --seed --force
```

**Safer approach - create a migration repair command:**

```bash
# In laravel-backend/render-build.sh
php artisan migrate --force || php artisan migrate:fresh --force
```

---

### 5. Frontend Can't Connect to Backend API

**Problem:** Frontend loads but no API calls work.

**Symptoms:**
- Network tab shows requests failing
- Console shows CORS errors or "failed to fetch"
- Login button doesn't work

**Debug Checklist:**

1. **Verify API URL in environment:**
   ```bash
   # In React Frontend service environment variables
   VITE_API_URL=https://laravel-backend-xxxxx.onrender.com/api
   ```
   (Note: Replace `xxxxx` with your actual backend service ID)

2. **Check actual API URL being used:**
   - Open DevTools (F12)
   - Go to Network tab
   - Try to login
   - Click the failed request
   - Check "Request URL" - is it correct?

3. **Test API directly:**
   ```bash
   curl https://your-backend.onrender.com/api/auth/me
   # Should return 401 Unauthorized (no token) or 200 OK
   ```

4. **Verify backend is running:**
   ```bash
   curl -I https://your-backend.onrender.com
   # Should return HTTP 200 OK
   ```

5. **Check CORS configuration:**
   - Look at headers in Network tab
   - Should see `Access-Control-Allow-Origin: https://your-frontend.onrender.com`

---

### 6. Build Fails: "npm ERR! ...dependencies..."

**Error:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution:**

In `react-frontend/render-build.sh`, use legacy peer deps:

```bash
npm install --legacy-peer-deps
```

---

### 7. "Service keeps restarting" or "503 Service Unavailable"

**Cause:** Service crashing on startup.

**Debug:**

1. Check Logs tab in Render Dashboard
2. Look for PHP errors like:
   ```
   Parse error: syntax error, unexpected token
   Fatal error: Call to undefined function
   ```

3. If it's a recent change:
   ```bash
   git log --oneline -5
   git revert <commit-hash>
   git push
   ```

---

### 8. Database Storage Full

**Problem:**
```
ERROR: Disk quota exceeded
```

**Cause:** PostgreSQL database is full.

**Solutions:**

1. **Check database size:**
   - Render Dashboard → PostgreSQL service
   - Check "Used" storage in metrics

2. **Clean up data:**
   ```bash
   # Find large tables
   SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
   FROM pg_tables 
   WHERE schemaname='public' 
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

3. **Upgrade plan:**
   - Free: 1 GB
   - Starter: 10 GB
   - Professional: 100GB+
   - Upgrade in Render Dashboard

---

## 🟢 Performance Issues

### 9. "API calls are very slow"

**Possible Causes:**
- Free tier limitations
- Database queries not optimized
- Missing indexes

**Solutions:**

1. **Check query performance:**
   ```php
   // In Laravel controller
   DB::enableQueryLog();
   // ... your code ...
   dd(DB::getQueryLog());
   ```

2. **Add database indexes:**
   ```php
   // In migration
   Schema::table('posts', function (Blueprint $table) {
       $table->index('user_id');
       $table->index('category_id');
   });
   ```

3. **Enable Redis caching (paid):**
   - Create Redis service in Render
   - Update `CACHE_STORE` to `redis`
   - Set Redis connection variables

---

### 10. "Free tier keeps spinning down"

**Problem:** Application goes to sleep after 15 minutes of inactivity.

**Solutions:**

1. **Accept it:** Free tier is meant for testing
2. **Upgrade to Starter:** $7/month → always running
3. **Use UptimeRobot (free):**
   - Create account at uptimerobot.com
   - Add monitor for your backend URL
   - Ping every 10 minutes to keep awake

---

## 📝 Verification Steps

Run these after deployment to ensure everything works:

```bash
# 1. Backend is accessible
curl -I https://your-backend.onrender.com
# Expected: HTTP 200 OK

# 2. Frontend is accessible  
curl -I https://your-frontend.onrender.com
# Expected: HTTP 200 OK

# 3. API endpoint is working
curl https://your-backend.onrender.com/api/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'
# Expected: 201 Created or validation error (not 500)

# 4. Database is connected
# Check Logs tab - should not see "SQLSTATE" errors
```

---

## 🛠️ Emergency Fixes

### Clear Everything and Redeploy

1. **Clear caches:**
   ```bash
   cd laravel-backend
   php artisan cache:clear
   php artisan route:cache --forget
   php artisan view:cache --forget
   php artisan config:cache --forget
   git add . && git commit -m "Clear caches" && git push
   ```

2. **Restart services:**
   - Render Dashboard
   - Each service → Settings → Restart Service

3. **Check logs again:**
   - Wait 2-3 minutes
   - Look for errors

### Rollback to Previous Version

```bash
# See recent commits
git log --oneline -5

# Rollback
git revert <bad-commit-hash>
git push origin main

# Render will auto-deploy the rollback
```

---

## 📞 Getting Help

### Check These First

1. **Render Logs:** Most info is in service Logs tab
2. **Laravel Logs:** Check `laravel-backend/storage/logs/`
3. **Browser Console:** DevTools → Console tab
4. **Network Tab:** DevTools → Network tab during request

### Resources

- **Render Documentation:** https://render.com/docs
- **Laravel Documentation:** https://laravel.com/docs
- **Laravel Common Errors:** https://laravel.com/docs/errors
- **Sanctum Auth:** https://laravel.com/docs/sanctum

---

## Prevention Tips

✅ Always use `.env.example` for reference
✅ Test locally before pushing to GitHub
✅ Use meaningful commit messages
✅ Monitor Render logs regularly
✅ Keep dependencies updated
✅ Backup database regularly
✅ Use staging environment for testing

---

Last Updated: 2026-09-03
