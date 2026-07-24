from typing import List, Optional

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central application configuration.

    Values are read from environment variables and, if present, from a
    `.env` file in the project root. `SECRET_KEY` and `DATABASE_URL` are
    intentionally required (no default) so the application fails fast on
    misconfiguration instead of silently running with an insecure key.
    """

    PROJECT_NAME: str = "FinPilot"
    PROJECT_DESCRIPTION: str = (
        "A modern personal finance tracker API — track income, expenses, "
        "budgets, and financial goals."
    )
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str
    TEST_DATABASE_URL: Optional[str] = None

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Kept as a plain string (rather than List[str]) because pydantic-settings
    # attempts to JSON-decode any env var mapped to a complex/list type before
    # field validators run, which breaks a simple "*" or comma-separated value.
    # `cors_origins_list` below exposes the parsed, ready-to-use list instead.
    BACKEND_CORS_ORIGINS: str = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @computed_field  # type: ignore[misc]
    @property
    def cors_origins_list(self) -> List[str]:
        value = self.BACKEND_CORS_ORIGINS.strip()
        if value == "*":
            return ["*"]
        return [origin.strip() for origin in value.split(",") if origin.strip()]


settings = Settings()
