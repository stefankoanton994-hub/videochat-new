@echo off
cd /d C:\Users\shtef\OneDrive\Рабочий стол\videochat-new

echo Step 1: Updating DuckDNS...
curl "https://www.duckdns.org/update?domains=videochat11&token=9bff130d-fe20-4646-8a64-b94cefb82738&ip="

echo.
echo Step 2: Starting server...
cd backend
node server.js