# Script to copy images from Quasar template to CRM frontend
# Run this from PowerShell in the crm-fe directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Copy Images from Quasar Template" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$quasarImagesPath = "c:\laragon\www\crm-nukleon\vue-quasar-company-profile-website\public\statics\images"
$crmImagesPath = "c:\laragon\www\crm-nukleon\crm-fe\public\statics\images"

# Check if source directory exists
if (-not (Test-Path $quasarImagesPath)) {
    Write-Host "❌ Error: Quasar images directory not found at:" -ForegroundColor Red
    Write-Host "   $quasarImagesPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please check if the vue-quasar-company-profile-website has images." -ForegroundColor Yellow
    exit 1
}

# Check if destination directory exists, create if not
if (-not (Test-Path $crmImagesPath)) {
    Write-Host "📁 Creating destination directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $crmImagesPath -Force | Out-Null
    Write-Host "✅ Directory created: $crmImagesPath" -ForegroundColor Green
}

# Copy images
Write-Host "📋 Copying images from Quasar template..." -ForegroundColor Yellow
Write-Host ""

try {
    # Get all files from source
    $files = Get-ChildItem -Path $quasarImagesPath -File
    
    if ($files.Count -eq 0) {
        Write-Host "⚠️  No images found in source directory" -ForegroundColor Yellow
        Write-Host "   You may need to download or add images manually" -ForegroundColor Yellow
    } else {
        $copiedCount = 0
        foreach ($file in $files) {
            Copy-Item -Path $file.FullName -Destination $crmImagesPath -Force
            Write-Host "  ✓ Copied: $($file.Name)" -ForegroundColor Green
            $copiedCount++
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "✅ Successfully copied $copiedCount image(s)!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error occurred while copying images:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📂 Images are now in: $crmImagesPath" -ForegroundColor Cyan
Write-Host ""

# List required images
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Required Images Checklist" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$requiredImages = @(
    "image_1.jpg", "image_2.jpg", "image_3.jpg",
    "1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg",
    "about_1.jpg", "about_2.jpg", "about_3.jpg",
    "team_1.jpg", "team_2.jpg", "team_3.jpg", "team_4.jpg",
    "parallax.jpg", "pricing.jpg", "contact_us.jpg"
)

$missingImages = @()
foreach ($img in $requiredImages) {
    $imagePath = Join-Path $crmImagesPath $img
    if (Test-Path $imagePath) {
        Write-Host "  ✓ $img" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $img (missing)" -ForegroundColor Red
        $missingImages += $img
    }
}

Write-Host ""

if ($missingImages.Count -gt 0) {
    Write-Host "⚠️  Missing $($missingImages.Count) image(s):" -ForegroundColor Yellow
    Write-Host "   Placeholder images will be used for missing files" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   You can:" -ForegroundColor Cyan
    Write-Host "   1. Add your own images to: $crmImagesPath" -ForegroundColor Cyan
    Write-Host "   2. Download stock images from free image sites" -ForegroundColor Cyan
    Write-Host "   3. Use the placeholder images (already handled in code)" -ForegroundColor Cyan
} else {
    Write-Host "🎉 All required images are present!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Run the development server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Open your browser to:" -ForegroundColor White
Write-Host "   http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. The landing page will load automatically!" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
