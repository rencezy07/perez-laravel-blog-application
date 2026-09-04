#!/bin/bash
set -euo pipefail

echo "Starting Laravel application..."

# Generate .env from .env.example if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
fi

# Generate an app key only when neither Render nor .env provides one
if [ -z "${APP_KEY:-}" ] && ! grep -qE '^APP_KEY=base64:.+' .env; then
    echo "Generating APP_KEY..."
    php artisan key:generate --force
fi

# Wait for database to be ready (retry logic)
echo "Waiting for database to be ready..."
echo "Database driver: ${DB_CONNECTION:-not set}"
echo "Database host: ${DB_HOST:-not set}"
echo "Database port: ${DB_PORT:-not set}"
echo "Database name: ${DB_DATABASE:-not set}"
echo "Database user: ${DB_USERNAME:-not set}"
for i in {1..30}; do
    echo "Database connection attempt $i/30..."
    if php artisan db:show > /dev/null 2>&1; then
        echo "✅ Database is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Database connection timeout. Last database error:"
        php artisan db:show || true
        exit 1
    fi
    sleep 2
done

# Run migrations with better error handling
echo "Running migrations..."
php artisan migrate --force
echo "✅ Migrations completed successfully"

# Seed demo data (users, roles, categories)
echo "Seeding demo data..."
php artisan db:seed --force
echo "✅ Database seeded successfully"

# Verify critical tables exist
echo "Verifying database tables..."
php artisan tinker --execute="echo 'Database connection verified';" || true

# Clear caches and cache routes/views
echo "Caching configuration..."
php artisan cache:clear || true
php artisan route:cache || true
php artisan view:cache || true
php artisan config:cache || true

echo "✅ Laravel application is ready!"
echo "API available at https://pere-laravel-blog-application-4.onrender.com/api"

# Start Apache
exec apache2-foreground
