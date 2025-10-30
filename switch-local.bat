@echo off
echo Switching frontend to LOCAL development environment...
node switch-env.js local
echo.
echo ✅ You are now in LOCAL development mode!
echo.
echo Configuration:
echo   - API Host: http://localhost:3001
echo   - WA Host: http://localhost:3001
echo   - SSR: DISABLED (to fix hasOwnProperty error)
echo.
echo Start development server:
echo   - npm run dev
echo.
pause