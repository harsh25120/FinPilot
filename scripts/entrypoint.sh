#!/bin/bash
set -e

echo "Waiting for database..."
python -m scripts.wait_for_db

echo "Running database migrations..."
alembic upgrade head

echo "Starting FinPilot API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
