@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo Installation Script
echo ======================================================

:: 1. อ่านค่าจากไฟล์ .env
if not exist ".env" (
    echo  ERROR: .env file not found. Please make sure it exists in this folder.
    pause
    exit /b
)

echo Reading configurations from .env...
for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
    set "key=%%a"
    set "value=%%b"
    if "!key!"=="DB_CONTAINER" set DB_CONTAINER=!value!
    if "!key!"=="DB_NAME" set DB_NAME=!value!
    if "!key!"=="DB_USER" set DB_USER=!value!
    if "!key!"=="DB_PASSWORD" set DB_PASS=!value!
)

:: ค่าเริ่มต้นกรณีใน .env ไม่มี (Safety Fallback)
if "%DB_CONTAINER%"=="" set DB_CONTAINER=work-measurement-db
if "%DB_NAME%"=="" set DB_NAME=work_measurement
if "%DB_USER%"=="" set DB_USER=root

:: 2. Load Images
:: ค้นหาไฟล์ .tar ในโฟลเดอร์ปัจจุบัน
echo.
if exist "project_images.tar" (
    echo [1/4]  Loading Image...
    docker load -i project_images.tar
)

:: 3. Start System
echo.
echo [2/4]  Starting Containers...
docker-compose up -d

echo.
echo  Waiting for Database to be ready (20s)...
timeout /t 20 /nobreak

:: 4. Database Structure (Migration)
echo.
echo [3/4]  Preparing Database Structure...
:: หารายชื่อ container ของ web (ที่รันจาก image work-measurement-web)
for /f "tokens=*" %%i in ('docker ps --filter "ancestor=work-measurement-web" --format "{{.Names}}"') do set WEB_CONTAINER=%%i

if not "%WEB_CONTAINER%"=="" (
    echo Running DB Upgrade in %WEB_CONTAINER%...
    docker exec -it %WEB_CONTAINER% ./factory_app db upgrade
) else (
    echo  Warning: Web container not found, skipping migration.
)

:: 5. Import Data
echo.
echo [4/4]  Importing Data from SQL...
if exist "database_dump.sql" (
    echo Importing database_dump.sql into %DB_CONTAINER%...
    type database_dump.sql | docker exec -i %DB_CONTAINER% mysql -u%DB_USER% -p%DB_PASS% %DB_NAME%
    echo  Database imported successfully!
) else (
    echo  No database_dump.sql found, skipping import.
)

echo.
echo ======================================================
echo  SUCCESS: System is ready!
echo  Access the app at: http://localhost
echo ======================================================
pause