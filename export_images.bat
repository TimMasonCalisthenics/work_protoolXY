@echo off
setlocal enabledelayedexpansion

:: 1. ตั้งค่าชื่อและวันที่
set "datestr=%date:~10,4%%date:~7,2%%date:~4,2%"
set "DEPLOY_FOLDER=Deploy_%datestr%"
set "IMAGE_FILE=project_images.tar"

:: 2. อ่านค่าจากไฟล์ .env (ดึงเฉพาะค่าที่จำเป็น)
if not exist ".env" (
    echo ERROR: .env file not found.
    pause
    exit /b
)

echo  Reading configurations from .env...
for /f "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="DB_CONTAINER" set DB_CONTAINER=%%b
    if "%%a"=="DB_NAME" set DB_NAME=%%b
    if "%%a"=="DB_USER" set DB_USER=%%b
    if "%%a"=="DB_PASSWORD" set DB_PASS=%%b
)

:: ตรวจสอบว่าดึงค่ามาครบไหม (เอาไว้เช็กเผื่อสะกดชื่อตัวแปรใน .env ต่างกัน)
if "%DB_CONTAINER%"=="" set DB_CONTAINER=work-measurement-db
if "%DB_NAME%"=="" set DB_NAME=work_measurement

echo  Creating deployment folder: %DEPLOY_FOLDER%...
if not exist "%DEPLOY_FOLDER%" mkdir "%DEPLOY_FOLDER%"

:: 3. Backup Database เป็นไฟล์ SQL
echo  Exporting Database: %DB_NAME% from %DB_CONTAINER%...
docker ps --filter "name=%DB_CONTAINER%" --format "{{.Names}}" > nul
if %ERRORLEVEL%==0 (
    :: ใช้ -i เพื่อให้ข้อมูลไหลออกสมบูรณ์ และตัดช่องว่างหลัง -p
    docker exec -i %DB_CONTAINER% mysqldump -u%DB_USER% -p%DB_PASS% --databases %DB_NAME% > "%DEPLOY_FOLDER%\database_dump.sql"
    
    :: เช็กว่าไฟล์ที่ได้ว่างเปล่าหรือไม่
    for %%A in ("%DEPLOY_FOLDER%\database_dump.sql") do (
        if %%~zA LSS 100 (
            echo  WARNING: Database dump file is very small or empty. Check your credentials.
        ) else (
            echo  Database exported successfully.
        )
    )
) else (
    echo  ERROR: Container %DB_CONTAINER% is NOT running.
    pause
    exit /b
)

:: 4. ดึง Image IDs และ Export (ทำไฟล์ Tar)
echo  Scanning and Exporting Docker Images...
set "image_list="

:: ใช้ docker-compose config --images เพื่อดึงชื่อที่ถูกต้อง
for /f "tokens=*" %%i in ('docker-compose config --images') do (
    set "image_list=!image_list! %%i"
)

:: ตรวจสอบว่ามี mysql:8.0 หรือยัง (ใช้ !image_list! แทน %)
echo !image_list! | findstr /C:"mysql:8.0" > nul
if errorlevel 1 (
    set "image_list=!image_list! mysql:8.0"
)

:: แสดงผล (ต้องใช้ ! เท่านั้น)
echo  Images to save: !image_list!

if "!image_list!"=="" (
    echo  Error: No images found.
    pause
    exit /b
)

echo  Saving images to %DEPLOY_FOLDER%\%IMAGE_FILE%...
docker save -o "%DEPLOY_FOLDER%\%IMAGE_FILE%" %image_list%

:: 5. ก๊อปปี้ไฟล์โครงสร้างที่จำเป็น
echo  Copying configuration files...
copy "docker-compose.production.yml" "%DEPLOY_FOLDER%\docker-compose.yml" > nul
copy ".env" "%DEPLOY_FOLDER%\" > nul
if exist "manage.bat" copy "manage.bat" "%DEPLOY_FOLDER%\" > nul
if exist "install-project.bat" copy "install-project.bat" "%DEPLOY_FOLDER%\" > nul

:: 6. ก๊อปปี้โฟลเดอร์เสริม (Migrations, Storage)
echo  Copying database migrations and storage...
if exist "backend\migrations" xcopy /E /I /Y "backend\migrations" "%DEPLOY_FOLDER%\backend\migrations" > nul
if exist "storage" xcopy /E /I /Y "storage" "%DEPLOY_FOLDER%\storage" > nul

echo.
echo ======================================================
echo  DONE: Deployment package is ready in: %DEPLOY_FOLDER%
echo  Next step: Copy the folder to the client machine.
echo ======================================================
echo.
pause