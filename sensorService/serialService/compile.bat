@echo off
title Nuitka Industrial Compiler Target-Flask (Updated Version)
cls
echo =======================================================================
echo                 NUITKA COMPILER FOR INDUSTRIAL AUTOMATION
echo =======================================================================
echo.

:: 📌 1. ตรวจสอบ Nuitka ในระบบ
where nuitka >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Nuitka is not installed in this Python environment.
    echo Please run: pip install -U nuitka pyserial flask flask-cors
    pause
    exit /b
)

:: 📌 2. ตั้งค่าตัวแปรชื่อไฟล์และโฟลเดอร์ปลายทาง
set TARGET_FILE=serialService.py
set OUTPUT_NAME=SerialGatewayService
set BIN_DIR=bin

echo [1/4] Cleaning up old build artifacts...
if exist %OUTPUT_NAME%.build rmdir /s /q %OUTPUT_NAME%.build
if exist %OUTPUT_NAME%.onefile-build rmdir /s /q %OUTPUT_NAME%.onefile-build
echo        Done.
echo.

:: 📌 3. สร้างโฟลเดอร์ bin รอไว้ (ถ้ายังไม่มี)
echo [2/4] Preparing target directories...
if not exist %BIN_DIR% (
    mkdir %BIN_DIR%
    echo 📁 Created \%BIN_DIR% folder.
) else (
    echo 📁 \%BIN_DIR% folder already exists.
)
echo.

echo [3/4] Compiling %TARGET_FILE% with Nuitka...
echo        (This process might take a few minutes. Please wait...)
echo.

:: 📌 4. สั่งคอมไพล์พร้อมเปิด Force-include โมดูล Serial และล้างแคช
nuitka ^
    --standalone ^
    --onefile ^
    --include-package=flask ^
    --include-package=flask_cors ^
    --include-package=werkzeug ^
    --include-package=click ^
    --include-package=itsdangerous ^
    --include-package=jinja2 ^
    --include-package=markupsafe ^
    --include-package=serial ^
    --output-dir=%BIN_DIR% ^
    --output-filename=%OUTPUT_NAME% ^
    --jobs=%NUMBER_OF_PROCESSORS% ^
    %TARGET_FILE%

if %errorlevel% neq 0 (
    echo.
    echo ❌ Compilation FAILED! Check error log above.
    pause
    exit /b
)

echo.
echo [4/4] Finalizing deployment package...

:: 📌 5. คัดลอก config.json ไปวางคู่กับ .exe ในโฟลเดอร์ bin
if exist config.json (
    copy /Y config.json %BIN_DIR%\config.json >nul
    echo ⚙️ Copied config.json to \%BIN_DIR% successfully.
) else (
    echo ⚠️ Warning: config.json not found in root folder. It will be auto-generated on first run.
)

echo.
echo =======================================================================
echo   COMPILE SUCCESS: Ready to deploy!
echo   Please check your deliverables inside the "\%BIN_DIR%" folder.
echo =======================================================================
pause