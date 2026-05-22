from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = "development"  # development | staging | production
    database_url: str = "postgresql+psycopg://nutrition_admin:nutrition_secret@localhost:5433/nutrition_hub"
    jwt_secret: str = "development-secret"
    owner_email: str = "ritrahalder021@gmail.com"
    admin_email: str = "bibekhowlader8@gmail.com"
    google_client_id: str = ""
    google_client_secret: str = ""  # required for PKCE code-flow exchange (admin login)
    backend_cors_origins: str = "http://localhost:3000"
    cookie_secure: bool = False  # set true in production (https only)
    cookie_domain: str | None = None  # e.g. ".nutritionhubbangladesh.com" in prod
    redis_url: str | None = None  # if set, rate limiter uses Redis (shared across workers)
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    # SMTP for transactional emails (password reset, etc.)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "nutritionhubbd001@gmail.com"
    smtp_from_name: str = "Nutrition Hub Bangladesh"
    frontend_url: str = "http://localhost:3000"

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def admin_emails(self) -> list[str]:
        if not self.admin_email:
            return []
        return [email.strip().lower() for email in self.admin_email.split(",") if email.strip()]

    @property
    def owner_emails(self) -> list[str]:
        if not self.owner_email:
            return []
        return [email.strip().lower() for email in self.owner_email.split(",") if email.strip()]

    @property
    def privileged_emails(self) -> list[str]:
        return sorted(set(self.owner_emails + self.admin_emails))

    def role_for_email(self, email: str) -> str:
        normalized = email.lower().strip()
        if normalized in self.owner_emails:
            return "owner"
        if normalized in self.admin_emails:
            return "admin"
        return "customer"


settings = Settings()
