import os
from uuid import uuid4

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
from app.schemas.user import GoogleAuth, TokenResponse, UserCreate, UserLogin, UserOut, UserUpdate

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
    if email in settings.admin_emails:
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


@router.post("/google", response_model=TokenResponse)
@limiter.limit("10/minute")
def google_auth(request: Request, response: Response, body: GoogleAuth, db: Session = Depends(get_db)):
    try:
        idinfo = google_id_token.verify_oauth2_token(
            body.credential, google_requests.Request(), settings.google_client_id
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")

    # H2: if the client supplied a nonce, the id_token must echo the same nonce.
    # This blocks replay of captured id_tokens that lack the nonce binding.
    if body.nonce is not None:
        token_nonce = idinfo.get("nonce")
        if not token_nonce or token_nonce != body.nonce:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google token nonce mismatch",
            )

    if not idinfo.get("email_verified", False):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google email not verified")

    email = idinfo["email"].lower().strip()
    is_admin_email = email in settings.admin_emails
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            name=idinfo.get("name", email.split("@")[0]),
            email=email,
            photo_url=idinfo.get("picture"),
            auth_provider=AuthProvider.google,
            is_admin=is_admin_email,
            role=UserRole.owner if is_admin_email else UserRole.customer,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # H1: upgrade an existing email/password account to Google when the verified
        # Google identity matches. This prevents permanent lockout if an admin email
        # was registered via password before Google sign-in.
        changed = False
        if user.auth_provider != AuthProvider.google:
            user.auth_provider = AuthProvider.google
            user.password_hash = None  # disable password login on this account
            changed = True
        if is_admin_email and not user.is_admin:
            user.is_admin = True
            user.role = UserRole.owner
            changed = True
        if changed:
            db.commit()
            db.refresh(user)

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
