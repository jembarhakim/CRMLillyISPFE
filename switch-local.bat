@echo off
echo Switching frontend to LOCAL environment...
node switch-env.js local
echo.
echo ✅ Environment switched to LOCAL!
echo.
echo Configuration:
echo   - API Host: http://localhost:3001
echo   - WA Host: http://localhost:3001
echo.
echo You can now start the frontend with:
echo   - npm run dev
echo   - or: yarn dev
pause






