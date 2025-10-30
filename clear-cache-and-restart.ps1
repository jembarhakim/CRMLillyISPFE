# Script to clear Nuxt cache and restart dev server
# Run this script if you're experiencing layout issues or cache problems

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Nuxt Cache Cleaner & Dev Server Restarter" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .nuxt directory exists
if (Test-Path ".nuxt") {
    Write-Host "[1/3] Removing .nuxt cache directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".nuxt"
    Write-Host "      ✓ Cache directory removed successfully" -ForegroundColor Green
} else {
    Write-Host "[1/3] No .nuxt cache found (already clean)" -ForegroundColor Gray
}

Write-Host ""

# Check if node_modules/.cache exists
if (Test-Path "node_modules\.cache") {
    Write-Host "[2/3] Removing node_modules cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "      ✓ Node modules cache removed successfully" -ForegroundColor Green
} else {
    Write-Host "[2/3] No node_modules cache found" -ForegroundColor Gray
}

Write-Host ""

Write-Host "[3/3] Starting dev server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Dev server is starting..." -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Start the dev server
npm run dev
