from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import SalesForecast, User, Transaction
from ..schemas import SalesForecastUpdate, SalesForecast as SalesForecastSchema, ForecastResponse
from .. import security
from typing import List
from datetime import datetime, timedelta
import pandas as pd

router = APIRouter(prefix="/api/forecasting", tags=["forecasting"])

# Generate forecast
@router.post("/sales", response_model=ForecastResponse)
def generate_forecast(product_id: int, model: str, period: int, db: Session = Depends(get_db), current_user: User = Depends(security.get_current_user)):
    # Get historical data
    transactions = db.query(Transaction).filter(Transaction.product_id == product_id).all()
    if not transactions:
        raise HTTPException(status_code=404, detail="No historical data for this product")

    # Create a pandas DataFrame
    data = [{"date": t.transaction_date, "quantity": t.quantity} for t in transactions]
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.set_index('date')
    
    # Resample to daily sales
    daily_sales = df['quantity'].resample('D').sum()

    # Generate forecast
    if model == "Moving Average":
        forecast_values = daily_sales.rolling(window=7).mean().iloc[-period:].tolist()
    elif model == "ARIMA":
        # ARIMA model logic goes here
        raise HTTPException(status_code=501, detail="ARIMA model not yet implemented")
    else:
        raise HTTPException(status_code=400, detail="Invalid model specified")

    # Prepare response
    historical_data = [{"date": str(date), "quantity": value} for date, value in daily_sales.items()]
    forecast_data = [{"date": str(daily_sales.index[-1] + timedelta(days=i+1)), "quantity": value} for i, value in enumerate(forecast_values)]
    
    return {"historical_data": historical_data, "forecast_data": forecast_data}