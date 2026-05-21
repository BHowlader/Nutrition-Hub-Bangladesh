from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
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
    is_admin: bool = False

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
