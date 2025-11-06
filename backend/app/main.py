from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
# Import models so SQLAlchemy registers tables. Mark unused imports with noqa.
from .models import Product, Vendor, Transaction, SalesForecast  # noqa: F401
from .routes import products, vendors, transactions, forecasting, health

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Intelligent POS System",
    description="Multi-Vendor Sales & Forecasting Platform",
    version="1.0.0",
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


# Health check endpoint (root)
@app.get("/")
def read_root():
    return {
        "message": "Welcome to Intelligent POS System",
        "version": "1.0.0",
        "status": "running",
    }


# Legacy root-level health endpoint (kept for backward compatibility)
@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "API is running"}