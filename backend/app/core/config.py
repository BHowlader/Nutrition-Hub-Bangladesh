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
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def admin_emails(self) -> list[str]:
        if not self.admin_email:
            return []
        return [email.strip().lower() for email in self.admin_email.split(",") if email.strip()]


settings = Settings()
