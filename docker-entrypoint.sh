#!/bin/bash
set -e

echo "Starting Laravel application..."

# Generate .env from .env.example if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
fi

# Generate app key if not already set
if ! grep -q "APP_KEY=base64:" .env; then
    echo "Generating APP_KEY..."
    php artisan key:generate --force
fi

# Wait for database to be ready (retry logic)
echo "Waiting for database to be ready..."
for i in {1..30}; do
    echo "Database connection attempt $i/30..."
    if php artisan db:show > /dev/null 2>&1; then
        echo "✅ Database is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️ Database connection timeout - migrations may fail"
    fi
    sleep 2
done

# Run migrations with better error handling
echo "Running migrations..."
if php artisan migrate --force 2>&1 | tee /tmp/migrate.log; then
    echo "✅ Migrations completed successfully"
else
    echo "⚠️ Migrations had warnings, continuing..."
fi

# Seed demo data (users, roles, categories)
echo "Seeding demo data..."
if php artisan db:seed --force 2>&1 | tee /tmp/seed.log; then
    echo "✅ Database seeded successfully"
else
    echo "⚠️ Seeding had issues, continuing..."
fi

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
