# Check VPS build files
$password = "rnd@123"
$server = "rnd@103.148.18.190"

Write-Host "🔍 CHECKING VPS BUILD FILES..." -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

# Create a temporary script to run on VPS
$remoteScript = @"
echo "📁 Build directory contents:"
ls -la /opt/crm-frontend/.output/public/_nuxt/ | head -10

echo ""
echo "🕐 Build timestamps:"
ls -lh /opt/crm-frontend/.output/server/index.mjs
ls -lh /opt/crm-frontend/.output/public/_nuxt/ | head -5

echo ""
echo "🔍 Looking for OLD build files (BPcKcO5K.js, DwKnmYSP.js):"
find /opt/crm-frontend/.output/public/_nuxt/ -name "*BPcKcO5K*" -o -name "*DwKnmYSP*" 2>/dev/null || echo "✅ No old build files found"

echo ""
echo "🔍 Current build files:"
ls /opt/crm-frontend/.output/public/_nuxt/ | grep -E "\.(js|css)$" | head -5

echo ""
echo "📊 Service status:"
sudo systemctl status crm-frontend --no-pager -l

echo ""
echo "🌐 Testing if backend is running:"
curl -s http://localhost:3001/api/health || echo "❌ Backend not responding on port 3001"
"@

# Save script to temp file
$tempScript = "temp_check.sh"
$remoteScript | Out-File -FilePath $tempScript -Encoding UTF8

try {
    # Upload and run the script
    Write-Host "📤 Uploading check script..." -ForegroundColor Blue
    scp $tempScript "${server}:~/check_build.sh"
    
    Write-Host "🚀 Running check on VPS..." -ForegroundColor Blue
    ssh $server "chmod +x ~/check_build.sh && ~/check_build.sh"
    
    Write-Host "🧹 Cleaning up..." -ForegroundColor Blue
    ssh $server "rm -f ~/check_build.sh"
    Remove-Item $tempScript -Force
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try running manually:" -ForegroundColor Yellow
    Write-Host "ssh $server" -ForegroundColor Cyan
    Write-Host "cd /opt/crm-frontend" -ForegroundColor Cyan
    Write-Host "ls -la .output/public/_nuxt/ | head -10" -ForegroundColor Cyan
}
