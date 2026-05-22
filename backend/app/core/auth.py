from datetime import datetime, timedelta, timezone

from fastapi import Cookie, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import AuthProvider, User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

ALGORITHM = "HS256"
CUSTOMER_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days for storefront customers
ADMIN_TOKEN_EXPIRE_HOURS = 4  # M5: short-lived sessions for admin accounts
AUTH_COOKIE_NAME = "nhb_session"
ADMIN_AUTH_COOKIE_NAME = "nhb_admin_session"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _token_expiry_hours_for(user: "User | None") -> int:
    if user is None:
        return CUSTOMER_TOKEN_EXPIRE_HOURS
    is_admin = user.is_admin or user.role in {UserRole.editor, UserRole.admin, UserRole.owner}
    return ADMIN_TOKEN_EXPIRE_HOURS if is_admin else CUSTOMER_TOKEN_EXPIRE_HOURS


def create_access_token(user_id: str, token_version: int = 0, *, hours: int | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=hours or CUSTOMER_TOKEN_EXPIRE_HOURS)
    return jwt.encode(
        {"sub": user_id, "ver": token_version, "exp": expire},
        settings.jwt_secret,
        algorithm=ALGORITHM,
    )


def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        if not payload.get("sub"):
            return None
        return payload
    except JWTError:
        return None


def set_auth_cookie(response: Response, token: str, *, max_age_seconds: int) -> None:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        max_age=max_age_seconds,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        domain=settings.cookie_domain,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        domain=settings.cookie_domain,
        path="/",
    )


def set_admin_auth_cookie(response: Response, token: str, *, max_age_seconds: int) -> None:
    """Set the admin-specific session cookie (independent of storefront session)."""
    response.set_cookie(
        key=ADMIN_AUTH_COOKIE_NAME,
        value=token,
        max_age=max_age_seconds,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        domain=settings.cookie_domain,
        path="/",
    )


def clear_admin_auth_cookie(response: Response) -> None:
    """Clear the admin-specific session cookie without touching the storefront session."""
    response.delete_cookie(
        key=ADMIN_AUTH_COOKIE_NAME,
        domain=settings.cookie_domain,
        path="/",
    )


def _resolve_token(
    creds: HTTPAuthorizationCredentials | None,
    cookie_token: str | None,
) -> str | None:
    if creds is not None:
        return creds.credentials
    return cookie_token


def _user_from_token(token: str, db: Session) -> User | None:
    payload = decode_access_token(token)
    if payload is None:
        return None
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if user is None:
        return None
    # M5: reject tokens issued before the current token_version (revoked sessions).
    if int(payload.get("ver", 0)) != int(user.token_version or 0):
        return None
    return user


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    cookie_token: str | None = Cookie(default=None, alias=AUTH_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> User:
    token = _resolve_token(creds, cookie_token)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user = _user_from_token(token, db)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    return user


def get_optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    cookie_token: str | None = Cookie(default=None, alias=AUTH_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> User | None:
    token = _resolve_token(creds, cookie_token)
    if not token:
        return None
    return _user_from_token(token, db)


def get_admin_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    admin_cookie_token: str | None = Cookie(default=None, alias=ADMIN_AUTH_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the admin session from the dedicated admin cookie.
    This is independent of the storefront `nhb_session` cookie."""
    token = _resolve_token(creds, admin_cookie_token)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin session required")
    user = _user_from_token(token, db)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired admin session")
    return user


def require_admin(user: User = Depends(get_admin_user)) -> User:
    if not user.is_admin and user.role not in {UserRole.editor, UserRole.admin, UserRole.owner}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def require_admin_google(user: User = Depends(require_admin)) -> User:
    """Enforce that admin users authenticated via Google OAuth only.
    Rejects admin access from email/password authenticated sessions."""
    if user.auth_provider != AuthProvider.google:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access requires Google authentication. Email/password login is not permitted for admin accounts.",
        )
    return user


def require_owner(user: User = Depends(get_admin_user)) -> User:
    if user.role != UserRole.owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner access required")
    return user


def require_trusted_admin_origin(request: Request) -> None:
    """CSRF defense-in-depth: every state-changing admin call must originate from a
    same-origin browser context. We require at least one of Origin or Referer to be
    present and match the configured allow-list. Missing both = reject."""
    allowed = {
        item.strip().rstrip("/")
        for item in settings.backend_cors_origins.split(",")
        if item.strip()
    }
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")

    if origin:
        if origin.rstrip("/") not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Untrusted admin origin")
        return

    if referer:
        # Match the scheme://host[:port] prefix of the referer against the allow-list.
        from urllib.parse import urlparse
        parsed = urlparse(referer)
        if not parsed.scheme or not parsed.netloc:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Malformed referer")
        referer_origin = f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
        if referer_origin not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Untrusted admin referer")
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Origin or Referer header required for admin actions",
    )
