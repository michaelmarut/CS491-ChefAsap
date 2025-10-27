@echo off
echo Setting DB_TYPE environment variable...

REM Set for current user (permanent)
setx DB_TYPE "postgresql"

echo.
echo ✓ DB_TYPE has been set to 'postgresql'
echo.
echo This will take effect in NEW terminal windows.
echo Current terminal still uses old value.
echo.
echo Please close and reopen your terminal/VS Code to apply changes.
echo.

echo Setting Google Cloud environment variables...

REM Set for current user (permanent)
::setx GOOGLE_CLIENT_ID "YOUR_GOOGLE_CLIENT_ID"
::setx GOOGLE_CLIENT_SECRET "YOUR_GOOGLE_CLIENT_SECRET"

echo.
echo ✓ GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET have been set.
echo.
echo This will take effect in NEW terminal windows.
echo Current terminal still uses old value.
echo.
echo Please close and reopen your terminal/VS Code to apply changes.
echo.
pause
