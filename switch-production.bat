@echo off
echo Switching frontend to PRODUCTION (VPS) environment...
node switch-env.js production
echo.
echo ⚠️  WARNING: You are now in PRODUCTION mode!
echo.
echo Configuration:
echo   - API Host: http://api.rndpolije.lilly.net.id
echo   - WA Host: http://api.rndpolije.lilly.net.id
echo.
echo Deploy to VPS using:
echo   - Use deploy-to-vps.ps1 or deploy-to-vps.sh
echo   - Or manually: scp to VPS and rebuild
echo.
echo Build for production:
echo   - yarn build
pause







