include .env
DOCKER_EXEC = docker-compose exec web
FLASK_CMD = python -m flask --app src.app
NOW := $(shell powershell -Command "Get-Date -Format 'yyyyMMdd_HHmmss'")

ifeq ($(file),)
    TARGET_NAME = ./backup/backup_$(NOW).sql
else
    ifeq ($(findstring .sql,$(file)),)
        TARGET_NAME = $(file).sql
    else
        TARGET_NAME = $(file)
    endif
endif

.PHONY: up down build migrate upgrade init shell logs seed image load

up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose up -d --build

logs:
	docker-compose logs -f web

db-init:
	$(DOCKER_EXEC) $(FLASK_CMD) db init

migrate:
	$(DOCKER_EXEC) $(FLASK_CMD) db migrate -m "$(m)"

seed:
	$(DOCKER_EXEC) $(FLASK_CMD) seed-db

backup:
	@echo "Starting backup: $(TARGET_NAME)"
	docker exec -e MYSQL_PWD=$(DB_PASSWORD) $(DB_CONTAINER) \
		mysqldump -u $(DB_USER) $(DB_NAME) > $(TARGET_NAME) --no-tablespaces
 	@echo "Backup completed: $(TARGET_NAME)"
restore:
	@if "$(file)"=="" ( \
		echo Error: FILE is not set.
		exit 1 \
	)
	@if not exist "$(file)" ( \
		echo Error: File "$(file)" not found! && \
		exit 1 \
	)
	@echo Restoring database from "$(file)"...
	type "$(file)" | docker exec -i -e MYSQL_PWD=$(DB_PASSWORD) $(DB_CONTAINER) mysql -u $(DB_USER) $(DB_NAME)
	@echo Restore completed!

upgrade:
	$(DOCKER_EXEC) $(FLASK_CMD) db upgrade

downgrade:
	$(DOCKER_EXEC) $(FLASK_CMD) db downgrade

shell:
	$(DOCKER_EXEC) $(FLASK_CMD) shell

image:
	docker save -o my-app.tar work-measurement

load:
	docker load -i my-app.tar