from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from sqlalchemy import text

from app.api import admin, auth, cart, categories, orders, products, settings as settings_api
from app.core.config import settings
from app.core.database import Base, engine
from app.core.limiter import limiter
from app.core.seed import seed_if_empty
from app.models import audit, cart as cart_model, catalog, order, settings as settings_model, user  # noqa: F401

if settings.jwt_secret in {"", "development-secret", "local-development-secret", "change-me"} or len(settings.jwt_secret) < 32:
    raise RuntimeError(
        "JWT_SECRET is missing, default, or too short. Set a strong random JWT_SECRET (>=32 chars) in backend/.env"
    )

app = FastAPI(title="Nutrition Hub Bangladesh API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [origin.strip() for origin in settings.backend_cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        conn.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE")
        )
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS badge VARCHAR(120)"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS detail VARCHAR(200)"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS accent VARCHAR(20)"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory VARCHAR(120)"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'customer'"))
        conn.execute(
            text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id VARCHAR(36) REFERENCES users(id)")
        )
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_orders_user_id ON orders (user_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_products_created_at ON products (created_at)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_products_category_id ON products (category_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_products_status_created_at ON products (status, created_at DESC)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_products_category_status_created_at ON products (category_id, status, created_at DESC)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_categories_name ON categories (name)"))
        if settings.admin_emails:
            for email in settings.admin_emails:
                conn.execute(
                    text("UPDATE users SET is_admin = TRUE, role = 'owner' WHERE email = :email"),
                    {"email": email},
                )
        conn.execute(text("UPDATE users SET role = 'admin' WHERE is_admin = TRUE AND role = 'customer'"))

    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(products.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(cart.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(settings_api.router, prefix="/api")

import os
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")
# Trigger reload to load new env configs v3
