from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    avatar: str = ""
    created_at: datetime
    default_instructions: Optional[str] = None
    preferred_model: Optional[str] = "llama-3.3-70b-versatile"
    is_admin: bool = False

    model_config = {"from_attributes": True}


class UserSettingsUpdate(BaseModel):
    default_instructions: Optional[str] = None
    preferred_model: Optional[str] = None


class TokenResponse(BaseModel):
    token: str
    user: UserOut
