@echo off
echo ========================================
echo Hotel Management System - Rebuild
echo ========================================
echo.

echo Cleaning previous build...
if exist "dist" rmdir /s /q "dist"
if exist "hotel-management-system.zip" del "hotel-management-system.zip"

echo.
echo Installing dependencies...
call npm install

echo.
echo Building application and creating zip...
call npm run build:zip

echo.
echo ========================================
echo Rebuild completed!
echo ========================================
echo.
echo Check the 'dist' folder for executable files
echo Check the root folder for 'hotel-management-system.zip'
echo.
pause
