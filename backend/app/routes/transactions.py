from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from typing import Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models import Transaction, Product, Vendor
from ..schemas import TransactionCreate, TransactionUpdate, Transaction as TransactionSchema, PaginatedResponse, PaginationMeta
from ..config import settings

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


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


# Get all transactions with pagination, filtering, and sorting
@router.get("/", response_model=PaginatedResponse[TransactionSchema])
def get_transactions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(None, ge=1, le=100, description="Items per page"),
    vendor_id: Optional[int] = Query(None, description="Filter by vendor ID"),
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum total price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum total price filter"),
    date_from: Optional[datetime] = Query(None, description="Start date filter"),
    date_to: Optional[datetime] = Query(None, description="End date filter"),
    sort_by: Optional[str] = Query(None, enum=["transaction_date", "total_price", "quantity"], description="Sort field"),
    sort_order: Optional[str] = Query("desc", enum=["asc", "desc"], description="Sort order"),
    db: Session = Depends(get_db)
):
    """
    Get transactions with pagination, filtering, and sorting.
    
    - **page**: Page number (default: 1)
    - **page_size**: Number of items per page (default: 10, max: 100)
    - **vendor_id**: Filter by vendor ID
    - **product_id**: Filter by product ID
    - **min_price/max_price**: Price range filter
    - **date_from/date_to**: Date range filter
    - **sort_by**: Field to sort by (default: transaction_date)
    - **sort_order**: Sort direction (default: desc for newest first)
    """
    # Default page size
    if page_size is None:
        page_size = settings.DEFAULT_PAGE_SIZE
    
    # Base query
    query = db.query(Transaction)
    
    # Apply filters
    if vendor_id:
        query = query.filter(Transaction.vendor_id == vendor_id)
    if product_id:
        query = query.filter(Transaction.product_id == product_id)
    if min_price is not None:
        query = query.filter(Transaction.total_price >= min_price)
    if max_price is not None:
        query = query.filter(Transaction.total_price <= max_price)
    if date_from:
        query = query.filter(Transaction.transaction_date >= date_from)
    if date_to:
        query = query.filter(Transaction.transaction_date <= date_to)
    
    # Get total count before pagination
    total = query.count()
    
    # Apply sorting (default to newest first)
    if sort_by:
        sort_column = getattr(Transaction, sort_by, Transaction.transaction_date)
    else:
        sort_column = Transaction.transaction_date
    
    if sort_order == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))
    
    # Apply pagination
    offset = (page - 1) * page_size
    transactions = query.offset(offset).limit(page_size).all()
    
    return PaginatedResponse(
        items=transactions,
        pagination=calculate_pagination(total, page, page_size)
    )


# Get recent transactions
@router.get("/recent", response_model=list[TransactionSchema])
def get_recent_transactions(
    days: int = Query(7, ge=1, le=365, description="Number of days to look back"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of transactions"),
    db: Session = Depends(get_db)
):
    """Get recent transactions from the last N days."""
    date_threshold = datetime.utcnow() - timedelta(days=days)
    transactions = db.query(Transaction).filter(
        Transaction.transaction_date >= date_threshold
    ).order_by(desc(Transaction.transaction_date)).limit(limit).all()
    return transactions


# Create transaction
@router.post("/", response_model=TransactionSchema)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    """Create a new transaction."""
    # Verify vendor exists
    vendor = db.query(Vendor).filter(Vendor.id == transaction.vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Verify product exists
    product = db.query(Product).filter(Product.id == transaction.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if enough stock
    if product.quantity < transaction.quantity:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient stock. Available: {product.quantity}, Requested: {transaction.quantity}"
        )
    
    # Create transaction
    db_transaction = Transaction(**transaction.dict())
    db.add(db_transaction)
    
    # Update product quantity
    product.quantity -= transaction.quantity
    db.add(product)
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


# Get transaction by ID
@router.get("/{transaction_id}", response_model=TransactionSchema)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Get a transaction by ID."""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


# Update transaction
@router.put("/{transaction_id}", response_model=TransactionSchema)
def update_transaction(transaction_id: int, transaction: TransactionUpdate, db: Session = Depends(get_db)):
    """Update a transaction."""
    db_transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    update_data = transaction.dict(exclude_unset=True)
    
    # Verify vendor exists if updating vendor_id
    if "vendor_id" in update_data:
        vendor = db.query(Vendor).filter(Vendor.id == update_data["vendor_id"]).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Verify product exists if updating product_id
    if "product_id" in update_data:
        product = db.query(Product).filter(Product.id == update_data["product_id"]).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in update_data.items():
        setattr(db_transaction, key, value)
    
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


# Delete transaction
@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Delete a transaction."""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(transaction)
    db.commit()
    return {"message": "Transaction deleted successfully"}