# hbapp/schema.py
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    role: Optional[str] = None

    @field_validator("password")
    @classmethod
    def min_len(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

class LoginIn(BaseModel):
    username: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class MeOut(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str] = None
    role: str

# Concrete response envelopes (no generics -> works with FastAPI/Pydantic v2)
class Msg(BaseModel):
    detail: str

class TokenResponse(BaseModel):
    detail: str
    result: TokenOut
