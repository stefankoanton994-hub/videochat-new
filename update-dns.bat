@echo off
echo ========================================
echo    Updating DuckDNS IP Address
echo ========================================
curl "https://www.duckdns.org/update?domains=videochat11&token=9bff130d-fe20-4646-8a64-b94cefb82738&ip="
echo.
echo ✅ DNS updated successfully!
echo 🌐 Your domain: https://videochat11.duckdns.org
echo.
pause