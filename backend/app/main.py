from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .models import Product, Vendor, Transaction, SalesForecast
from .routes import products, vendors, transactions, forecasting, health

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Intelligent POS System",
    description="Multi-Vendor Sales & Forecasting Platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(products.router)
app.include_router(vendors.router)
app.include_router(transactions.router)
app.include_router(forecasting.router)
app.include_router(health.router)
