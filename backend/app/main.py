from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from sqlalchemy import text

from app.api import auth, cart, categories, orders, products
from app.core.config import settings
from app.core.database import Base, engine
from app.core.limiter import limiter
from app.models import cart as cart_model, catalog, order, user  # noqa: F401

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
        if settings.admin_email:
            conn.execute(
                text("UPDATE users SET is_admin = TRUE WHERE email = :email"),
                {"email": settings.admin_email.lower().strip()},
            )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(products.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(cart.router, prefix="/api")
app.include_router(auth.router, prefix="/api")

import os
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")
