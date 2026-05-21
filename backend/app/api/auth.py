import os
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from app.core.auth import (
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


def _token_response(user: User, response: Response) -> TokenResponse:
    token = create_access_token(user.id)
    set_auth_cookie(response, token)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, response: Response, body: UserCreate, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        name=body.name,
        email=email,
        password_hash=hash_password(body.password),
        auth_provider=AuthProvider.email,
        is_admin=bool(settings.admin_email) and email == settings.admin_email.lower().strip(),
        role=UserRole.owner if bool(settings.admin_email) and email == settings.admin_email.lower().strip() else UserRole.customer,
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

    email = idinfo["email"].lower().strip()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            name=idinfo.get("name", email.split("@")[0]),
            email=email,
            photo_url=idinfo.get("picture"),
            auth_provider=AuthProvider.google,
            is_admin=bool(settings.admin_email) and email == settings.admin_email.lower().strip(),
            role=UserRole.owner if bool(settings.admin_email) and email == settings.admin_email.lower().strip() else UserRole.customer,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return _token_response(user, response)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
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

    ext = ALLOWED_PHOTO_TYPES[file.content_type]
    filename = f"{uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    bytes_written = 0
    with open(filepath, "wb") as buf:
        while chunk := file.file.read(64 * 1024):
            bytes_written += len(chunk)
            if bytes_written > MAX_PHOTO_BYTES:
                buf.close()
                os.remove(filepath)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Photo exceeds 5 MB limit",
                )
            buf.write(chunk)

    user.photo_url = f"/static/uploads/{filename}"
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)
