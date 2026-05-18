import os
import shutil
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from app.core.auth import create_access_token, get_current_user, hash_password, verify_password
from app.core.config import settings
from app.core.database import get_db
from app.models.user import AuthProvider, User
from app.schemas.user import GoogleAuth, TokenResponse, UserCreate, UserLogin, UserOut, UserUpdate

router = APIRouter(prefix="/auth", tags=["auth"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _token_response(user: User) -> TokenResponse:
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        name=body.name,
        email=body.email.lower().strip(),
        password_hash=hash_password(body.password),
        auth_provider=AuthProvider.email,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower().strip()).first()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return _token_response(user)


@router.post("/google", response_model=TokenResponse)
def google_auth(body: GoogleAuth, db: Session = Depends(get_db)):
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
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return _token_response(user)


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
    ext = os.path.splitext(file.filename or "photo.jpg")[1] or ".jpg"
    filename = f"{uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    user.photo_url = f"/static/uploads/{filename}"
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)
