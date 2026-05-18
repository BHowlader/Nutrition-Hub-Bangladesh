from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class GoogleAuth(BaseModel):
    credential: str  # Google ID token


class UserUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    address: str | None = None


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    phone: str | None = None
    address: str | None = None
    photo_url: str | None = None
    auth_provider: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
