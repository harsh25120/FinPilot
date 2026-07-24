.PHONY: up down build logs migrate seed venv install test fmt-check shell psql

# --- Docker workflow ---

up:
	docker compose up -d

build:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f api

migrate:
	docker compose exec api alembic upgrade head

seed:
	docker compose exec api python -m scripts.seed_data

shell:
	docker compose exec api bash

psql:
	docker compose exec db psql -U $${POSTGRES_USER:-finpilot} -d $${POSTGRES_DB:-finpilot}

# --- Local (non-Docker) development ---
# These targets assume Postgres is reachable (either via `make up` for just the
# db service, or a locally installed Postgres) and run everything through a
# local virtualenv instead of inside the API container.

venv:
	python3 -m venv venv
	./venv/bin/pip install --upgrade pip
	./venv/bin/pip install -r requirements-dev.txt

install: venv

test:
	./venv/bin/pytest
