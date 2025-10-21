# Upload and run the force rebuild script
$server = "rnd@103.148.18.190"

Write-Host "🚨 UPLOADING FORCE REBUILD SCRIPT..." -ForegroundColor Red
Write-Host "=====================================" -ForegroundColor Red

try {
    # Upload the script
    Write-Host "📤 Uploading force-rebuild-vps.sh..." -ForegroundColor Blue
    scp force-rebuild-vps.sh "${server}:~/force_rebuild.sh"
    
    Write-Host "🚀 Running force rebuild on VPS..." -ForegroundColor Blue
    Write-Host "⚠️  This will take several minutes..." -ForegroundColor Yellow
    
    ssh $server "chmod +x ~/force_rebuild.sh && ~/force_rebuild.sh"
    
    Write-Host "🧹 Cleaning up..." -ForegroundColor Blue
    ssh $server "rm -f ~/force_rebuild.sh"
    
    Write-Host ""
    Write-Host "✅ FORCE REBUILD COMPLETE!" -ForegroundColor Green
    Write-Host "🌐 Test the website: http://rndpolije.lilly.net.id" -ForegroundColor Cyan
    Write-Host "🔍 Check browser console for NEW file names (not BPcKcO5K.js)" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try running manually:" -ForegroundColor Yellow
    Write-Host "ssh $server" -ForegroundColor Cyan
    Write-Host "cd /opt/crm-frontend" -ForegroundColor Cyan
    Write-Host "sudo systemctl stop crm-frontend" -ForegroundColor Cyan
    Write-Host "rm -rf .nuxt .output node_modules/.cache" -ForegroundColor Cyan
    Write-Host "yarn build" -ForegroundColor Cyan
    Write-Host "sudo systemctl start crm-frontend" -ForegroundColor Cyan
}
