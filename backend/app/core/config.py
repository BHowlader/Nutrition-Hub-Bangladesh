from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://nutrition_admin:nutrition_secret@localhost:5433/nutrition_hub"
    jwt_secret: str = "development-secret"
    admin_email: str = "admin@nutritionhubbangladesh.com"
    google_client_id: str = ""
    backend_cors_origins: str = "http://localhost:3000"
    cookie_secure: bool = False  # set true in production (https only)
    cookie_domain: str | None = None  # e.g. ".nutritionhubbangladesh.com" in prod
    redis_url: str | None = None  # if set, rate limiter uses Redis (shared across workers)

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
