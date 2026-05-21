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
    nonce: str | None = None  # optional client-generated nonce for replay protection


class GoogleCodeExchange(BaseModel):
    code: str = Field(min_length=10, max_length=512)
    code_verifier: str = Field(min_length=43, max_length=128, pattern=r"^[A-Za-z0-9\-._~]+$")
    redirect_uri: str = Field(min_length=8, max_length=512)
    nonce: str | None = None


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    phone: str | None = Field(default=None, min_length=8, max_length=40, pattern=r"^[+\d][\d\s\-()]{6,38}\d$")
    address: str | None = Field(default=None, min_length=4, max_length=500)


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    phone: str | None = None
    address: str | None = None
    photo_url: str | None = None
    auth_provider: str
    is_admin: bool = False
    role: str = "customer"

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
