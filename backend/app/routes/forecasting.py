from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import SalesForecast
from ..schemas import SalesForecastCreate, SalesForecastUpdate, SalesForecast as SalesForecastSchema

router = APIRouter(prefix="/api/forecasting", tags=["forecasting"])

# Get all forecasts
@router.get("/sales", response_model=list[SalesForecastSchema])
def get_forecasts(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    forecasts = db.query(SalesForecast).offset(skip).limit(limit).all()
    return forecasts

# Create forecast
@router.post("/sales", response_model=SalesForecastSchema)
def create_forecast(forecast: SalesForecastCreate, db: Session = Depends(get_db)):
    db_forecast = SalesForecast(**forecast.dict())
    db.add(db_forecast)
    db.commit()
    db.refresh(db_forecast)
    return db_forecast

# Get forecast by ID
@router.get("/sales/{forecast_id}", response_model=SalesForecastSchema)
def get_forecast(forecast_id: int, db: Session = Depends(get_db)):
    forecast = db.query(SalesForecast).filter(SalesForecast.id == forecast_id).first()
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    return forecast

# Update forecast
@router.put("/sales/{forecast_id}", response_model=SalesForecastSchema)
def update_forecast(forecast_id: int, forecast: SalesForecastUpdate, db: Session = Depends(get_db)):
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
    forecast = db.query(SalesForecast).filter(SalesForecast.id == forecast_id).first()
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    db.delete(forecast)
    db.commit()
    return {"message": "Forecast deleted successfully"}