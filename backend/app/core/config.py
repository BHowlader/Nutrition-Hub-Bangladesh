from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://nutrition_admin:nutrition_secret@localhost:5433/nutrition_hub"
    jwt_secret: str = "development-secret"
    admin_email: str = "admin@nutritionhubbangladesh.com"
    admin_password: str = "change-this-password"
    backend_cors_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
