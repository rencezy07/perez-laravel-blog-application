#!/usr/bin/env bash
set -e

echo "========================================"
echo "Laravel Backend Build Script"
echo "========================================"

echo "1. Installing PHP dependencies..."
composer install --no-dev --no-interaction --prefer-dist

echo "2. Generating application key..."
php artisan key:generate --force

echo "3. Running database migrations..."
php artisan migrate --force

echo "4. Seeding database (optional - comment out if not needed)..."
# php artisan db:seed --force

echo "5. Caching configuration for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "6. Clearing old caches..."
php artisan cache:clear

echo "========================================"
echo "✓ Build completed successfully!"
echo "========================================"
