import secrets

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from sqlalchemy import bindparam, text
from starlette.middleware.base import BaseHTTPMiddleware

from app.api import admin, auth, cart, categories, orders, products, settings as settings_api
from app.core.config import settings
from app.core.database import Base, engine
from app.core.limiter import limiter
from app.core.seed import seed_if_empty
from app.models import audit, cart as cart_model, catalog, coupon, order, settings as settings_model, user  # noqa: F401

if settings.jwt_secret in {"", "development-secret", "local-development-secret", "change-me"} or len(settings.jwt_secret) < 32:
    raise RuntimeError(
        "JWT_SECRET is missing, default, or too short. Set a strong random JWT_SECRET (>=32 chars) in backend/.env"
    )

if settings.is_production:
    if not settings.cookie_secure:
        raise RuntimeError(
            "COOKIE_SECURE must be true in production. Auth cookies cannot be transmitted over plain HTTP."
        )
    insecure_origins = [
        o.strip() for o in settings.backend_cors_origins.split(",")
        if o.strip() and o.strip().startswith("http://") and "localhost" not in o
    ]
    if insecure_origins:
        raise RuntimeError(
            f"BACKEND_CORS_ORIGINS contains insecure http:// entries in production: {insecure_origins}"
        )
    if not settings.google_client_id:
        raise RuntimeError("GOOGLE_CLIENT_ID must be set in production for admin OAuth.")

app = FastAPI(title="Nutrition Hub Bangladesh API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


CSRF_COOKIE_NAME = "nhb_csrf"
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_TOKEN_LENGTH = 32  # bytes → 43-char base64url

# Bootstrap endpoints that must work before a CSRF cookie has been issued,
# OR that have their own out-of-band integrity guarantees (Google id_token,
# PKCE code+verifier, server-side login rate limit, plus the strict Origin check
# enforced on admin routes).
CSRF_EXEMPT_PATHS: set[str] = {
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/google",
    "/api/auth/google/exchange",
    "/api/auth/logout",
}


class CSRFMiddleware(BaseHTTPMiddleware):
    """Double-submit cookie pattern:
      * Server sets a non-httponly cookie (nhb_csrf) on every response if missing.
      * For unsafe methods on protected paths, the request must include the same value
        in an X-CSRF-Token header. Same-origin JS can read the cookie; cross-origin
        attackers cannot (Same-Origin Policy), so the header check defeats CSRF.
    """

    async def dispatch(self, request: Request, call_next):
        method = request.method.upper()
        path = request.url.path
        cookie_token = request.cookies.get(CSRF_COOKIE_NAME)

        needs_check = (
            method not in {"GET", "HEAD", "OPTIONS"}
            and path.startswith("/api/")
            and path not in CSRF_EXEMPT_PATHS
        )

        if needs_check:
            header_token = request.headers.get(CSRF_HEADER_NAME)
            if not cookie_token or not header_token or not secrets.compare_digest(cookie_token, header_token):
                return JSONResponse(
                    status_code=403,
                    content={"detail": "CSRF token missing or invalid"},
                )

        response = await call_next(request)

        # Mint a fresh CSRF token if the client doesn't have one yet. Same lifetime
        # semantics as the auth cookie. Non-httponly on purpose so the SPA can read it.
        if not cookie_token:
            new_token = secrets.token_urlsafe(CSRF_TOKEN_LENGTH)
            response.set_cookie(
                key=CSRF_COOKIE_NAME,
                value=new_token,
                max_age=7 * 24 * 60 * 60,
                httponly=False,
                secure=settings.cookie_secure,
                samesite="lax",
                domain=settings.cookie_domain,
                path="/",
            )
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """M6: defensive HTTP headers — clickjacking, MIME sniffing, referrer scope, HSTS in prod."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault(
            "Permissions-Policy",
            "geolocation=(), microphone=(), camera=(), payment=()",
        )
        response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        if settings.is_production:
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains",
            )
        return response


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(CSRFMiddleware)

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
        conn.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0")
        )
        conn.execute(text("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(64)"))
        conn.execute(text("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500)"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS badge VARCHAR(120)"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS detail VARCHAR(200)"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS accent VARCHAR(20)"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory VARCHAR(120)"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'customer'"))
        conn.execute(
            text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id VARCHAR(36) REFERENCES users(id)")
        )
        conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0"))
        conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0"))
        conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(40)"))
        conn.execute(text("UPDATE orders SET subtotal = total WHERE subtotal = 0 AND total > 0"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_orders_user_id ON orders (user_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_orders_coupon_code ON orders (coupon_code)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_coupons_code ON coupons (code)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_coupons_active_code ON coupons (active, code)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_products_created_at ON products (created_at)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_products_category_id ON products (category_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_products_status_created_at ON products (status, created_at DESC)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_products_category_status_created_at ON products (category_id, status, created_at DESC)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_categories_name ON categories (name)"))
        # Reconcile CMS privileges against OWNER_EMAIL and ADMIN_EMAIL on every boot.
        # OWNER_EMAIL receives owner, ADMIN_EMAIL receives admin. Anyone outside
        # those lists is demoted and their JWTs are revoked via token_version bump.
        if settings.privileged_emails:
            for email in settings.owner_emails:
                conn.execute(
                    text("UPDATE users SET is_admin = TRUE, role = 'owner' WHERE email = :email"),
                    {"email": email},
                )
            for email in settings.admin_emails:
                if email in settings.owner_emails:
                    continue
                conn.execute(
                    text("UPDATE users SET is_admin = TRUE, role = 'admin' WHERE email = :email"),
                    {"email": email},
                )
            conn.execute(
                text(
                    "UPDATE users "
                    "SET is_admin = FALSE, "
                    "    role = 'customer', "
                    "    token_version = token_version + 1 "
                    "WHERE email NOT IN :emails "
                    "  AND (is_admin = TRUE OR role IN ('editor', 'admin', 'owner'))"
                ).bindparams(bindparam("emails", expanding=True)),
                {"emails": list(settings.privileged_emails)},
            )
        else:
            # No admin list configured — strip everyone (refuse to allow any admin to exist).
            conn.execute(
                text(
                    "UPDATE users "
                    "SET is_admin = FALSE, "
                    "    role = 'customer', "
                    "    token_version = token_version + 1 "
                    "WHERE is_admin = TRUE OR role IN ('editor', 'admin', 'owner')"
                )
            )

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
