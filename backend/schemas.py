from pydantic import BaseModel
from typing import Optional, List
import datetime

class UserBase(BaseModel):
    username: str
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    activity_level: Optional[str] = None
    goal: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    activity_level: Optional[str] = None
    goal: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class DietRecordBase(BaseModel):
    weight: float
    target_calories: int
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[int] = None
    activity_level: Optional[str] = None
    goal: Optional[str] = None

class DietRecordCreate(BaseModel):
    weight: float
    target_calories: int
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[int] = None
    activity_level: Optional[str] = None
    goal: Optional[str] = None

class DietRecord(DietRecordBase):
    id: int
    date: datetime.datetime
    user_id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str
