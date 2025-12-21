import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .models import Product, Vendor, Transaction, SalesForecast, User
from .routes import products, vendors, transactions, forecasting, auth

app = FastAPI(
    title="Intelligent POS System",
    description="Multi-Vendor Sales & Forecasting Platform",
    version="1.0.0"
)

@app.on_event("startup")
def on_startup():
    if os.environ.get("TESTING") is None:
        Base.metadata.create_all(bind=engine)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# Health check endpoint
@app.get("/")
def read_root():
    return {
        "message": "Welcome to Intelligent POS System",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "API is running"
    }
