#!/bin/bash

echo "🚨 FORCE REBUILD VPS - NUCLEAR OPTION"
echo "======================================"

# Stop the service
echo "⏹️ Stopping frontend service..."
sudo systemctl stop crm-frontend

# Remove ALL build artifacts
echo "🧹 Removing ALL build artifacts..."
cd /opt/crm-frontend
rm -rf .nuxt .output node_modules/.cache

# Clear any potential Nginx cache
echo "🧹 Clearing Nginx cache..."
sudo systemctl reload nginx

# Pull latest code
echo "📥 Pulling latest code..."
git stash
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Build with explicit environment variables
echo "🔨 Building with production environment..."
export NUXT_PUBLIC_API_HOST=http://rndpolije.lilly.net.id
export NUXT_PUBLIC_WA_HOST=http://rndpolije.lilly.net.id
export NODE_ENV=production

yarn build

# Check build files
echo "🔍 Checking new build files..."
ls -la .output/public/_nuxt/ | head -5

# Start the service
echo "▶️ Starting frontend service..."
sudo systemctl start crm-frontend

# Check service status
echo "📊 Service status:"
sudo systemctl status crm-frontend --no-pager -l

echo ""
echo "✅ Rebuild complete!"
echo "🌐 Test the website now: http://rndpolije.lilly.net.id"
