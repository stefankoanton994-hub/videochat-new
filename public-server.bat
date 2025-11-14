@echo off
echo ========================================
echo    🎥 MAKING SERVER PUBLIC
echo ========================================

echo Step 1: Please OPEN this URL in your browser:
echo https://www.duckdns.org/update?domains=videochat11&token=9bff130d-fe20-4646-8a64-b94cefb82738&ip=
echo.
echo Step 2: Press Enter AFTER you see "OK" in browser
pause

echo.
echo 🚀 Starting Public Video Chat Server...
echo 🌐 Local: http://localhost:5000
echo 🌐 Public: https://videochat11.duckdns.org
echo.

cd backend
node server.js