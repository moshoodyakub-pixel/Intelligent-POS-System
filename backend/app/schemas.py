from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

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

# Forecast Response Schema
class ForecastData(BaseModel):
    date: str
    quantity: float

class ForecastResponse(BaseModel):
    historical_data: List[ForecastData]
    forecast_data: List[ForecastData]

# User Schemas
class UserCreate(BaseModel):
    username: str
    password: str

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

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