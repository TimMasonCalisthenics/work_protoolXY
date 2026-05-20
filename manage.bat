@echo off

set CONTAINER=work-measurement-web
set CONTAINERDEV=work-measurement-web-dev
set FLASK_CMD=python -m flask --app src.app
set APP_BIN=./factory_app



if "%1"=="build" (
    docker-compose build
)

if "%1"=="dev" (
    docker-compose --profile dev up --build -d
)
if "%1"=="prod" (
    docker-compose --profile prod up --build -d
)


if "%1"=="init" (
    docker exec -it %CONTAINER% %APP_BIN% db init
)

if "%1"=="migrateDev" (
    :: %~2 คือข้อความที่ตามหลังคำว่า migrate
    echo Running migrate with message: %~2
    docker exec -it %CONTAINERDEV% %FLASK_CMD% db migrate --message "%~2"
)
if "%1"=="migrate" (
    :: %~2 คือข้อความที่ตามหลังคำว่า migrate
    echo Running migrate with message: %~2
    docker exec -it %CONTAINER% %APP_BIN% db migrate --message "%~2"
)

if "%1"=="upgrade" (
    docker exec -it %CONTAINER% %APP_BIN% db upgrade
)
if "%1"=="upgradeDev" (
    docker exec -it %CONTAINERDEV% %FLASK_CMD% db upgrade
)

if "%1"=="seed" (
    docker exec -it %CONTAINER% %APP_BIN% seed-db
)

if "%1"=="seedDev" (
    docker exec -it %CONTAINERDEV% %FLASK_CMD% seed-db
)