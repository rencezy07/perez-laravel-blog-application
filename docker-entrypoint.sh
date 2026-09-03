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

# Wait a moment for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run migrations
echo "Running migrations..."
php artisan migrate --force || true

# Clear caches and cache routes/views
php artisan cache:clear || true
php artisan route:cache || true
php artisan view:cache || true
php artisan config:cache || true

echo "✅ Laravel application is ready!"

# Start Apache
exec apache2-foreground
