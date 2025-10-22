@echo off
echo ========================================
echo ChefAsap Backend - Render Cloud Mode
echo ========================================
echo.

REM Set environment variable for this session
set DB_TYPE=postgresql

echo Configuration check:
python -c "from database.config import db_config, DB_TYPE; print(f'DB_TYPE: {DB_TYPE}'); print(f'Host: {db_config.get(\"host\")}')"

echo.
echo Starting Flask backend...
echo Backend will run on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

python app.py
