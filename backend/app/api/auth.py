import os
from urllib.parse import urlparse
from uuid import uuid4

import requests
from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from app.core.auth import (
    _token_expiry_hours_for,
    clear_auth_cookie,
    create_access_token,
    get_current_user,
    hash_password,
    set_auth_cookie,
    verify_password,
)
from app.core.config import settings
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.user import AuthProvider, User, UserRole
from app.schemas.user import (
    ChangePassword,
    GoogleAuth,
    GoogleCodeExchange,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserOut,
    UserUpdate,
)

router = APIRouter(prefix="/auth", tags=["auth"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_PHOTO_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_PHOTO_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def _detect_photo_mime(content: bytes) -> str | None:
    """Validate user-photo magic bytes."""
    if len(content) < 12:
        return None
    if content[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if content[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "image/webp"
    if content[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    return None


def _token_response(user: User, response: Response) -> TokenResponse:
    hours = _token_expiry_hours_for(user)
    token = create_access_token(user.id, token_version=int(user.token_version or 0), hours=hours)
    set_auth_cookie(response, token, max_age_seconds=hours * 3600)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, response: Response, body: UserCreate, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    # H1: prevent admin-email pre-registration lockout. Admin emails must onboard via Google OAuth only.
    if email in settings.privileged_emails:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This email is reserved for administrators. Please sign in with Google.",
        )
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        name=body.name,
        email=email,
        password_hash=hash_password(body.password),
        auth_provider=AuthProvider.email,
        is_admin=False,
        role=UserRole.customer,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_response(user, response)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, response: Response, body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower().strip()).first()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    # Block admin users from email/password login — must use Google OAuth
    if user.is_admin or user.role in {UserRole.editor, UserRole.admin, UserRole.owner}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts must sign in with Google. Email/password login is not permitted for administrative users.",
        )
    return _token_response(user, response)


def _verify_google_id_token(id_token_str: str, expected_nonce: str | None) -> dict:
    try:
        idinfo = google_id_token.verify_oauth2_token(
            id_token_str, google_requests.Request(), settings.google_client_id
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")

    # H2: if the client bound a nonce, the id_token must echo it.
    if expected_nonce is not None:
        token_nonce = idinfo.get("nonce")
        if not token_nonce or token_nonce != expected_nonce:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google token nonce mismatch",
            )

    if not idinfo.get("email_verified", False):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google email not verified")

    return idinfo


def _upsert_google_user(db: Session, idinfo: dict) -> User:
    email = idinfo["email"].lower().strip()
    configured_role = UserRole(settings.role_for_email(email))
    is_admin_email = configured_role in {UserRole.admin, UserRole.owner}
    google_photo = idinfo.get("picture")
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            name=idinfo.get("name", email.split("@")[0]),
            email=email,
            photo_url=google_photo,
            auth_provider=AuthProvider.google,
            is_admin=is_admin_email,
            role=configured_role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # H1: upgrade an existing email/password account on verified Google sign-in.
        changed = False
        if user.auth_provider != AuthProvider.google:
            user.auth_provider = AuthProvider.google
            user.password_hash = None
            changed = True
        if user.is_admin != is_admin_email or user.role != configured_role:
            user.is_admin = is_admin_email
            user.role = configured_role
            changed = True
        # Sync Google profile photo on every login so it stays current.
        if google_photo and user.photo_url != google_photo:
            user.photo_url = google_photo
            changed = True
        if changed:
            db.commit()
            db.refresh(user)
    return user


@router.post("/google", response_model=TokenResponse)
@limiter.limit("10/minute")
def google_auth(request: Request, response: Response, body: GoogleAuth, db: Session = Depends(get_db)):
    """Implicit-style flow used by the Google Identity Services button on the storefront."""
    idinfo = _verify_google_id_token(body.credential, expected_nonce=body.nonce)
    user = _upsert_google_user(db, idinfo)
    return _token_response(user, response)


@router.post("/google/exchange", response_model=TokenResponse)
@limiter.limit("10/minute")
def google_code_exchange(
    request: Request,
    response: Response,
    body: GoogleCodeExchange,
    db: Session = Depends(get_db),
):
    """OAuth Authorization Code flow with PKCE (admin login).

    The browser obtained an authorization `code` from Google after redirecting with
    a `code_challenge`. We exchange the code server-side at the Google token endpoint,
    presenting the `code_verifier` to prove the same client started the flow, plus
    the confidential client_secret. The returned id_token is then verified as usual.
    """
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth code flow is not configured on this server",
        )

    # Defense in depth: only accept redirect_uris whose origin we already trust.
    parsed = urlparse(body.redirect_uri)
    if not parsed.scheme or not parsed.netloc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed redirect_uri")
    redirect_origin = f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
    allowed_origins = {
        item.strip().rstrip("/")
        for item in settings.backend_cors_origins.split(",")
        if item.strip()
    }
    if redirect_origin not in allowed_origins:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="redirect_uri is not on the allow-list",
        )

    try:
        token_res = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": body.code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": body.redirect_uri,
                "grant_type": "authorization_code",
                "code_verifier": body.code_verifier,
            },
            timeout=15,
        )
    except requests.RequestException:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach Google token endpoint",
        )

    if not token_res.ok:
        # Don't echo Google's error body to the client — log-equivalent only.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google token exchange failed",
        )

    payload = token_res.json()
    id_token_str = payload.get("id_token")
    if not id_token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google response missing id_token",
        )

    idinfo = _verify_google_id_token(id_token_str, expected_nonce=body.nonce)
    user = _upsert_google_user(db, idinfo)
    return _token_response(user, response)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    # Clear the cookie regardless of token validity — logout must always succeed
    # so a user with an expired or revoked session can still reset their state.
    clear_auth_cookie(response)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
def logout_all(
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Revoke every outstanding JWT for this user by bumping token_version."""
    user.token_version = int(user.token_version or 0) + 1
    db.commit()
    clear_auth_cookie(response)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)


@router.patch("/me", response_model=UserOut)
def update_me(body: UserUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.post("/me/change-password", response_model=UserOut)
@limiter.limit("5/minute")
def change_password(
    request: Request,
    body: ChangePassword,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Only email/password accounts can change password
    if user.auth_provider != AuthProvider.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google accounts cannot set a password. Manage your password through Google.",
        )
    if not user.password_hash or not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    user.password_hash = hash_password(body.new_password)
    # Bump token version to invalidate other sessions
    user.token_version = int(user.token_version or 0) + 1
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.post("/me/photo", response_model=UserOut)
def upload_photo(
    file: UploadFile,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_PHOTO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Photo must be JPEG, PNG, WEBP, or GIF",
        )

    # M3: buffer the upload to validate magic bytes before persisting.
    content = file.file.read(MAX_PHOTO_BYTES + 1)
    if len(content) > MAX_PHOTO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Photo exceeds 5 MB limit",
        )
    detected = _detect_photo_mime(content)
    if detected is None or detected != file.content_type:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File contents do not match a permitted image format",
        )

    ext = ALLOWED_PHOTO_TYPES[file.content_type]
    filename = f"{uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buf:
        buf.write(content)

    user.photo_url = f"/static/uploads/{filename}"
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)
