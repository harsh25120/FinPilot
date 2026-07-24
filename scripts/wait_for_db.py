"""
Poll the configured database until it accepts connections, or exit with a
non-zero status after `max_retries` attempts. Used by the Docker entrypoint
so the API container doesn't crash-loop while Postgres is still starting up.
"""
import sys
import time

from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

from app.config import settings


def wait_for_db(max_retries: int = 30, delay_seconds: float = 2.0) -> None:
    engine = create_engine(settings.DATABASE_URL)
    for attempt in range(1, max_retries + 1):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            print("Database is ready.")
            return
        except OperationalError as exc:
            print(f"Database not ready (attempt {attempt}/{max_retries}): {exc}")
            time.sleep(delay_seconds)

    print("Could not connect to the database after multiple attempts. Exiting.")
    sys.exit(1)


if __name__ == "__main__":
    wait_for_db()
