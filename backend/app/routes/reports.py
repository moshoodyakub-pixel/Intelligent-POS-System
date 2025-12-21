"""
Reports and Analytics API endpoints for the POS system.
Provides sales reports, inventory alerts, and dashboard statistics.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models import Transaction, Product, Vendor, Customer
from ..schemas import (
    SalesReport, InventoryAlert, InventoryAlertResponse, DashboardStats
)

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/sales", response_model=SalesReport)
def get_sales_report(
    days: int = Query(30, ge=1, le=365, description="Number of days for the report"),
    vendor_id: Optional[int] = Query(None, description="Filter by vendor ID"),
    db: Session = Depends(get_db)
):
    """
    Generate a comprehensive sales report.
    
    - **days**: Number of days to include in the report (default: 30)
    - **vendor_id**: Optional vendor filter
    """
    period_end = datetime.utcnow()
    period_start = period_end - timedelta(days=days)
    
    # Base query for transactions in the period
    query = db.query(Transaction).filter(
        Transaction.transaction_date >= period_start,
        Transaction.transaction_date <= period_end
    )
    
    if vendor_id:
        query = query.filter(Transaction.vendor_id == vendor_id)
    
    transactions = query.all()
    
    # Calculate totals
    total_revenue = sum(t.total_price for t in transactions)
    total_transactions = len(transactions)
    avg_transaction = total_revenue / total_transactions if total_transactions > 0 else 0
    
    # Top products by revenue
    product_sales = {}
    for t in transactions:
        product = db.query(Product).filter(Product.id == t.product_id).first()
        if product:
            if product.id not in product_sales:
                product_sales[product.id] = {
                    "product_id": product.id,
                    "product_name": product.name,
                    "total_quantity": 0,
                    "total_revenue": 0
                }
            product_sales[product.id]["total_quantity"] += t.quantity
            product_sales[product.id]["total_revenue"] += t.total_price
    
    top_products = sorted(
        product_sales.values(),
        key=lambda x: x["total_revenue"],
        reverse=True
    )[:10]
    
    # Sales by vendor
    vendor_sales = {}
    for t in transactions:
        vendor = db.query(Vendor).filter(Vendor.id == t.vendor_id).first()
        if vendor:
            if vendor.id not in vendor_sales:
                vendor_sales[vendor.id] = {
                    "vendor_id": vendor.id,
                    "vendor_name": vendor.name,
                    "total_transactions": 0,
                    "total_revenue": 0
                }
            vendor_sales[vendor.id]["total_transactions"] += 1
            vendor_sales[vendor.id]["total_revenue"] += t.total_price
    
    sales_by_vendor = sorted(
        vendor_sales.values(),
        key=lambda x: x["total_revenue"],
        reverse=True
    )
    
    # Sales trend (daily aggregation)
    daily_sales = {}
    for t in transactions:
        date_key = t.transaction_date.strftime('%Y-%m-%d')
        if date_key not in daily_sales:
            daily_sales[date_key] = {"date": date_key, "revenue": 0, "transactions": 0}
        daily_sales[date_key]["revenue"] += t.total_price
        daily_sales[date_key]["transactions"] += 1
    
    sales_trend = sorted(daily_sales.values(), key=lambda x: x["date"])
    
    return SalesReport(
        total_revenue=round(total_revenue, 2),
        total_transactions=total_transactions,
        average_transaction_value=round(avg_transaction, 2),
        top_products=top_products,
        sales_by_vendor=sales_by_vendor,
        sales_trend=sales_trend,
        period_start=period_start,
        period_end=period_end
    )


@router.get("/inventory-alerts", response_model=InventoryAlertResponse)
def get_inventory_alerts(
    critical_threshold: int = Query(5, ge=0, description="Critical stock level"),
    warning_threshold: int = Query(15, ge=0, description="Warning stock level"),
    low_threshold: int = Query(25, ge=0, description="Low stock level"),
    db: Session = Depends(get_db)
):
    """
    Get inventory alerts for products with low stock.
    
    - **critical_threshold**: Stock level for critical alert (default: 5)
    - **warning_threshold**: Stock level for warning alert (default: 15)
    - **low_threshold**: Stock level for low alert (default: 25)
    """
    # Get all products with stock below low_threshold
    products = db.query(Product).filter(Product.quantity <= low_threshold).all()
    
    alerts = []
    critical_count = 0
    warning_count = 0
    low_count = 0
    
    for product in products:
        vendor = db.query(Vendor).filter(Vendor.id == product.vendor_id).first()
        vendor_name = vendor.name if vendor else "Unknown"
        
        # Determine alert level
        if product.quantity <= critical_threshold:
            alert_level = "critical"
            critical_count += 1
        elif product.quantity <= warning_threshold:
            alert_level = "warning"
            warning_count += 1
        else:
            alert_level = "low"
            low_count += 1
        
        alerts.append(InventoryAlert(
            product_id=product.id,
            product_name=product.name,
            current_quantity=product.quantity,
            threshold=low_threshold,
            vendor_id=product.vendor_id,
            vendor_name=vendor_name,
            alert_level=alert_level
        ))
    
    # Sort by alert level (critical first)
    level_order = {"critical": 0, "warning": 1, "low": 2}
    alerts.sort(key=lambda x: (level_order[x.alert_level], x.current_quantity))
    
    return InventoryAlertResponse(
        alerts=alerts,
        total_alerts=len(alerts),
        critical_count=critical_count,
        warning_count=warning_count,
        low_count=low_count
    )


@router.get("/dashboard-stats", response_model=DashboardStats)
def get_dashboard_stats(
    days: int = Query(7, ge=1, le=30, description="Days for trend data"),
    db: Session = Depends(get_db)
):
    """
    Get dashboard statistics including totals and trends.
    
    - **days**: Number of days for revenue trend (default: 7)
    """
    # Total counts
    total_products = db.query(Product).count()
    total_vendors = db.query(Vendor).count()
    total_transactions = db.query(Transaction).count()
    
    # Total revenue
    total_revenue_result = db.query(func.sum(Transaction.total_price)).scalar()
    total_revenue = float(total_revenue_result) if total_revenue_result else 0
    
    # Low stock count (products with quantity <= 10)
    low_stock_count = db.query(Product).filter(Product.quantity <= 10).count()
    
    # Recent transactions
    recent = db.query(Transaction).order_by(
        desc(Transaction.transaction_date)
    ).limit(5).all()
    
    recent_transactions = []
    for t in recent:
        product = db.query(Product).filter(Product.id == t.product_id).first()
        vendor = db.query(Vendor).filter(Vendor.id == t.vendor_id).first()
        recent_transactions.append({
            "id": t.id,
            "product_name": product.name if product else "Unknown",
            "vendor_name": vendor.name if vendor else "Unknown",
            "quantity": t.quantity,
            "total_price": t.total_price,
            "date": t.transaction_date.isoformat()
        })
    
    # Revenue trend
    period_start = datetime.utcnow() - timedelta(days=days)
    transactions = db.query(Transaction).filter(
        Transaction.transaction_date >= period_start
    ).all()
    
    daily_revenue = {}
    for t in transactions:
        date_key = t.transaction_date.strftime('%Y-%m-%d')
        if date_key not in daily_revenue:
            daily_revenue[date_key] = 0
        daily_revenue[date_key] += t.total_price
    
    revenue_trend = [
        {"date": k, "revenue": round(v, 2)}
        for k, v in sorted(daily_revenue.items())
    ]
    
    return DashboardStats(
        total_products=total_products,
        total_vendors=total_vendors,
        total_transactions=total_transactions,
        total_revenue=round(total_revenue, 2),
        low_stock_count=low_stock_count,
        recent_transactions=recent_transactions,
        revenue_trend=revenue_trend
    )


@router.get("/analytics/product/{product_id}")
def get_product_analytics(
    product_id: int,
    days: int = Query(30, ge=1, le=365, description="Days for analysis"),
    db: Session = Depends(get_db)
):
    """
    Get detailed analytics for a specific product.
    
    - **product_id**: Product ID to analyze
    - **days**: Number of days for the analysis (default: 30)
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    period_start = datetime.utcnow() - timedelta(days=days)
    
    transactions = db.query(Transaction).filter(
        Transaction.product_id == product_id,
        Transaction.transaction_date >= period_start
    ).all()
    
    total_sold = sum(t.quantity for t in transactions)
    total_revenue = sum(t.total_price for t in transactions)
    transaction_count = len(transactions)
    
    # Daily sales
    daily_sales = {}
    for t in transactions:
        date_key = t.transaction_date.strftime('%Y-%m-%d')
        if date_key not in daily_sales:
            daily_sales[date_key] = {"quantity": 0, "revenue": 0}
        daily_sales[date_key]["quantity"] += t.quantity
        daily_sales[date_key]["revenue"] += t.total_price
    
    sales_trend = [
        {"date": k, **v}
        for k, v in sorted(daily_sales.items())
    ]
    
    # Average daily sales
    avg_daily_quantity = total_sold / days if days > 0 else 0
    avg_daily_revenue = total_revenue / days if days > 0 else 0
    
    # Estimated days until stock runs out
    days_until_stockout = (
        product.quantity / avg_daily_quantity 
        if avg_daily_quantity > 0 else float('inf')
    )
    
    return {
        "product": {
            "id": product.id,
            "name": product.name,
            "current_stock": product.quantity,
            "price": product.price
        },
        "period": {
            "start": period_start.isoformat(),
            "end": datetime.utcnow().isoformat(),
            "days": days
        },
        "sales_summary": {
            "total_quantity_sold": total_sold,
            "total_revenue": round(total_revenue, 2),
            "transaction_count": transaction_count,
            "average_daily_quantity": round(avg_daily_quantity, 2),
            "average_daily_revenue": round(avg_daily_revenue, 2)
        },
        "stock_forecast": {
            "days_until_stockout": round(days_until_stockout, 1) if days_until_stockout != float('inf') else None,
            "reorder_recommended": product.quantity <= 10 or (days_until_stockout < 7 and days_until_stockout != float('inf'))
        },
        "sales_trend": sales_trend
    }
