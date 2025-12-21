from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, asc, desc
from typing import Optional, List
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from ..database import get_db
from ..models import SalesForecast, Product, Transaction
from ..schemas import (
    SalesForecastCreate, SalesForecastUpdate, SalesForecast as SalesForecastSchema,
    ARIMAForecastRequest, ARIMAForecastResponse, ARIMAForecastPoint,
    PaginatedResponse, PaginationMeta
)
from ..config import settings

router = APIRouter(prefix="/api/forecasting", tags=["forecasting"])


def calculate_pagination(total: int, page: int, page_size: int) -> PaginationMeta:
    """Calculate pagination metadata."""
    total_pages = (total + page_size - 1) // page_size
    return PaginationMeta(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )


def generate_arima_forecast(
    historical_data: List[dict],
    periods: int,
    confidence_level: float = 0.95
) -> tuple:
    """
    Generate ARIMA forecast from historical transaction data.
    
    This is a simplified ARIMA implementation that uses statsmodels when available,
    with a fallback to a moving average approach for environments without full statsmodels support.
    """
    if not historical_data or len(historical_data) < 3:
        return [], {}
    
    # Convert to pandas DataFrame
    df = pd.DataFrame(historical_data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.set_index('date').sort_index()
    
    # Get the values as a series
    values = df['value'].values
    
    try:
        # Try to use statsmodels ARIMA
        from statsmodels.tsa.arima.model import ARIMA
        from scipy import stats
        
        # Fit ARIMA model (order can be adjusted)
        # Using (1,1,1) as a reasonable default
        order = (1, 1, 1) if len(values) >= 10 else (1, 0, 1)
        model = ARIMA(values, order=order)
        model_fit = model.fit()
        
        # Generate forecast
        forecast_result = model_fit.get_forecast(steps=periods)
        forecast_values = forecast_result.predicted_mean
        
        # Confidence intervals
        alpha = 1 - confidence_level
        conf_int = forecast_result.conf_int(alpha=alpha)
        
        # Generate forecast dates
        last_date = df.index[-1]
        forecast_dates = pd.date_range(start=last_date + timedelta(days=1), periods=periods, freq='D')
        
        # Build forecast data
        forecast_data = []
        for i, date in enumerate(forecast_dates):
            forecast_data.append(ARIMAForecastPoint(
                date=date.strftime('%Y-%m-%d'),
                predicted_value=round(max(0, float(forecast_values[i])), 2),
                lower_bound=round(max(0, float(conf_int[i, 0])), 2),
                upper_bound=round(float(conf_int[i, 1]), 2)
            ))
        
        # Model metrics
        metrics = {
            "model_type": "ARIMA",
            "order": order,
            "aic": round(model_fit.aic, 2) if hasattr(model_fit, 'aic') else None,
            "bic": round(model_fit.bic, 2) if hasattr(model_fit, 'bic') else None,
            "data_points": len(values)
        }
        
        return forecast_data, metrics
        
    except (ImportError, ValueError, RuntimeError) as e:
        # Fallback to simple moving average forecast
        # This provides a reasonable estimate without full ARIMA
        window = min(7, len(values))
        ma = np.convolve(values, np.ones(window)/window, mode='valid')
        
        # Use the last MA value as the base forecast
        base_forecast = ma[-1] if len(ma) > 0 else np.mean(values)
        
        # Calculate standard deviation for confidence intervals
        std_dev = np.std(values) if len(values) > 1 else 0
        
        # Z-score for confidence level (using pre-computed values for common levels)
        z_score = 1.96  # Approximate for 95% confidence
        if confidence_level >= 0.99:
            z_score = 2.576
        elif confidence_level >= 0.95:
            z_score = 1.96
        elif confidence_level >= 0.90:
            z_score = 1.645
        else:
            z_score = 1.28  # ~80% confidence
        
        # Generate forecast dates
        last_date = df.index[-1]
        forecast_dates = pd.date_range(start=last_date + timedelta(days=1), periods=periods, freq='D')
        
        # Build forecast data with increasing uncertainty
        forecast_data = []
        for i, date in enumerate(forecast_dates):
            # Uncertainty grows over time
            uncertainty_factor = 1 + (i * 0.1)
            margin = z_score * std_dev * uncertainty_factor
            
            forecast_data.append(ARIMAForecastPoint(
                date=date.strftime('%Y-%m-%d'),
                predicted_value=round(max(0, base_forecast), 2),
                lower_bound=round(max(0, base_forecast - margin), 2),
                upper_bound=round(base_forecast + margin, 2)
            ))
        
        metrics = {
            "model_type": "Moving Average (Fallback)",
            "window_size": window,
            "data_points": len(values),
            "note": "Using simplified forecast due to limited data or dependencies"
        }
        
        return forecast_data, metrics


# Get all forecasts with pagination
@router.get("/sales", response_model=PaginatedResponse[SalesForecastSchema])
def get_forecasts(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(None, ge=1, le=100, description="Items per page"),
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    db: Session = Depends(get_db)
):
    """Get all forecasts with pagination and filtering."""
    if page_size is None:
        page_size = settings.DEFAULT_PAGE_SIZE
    
    query = db.query(SalesForecast)
    
    if product_id:
        query = query.filter(SalesForecast.product_id == product_id)
    
    total = query.count()
    offset = (page - 1) * page_size
    forecasts = query.order_by(desc(SalesForecast.forecast_date)).offset(offset).limit(page_size).all()
    
    return PaginatedResponse(
        items=forecasts,
        pagination=calculate_pagination(total, page, page_size)
    )


# Generate ARIMA forecast
@router.post("/arima", response_model=ARIMAForecastResponse)
def generate_forecast(
    request: ARIMAForecastRequest,
    db: Session = Depends(get_db)
):
    """
    Generate ARIMA-based sales forecast from historical transaction data.
    
    - **product_id**: Optional product ID to forecast (forecasts total sales if not provided)
    - **periods**: Number of future periods to forecast (1-365 days)
    - **confidence_level**: Confidence level for prediction intervals (0.5-0.99)
    """
    # Build query for historical data
    query = db.query(
        func.date(Transaction.transaction_date).label('date'),
        func.sum(Transaction.total_price).label('value')
    )
    
    product_name = None
    if request.product_id:
        product = db.query(Product).filter(Product.id == request.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        product_name = product.name
        query = query.filter(Transaction.product_id == request.product_id)
    
    # Group by date
    query = query.group_by(func.date(Transaction.transaction_date))
    query = query.order_by(asc(func.date(Transaction.transaction_date)))
    
    results = query.all()
    
    if not results:
        raise HTTPException(
            status_code=400,
            detail="Insufficient historical data for forecasting. Need at least some transaction records."
        )
    
    # Convert to list of dicts
    historical_data = [{"date": str(r.date), "value": float(r.value)} for r in results]
    
    # Generate forecast
    forecast_data, metrics = generate_arima_forecast(
        historical_data,
        request.periods,
        request.confidence_level
    )
    
    if not forecast_data:
        raise HTTPException(
            status_code=400,
            detail="Unable to generate forecast. Need more historical data (at least 3 data points)."
        )
    
    return ARIMAForecastResponse(
        product_id=request.product_id,
        product_name=product_name,
        forecast_generated_at=datetime.utcnow(),
        periods=request.periods,
        historical_data=historical_data,
        forecast_data=forecast_data,
        model_metrics=metrics
    )


# Create forecast (manual)
@router.post("/sales", response_model=SalesForecastSchema)
def create_forecast(forecast: SalesForecastCreate, db: Session = Depends(get_db)):
    """Create a manual forecast entry."""
    # Verify product exists
    product = db.query(Product).filter(Product.id == forecast.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db_forecast = SalesForecast(**forecast.dict())
    db.add(db_forecast)
    db.commit()
    db.refresh(db_forecast)
    return db_forecast


# Get forecast by ID
@router.get("/sales/{forecast_id}", response_model=SalesForecastSchema)
def get_forecast(forecast_id: int, db: Session = Depends(get_db)):
    """Get a forecast by ID."""
    forecast = db.query(SalesForecast).filter(SalesForecast.id == forecast_id).first()
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    return forecast


# Update forecast
@router.put("/sales/{forecast_id}", response_model=SalesForecastSchema)
def update_forecast(forecast_id: int, forecast: SalesForecastUpdate, db: Session = Depends(get_db)):
    """Update a forecast."""
    db_forecast = db.query(SalesForecast).filter(SalesForecast.id == forecast_id).first()
    if not db_forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")

    update_data = forecast.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_forecast, key, value)

    db.add(db_forecast)
    db.commit()
    db.refresh(db_forecast)
    return db_forecast


# Delete forecast
@router.delete("/sales/{forecast_id}")
def delete_forecast(forecast_id: int, db: Session = Depends(get_db)):
    """Delete a forecast."""
    forecast = db.query(SalesForecast).filter(SalesForecast.id == forecast_id).first()
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    db.delete(forecast)
    db.commit()
    return {"message": "Forecast deleted successfully"}