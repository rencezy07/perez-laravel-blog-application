#!/usr/bin/env bash
set -e

echo "========================================"
echo "React Frontend Build Script"
echo "========================================"

echo "1. Installing Node dependencies..."
npm install --legacy-peer-deps

echo "2. Building React application..."
npm run build

echo "3. Verifying build output..."
if [ -d "dist" ]; then
    echo "✓ Build directory created successfully"
    echo "Files in dist:"
    ls -la dist/ | head -10
else
    echo "✗ Error: dist directory not found!"
    exit 1
fi

echo "========================================"
echo "✓ React build completed successfully!"
echo "========================================"
