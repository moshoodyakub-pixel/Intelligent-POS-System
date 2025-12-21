import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .models import Product, Vendor, Transaction, SalesForecast, User
from .routes import products, vendors, transactions, forecasting, auth, reports
from .middleware import RateLimitMiddleware, ErrorHandlingMiddleware, RequestLoggingMiddleware
from .config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="Multi-Vendor Sales & Forecasting Platform with ARIMA-powered predictions",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

@app.on_event("startup")
def on_startup():
    if os.environ.get("TESTING") is None:
        Base.metadata.create_all(bind=engine)

# Add middleware (order matters - first added is outermost)
# Error handling should be outermost to catch all errors
app.add_middleware(ErrorHandlingMiddleware)

# Request logging
app.add_middleware(RequestLoggingMiddleware)

# Rate limiting
app.add_middleware(RateLimitMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(vendors.router)
app.include_router(transactions.router)
app.include_router(forecasting.router)
app.include_router(reports.router)

# Health check endpoint
@app.get("/")
def read_root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "API is running",
        "version": settings.APP_VERSION
    }
