@echo off
echo 🏛️ DIPLOMATIC LANGUAGE PLATFORM - TESTING SCRIPT
echo.
echo Testing Core Services...
echo.

echo 🔍 Testing Elasticsearch...
curl -s http://localhost:9200/_cluster/health
echo.
echo.

echo 📊 Testing if pgAdmin is accessible...
curl -s -I http://localhost:5050 | findstr "200 OK"
if %errorlevel%==0 (
    echo ✅ pgAdmin is running on http://localhost:5050
) else (
    echo ❌ pgAdmin not accessible
)
echo.

echo 🍃 Testing if MongoDB Admin is accessible...
curl -s -I http://localhost:8081 | findstr "200"
if %errorlevel%==0 (
    echo ✅ MongoDB Admin is running on http://localhost:8081
) else (
    echo ❌ MongoDB Admin not accessible
)
echo.

echo 🎯 TESTING COMPLETE!
echo.
echo Open these URLs in your browser:
echo   - pgAdmin: http://localhost:5050
echo   - MongoDB: http://localhost:8081
echo   - Redis: http://localhost:8082
echo.
pause