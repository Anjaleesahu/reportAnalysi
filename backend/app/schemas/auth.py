from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Sex = Literal["male", "female", "other"]


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: Optional[str] = None
    sex: Optional[Sex] = None
    date_of_birth: Optional[date] = None


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    sex: Optional[Sex] = None
    date_of_birth: Optional[date] = None
    sleep_goal: Optional[float] = Field(default=None, ge=0, le=24)
    water_goal: Optional[int] = Field(default=None, ge=0)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: Optional[str] = None
    sex: Optional[Sex] = None
    date_of_birth: Optional[date] = None
    sleep_goal: Optional[float] = None
    water_goal: Optional[int] = None
    created_at: datetime
