@echo off
echo ==================================================
echo    Nuxt Cache Cleaner ^& Dev Server Restarter
echo ==================================================
echo.

REM Check if .nuxt directory exists
if exist ".nuxt" (
    echo [1/3] Removing .nuxt cache directory...
    rmdir /s /q ".nuxt"
    echo       [OK] Cache directory removed successfully
) else (
    echo [1/3] No .nuxt cache found (already clean)
)

echo.

REM Check if node_modules/.cache exists
if exist "node_modules\.cache" (
    echo [2/3] Removing node_modules cache...
    rmdir /s /q "node_modules\.cache"
    echo       [OK] Node modules cache removed successfully
) else (
    echo [2/3] No node_modules cache found
)

echo.

echo [3/3] Starting dev server...
echo.
echo ==================================================
echo    Dev server is starting...
echo    Press Ctrl+C to stop the server
echo ==================================================
echo.

REM Start the dev server
npm run dev
