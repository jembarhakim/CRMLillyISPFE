# Upload and run the complete fix script
$server = "rnd@103.148.18.190"

Write-Host "🔧 UPLOADING COMPLETE BUILD FIX..." -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

try {
    # Upload the script
    Write-Host "📤 Uploading fix-vps-build-complete.sh..." -ForegroundColor Blue
    scp fix-vps-build-complete.sh "${server}:~/complete_fix.sh"
    
    Write-Host "🚀 Running complete fix on VPS..." -ForegroundColor Blue
    Write-Host "⚠️  This will take several minutes..." -ForegroundColor Yellow
    
    ssh $server "chmod +x ~/complete_fix.sh && ~/complete_fix.sh"
    
    Write-Host "🧹 Cleaning up..." -ForegroundColor Blue
    ssh $server "rm -f ~/complete_fix.sh"
    
    Write-Host ""
    Write-Host "✅ COMPLETE FIX FINISHED!" -ForegroundColor Green
    Write-Host "🌐 Test the website: http://rndpolije.lilly.net.id" -ForegroundColor Cyan
    Write-Host "🔍 Check browser console for NEW file names (not BPcKcO5K.js)" -ForegroundColor Yellow
    Write-Host "📊 Should see no infinite loop errors" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try running manually:" -ForegroundColor Yellow
    Write-Host "ssh $server" -ForegroundColor Cyan
    Write-Host "cd /opt/crm-frontend" -ForegroundColor Cyan
    Write-Host "sudo systemctl stop crm-frontend" -ForegroundColor Cyan
    Write-Host "rm -rf .nuxt .output node_modules/.cache" -ForegroundColor Cyan
    Write-Host "git pull origin main" -ForegroundColor Cyan
    Write-Host "yarn remove @nuxt/icon" -ForegroundColor Cyan
    Write-Host "yarn add nuxt-echarts" -ForegroundColor Cyan
    Write-Host "yarn build" -ForegroundColor Cyan
    Write-Host "sudo systemctl start crm-frontend" -ForegroundColor Cyan
}
