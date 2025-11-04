# PowerShell script to fix npm install issues
# Fixes EPERM permission errors and network connectivity issues

Write-Host "=== Fixing npm install issues ===" -ForegroundColor Cyan

# Step 1: Kill processes that might be locking files
Write-Host "`n[1/5] Checking for processes that might lock node_modules..." -ForegroundColor Yellow

$processesToKill = @("node", "npm", "nuxt", "vite", "code", "Code")
$killed = $false

foreach ($procName in $processesToKill) {
    $processes = Get-Process -Name $procName -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "  Found $($processes.Count) $procName process(es), attempting to close..." -ForegroundColor Yellow
        foreach ($proc in $processes) {
            try {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                Write-Host "    Closed process: $($proc.Name) (PID: $($proc.Id))" -ForegroundColor Green
                $killed = $true
            } catch {
                Write-Host "    Could not close: $($proc.Name)" -ForegroundColor Red
            }
        }
    }
}

if ($killed) {
    Write-Host "  Waiting 3 seconds for processes to release files..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}

# Step 2: Clean npm cache
Write-Host "`n[2/5] Cleaning npm cache..." -ForegroundColor Yellow
try {
    npm cache clean --force
    Write-Host "  npm cache cleaned successfully" -ForegroundColor Green
} catch {
    Write-Host "  Warning: Could not clean npm cache" -ForegroundColor Red
}

# Step 3: Remove problematic directories
Write-Host "`n[3/5] Removing locked directories..." -ForegroundColor Yellow

$dirsToRemove = @(
    "node_modules\@nuxt\devtools",
    "node_modules\@nuxt",
    "node_modules\@redocly\openapi-core\src\rules"
)

foreach ($dir in $dirsToRemove) {
    $fullPath = Join-Path $PWD $dir
    if (Test-Path $fullPath) {
        try {
            Write-Host "  Attempting to remove: $dir" -ForegroundColor Yellow
            Remove-Item -Path $fullPath -Recurse -Force -ErrorAction Stop
            Write-Host "    Successfully removed: $dir" -ForegroundColor Green
        } catch {
            Write-Host "    Could not remove: $dir (might be locked by another process)" -ForegroundColor Red
            Write-Host "    Try closing VS Code, file explorer, or antivirus temporarily" -ForegroundColor Yellow
        }
    }
}

# Step 4: Configure npm for better network reliability
Write-Host "`n[4/5] Configuring npm for better network reliability..." -ForegroundColor Yellow

# Increase timeout
npm config set fetch-timeout 600000
npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 10000
npm config set fetch-retry-maxtimeout 60000

Write-Host "  npm timeouts configured" -ForegroundColor Green

# Step 5: Retry npm install
Write-Host "`n[5/5] Retrying npm install..." -ForegroundColor Yellow
Write-Host "  This may take several minutes..." -ForegroundColor Yellow

# Try with increased verbosity and retry logic
try {
    npm install --verbose --prefer-offline=false
    Write-Host "`n=== npm install completed successfully! ===" -ForegroundColor Green
} catch {
    Write-Host "`n=== npm install failed ===" -ForegroundColor Red
    Write-Host "Error details:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    Write-Host "`nTroubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Check your internet connection" -ForegroundColor White
    Write-Host "2. If behind a proxy, configure it with: npm config set proxy <proxy-url>" -ForegroundColor White
    Write-Host "3. Try using a different registry: npm config set registry https://registry.npmjs.org/" -ForegroundColor White
    Write-Host "4. Close VS Code and file explorer, then retry" -ForegroundColor White
    Write-Host "5. Try running as administrator" -ForegroundColor White
    Write-Host "6. Consider using: npm install --legacy-peer-deps" -ForegroundColor White
    
    exit 1
}

Write-Host "`n=== All done! ===" -ForegroundColor Cyan





