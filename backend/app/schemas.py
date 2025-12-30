from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List, Generic, TypeVar
from enum import Enum

T = TypeVar('T')


# Pagination Schema
class PaginationMeta(BaseModel):
    """Metadata for paginated responses."""
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there is a next page")
    has_prev: bool = Field(..., description="Whether there is a previous page")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper."""
    items: List[T]
    pagination: PaginationMeta


# User Role Enum
class UserRole(str, Enum):
    ADMIN = "admin"
    VENDOR = "vendor"
    CASHIER = "cashier"
    STAFF = "staff"  # Keep for backwards compatibility


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
    role: Optional[UserRole] = UserRole.CASHIER


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


# ARIMA Forecast Schemas
class ARIMAForecastRequest(BaseModel):
    """Request schema for ARIMA forecast generation."""
    product_id: Optional[int] = Field(None, description="Product ID to forecast (optional, forecasts all if not provided)")
    periods: int = Field(default=7, ge=1, le=365, description="Number of periods to forecast")
    confidence_level: float = Field(default=0.95, ge=0.5, le=0.99, description="Confidence level for intervals")


class ARIMAForecastPoint(BaseModel):
    """Single forecast point with confidence intervals."""
    date: str
    predicted_value: float
    lower_bound: float
    upper_bound: float


class ARIMAForecastResponse(BaseModel):
    """Response schema for ARIMA forecast."""
    product_id: Optional[int]
    product_name: Optional[str]
    forecast_generated_at: datetime
    periods: int
    historical_data: List[dict]
    forecast_data: List[ARIMAForecastPoint]
    model_metrics: dict


# Reports and Analytics Schemas
class SalesReport(BaseModel):
    """Sales report summary."""
    total_revenue: float
    total_transactions: int
    average_transaction_value: float
    top_products: List[dict]
    sales_by_vendor: List[dict]
    sales_trend: List[dict]
    period_start: datetime
    period_end: datetime


class InventoryAlert(BaseModel):
    """Inventory alert for low stock products."""
    product_id: int
    product_name: str
    current_quantity: int
    threshold: int
    vendor_id: int
    vendor_name: str
    alert_level: str  # "critical", "warning", "low"


class InventoryAlertResponse(BaseModel):
    """Response schema for inventory alerts."""
    alerts: List[InventoryAlert]
    total_alerts: int
    critical_count: int
    warning_count: int
    low_count: int


class DashboardStats(BaseModel):
    """Dashboard statistics summary."""
    total_products: int
    total_vendors: int
    total_transactions: int
    total_revenue: float
    low_stock_count: int
    recent_transactions: List[dict]
    revenue_trend: List[dict]


# Customer Management Schemas
class CustomerBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class Customer(CustomerBase):
    id: int
    created_at: datetime
    total_purchases: float = 0
    transaction_count: int = 0
    
    class Config:
        from_attributes = True