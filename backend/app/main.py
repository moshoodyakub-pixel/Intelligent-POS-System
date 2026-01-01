import os
import json
import logging
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, check_database_connection
from .models import Product, Vendor, Transaction, SalesForecast, User
from .routes import products, vendors, transactions, forecasting, auth, reports
from .middleware import RateLimitMiddleware, ErrorHandlingMiddleware, RequestLoggingMiddleware
from .config import settings
from .metrics import MetricsMiddleware, get_metrics, get_metrics_content_type

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Sentry for error tracking (if configured)
if settings.SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration
        
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENVIRONMENT,
            release=settings.APP_VERSION,
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            integrations=[
                StarletteIntegration(transaction_style="url"),
                FastApiIntegration(transaction_style="url"),
            ],
            # Don't send PII
            send_default_pii=False,
        )
        logger.info("Sentry initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to initialize Sentry: {e}")

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
        logger.info(f"Application started - Environment: {settings.ENVIRONMENT}")

# Add middleware (order matters - first added is outermost)
# Error handling should be outermost to catch all errors
app.add_middleware(ErrorHandlingMiddleware)

# Request logging
app.add_middleware(RequestLoggingMiddleware)

# Prometheus metrics middleware
if settings.METRICS_ENABLED:
    app.add_middleware(MetricsMiddleware)

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
    db_healthy = check_database_connection()
    status = "healthy" if db_healthy else "unhealthy"
    status_code = 200 if db_healthy else 503
    
    response_data = {
        "status": status,
        "message": "API is running",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "connected" if db_healthy else "disconnected"
    }
    
    return Response(
        content=json.dumps(response_data),
        status_code=status_code,
        media_type="application/json"
    )

@app.get("/metrics")
def metrics_endpoint():
    """Prometheus metrics endpoint for monitoring."""
    if not settings.METRICS_ENABLED:
        return Response(content="Metrics disabled", status_code=503)
    return Response(
        content=get_metrics(),
        media_type=get_metrics_content_type()
    )
