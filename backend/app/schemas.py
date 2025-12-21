from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from enum import Enum


# User Role Enum
class UserRole(str, Enum):
    ADMIN = "admin"
    STAFF = "staff"


# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role: Optional[UserRole] = UserRole.STAFF


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class User(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


# Vendor Schemas
class VendorBase(BaseModel):
    name: str
    email: str
    phone: str
    address: str

class VendorCreate(VendorBase):
    pass

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class Vendor(VendorBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    quantity: int
    vendor_id: int

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    vendor_id: Optional[int] = None

class Product(ProductBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Transaction Schemas
class TransactionBase(BaseModel):
    vendor_id: int
    product_id: int
    quantity: int
    total_price: float

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    vendor_id: Optional[int] = None
    product_id: Optional[int] = None
    quantity: Optional[int] = None
    total_price: Optional[float] = None

class Transaction(TransactionBase):
    id: int
    transaction_date: datetime
    
    class Config:
        from_attributes = True

# SalesForecast Schemas
class SalesForecastBase(BaseModel):
    product_id: int
    forecasted_quantity: int
    forecasted_price: float

class SalesForecastCreate(SalesForecastBase):
    pass

class SalesForecastUpdate(BaseModel):
    product_id: Optional[int] = None
    forecasted_quantity: Optional[int] = None
    forecasted_price: Optional[float] = None

class SalesForecast(SalesForecastBase):
    id: int
    forecast_date: datetime
    
    class Config:
        from_attributes = True