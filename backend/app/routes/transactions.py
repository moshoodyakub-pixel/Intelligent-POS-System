from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from typing import Optional
from datetime import datetime, timedelta
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable

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


# Generate receipt for a transaction
@router.get("/{transaction_id}/receipt")
def generate_receipt(transaction_id: int, db: Session = Depends(get_db)):
    """
    Generate a printable PDF receipt for a transaction.
    
    - **transaction_id**: The ID of the transaction
    """
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    product = db.query(Product).filter(Product.id == transaction.product_id).first()
    vendor = db.query(Vendor).filter(Vendor.id == transaction.vendor_id).first()
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=(4*inch, 8*inch),  # Receipt size
        topMargin=0.3*inch, 
        bottomMargin=0.3*inch,
        leftMargin=0.3*inch,
        rightMargin=0.3*inch
    )
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'ReceiptTitle',
        parent=styles['Heading1'],
        fontSize=14,
        alignment=1,  # Center
        spaceAfter=6
    )
    center_style = ParagraphStyle(
        'Center',
        parent=styles['Normal'],
        fontSize=9,
        alignment=1
    )
    normal_style = ParagraphStyle(
        'ReceiptNormal',
        parent=styles['Normal'],
        fontSize=9
    )
    
    # Header
    elements.append(Paragraph("🎯 Intelligent POS System", title_style))
    elements.append(Paragraph("SALES RECEIPT", center_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.black))
    elements.append(Spacer(1, 10))
    
    # Transaction details
    elements.append(Paragraph(f"<b>Receipt #:</b> {transaction.id}", normal_style))
    elements.append(Paragraph(
        f"<b>Date:</b> {transaction.transaction_date.strftime('%Y-%m-%d %H:%M')}",
        normal_style
    ))
    elements.append(Paragraph(f"<b>Vendor:</b> {vendor.name if vendor else 'N/A'}", normal_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    elements.append(Spacer(1, 10))
    
    # Item details
    item_data = [
        ["Item", "Qty", "Price"],
        [
            product.name if product else "Unknown",
            str(transaction.quantity),
            f"${product.price if product else 0:.2f}"
        ]
    ]
    
    item_table = Table(item_data, colWidths=[1.8*inch, 0.6*inch, 0.8*inch])
    item_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black)
    ]))
    elements.append(item_table)
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    elements.append(Spacer(1, 10))
    
    # Total
    total_style = ParagraphStyle(
        'TotalStyle',
        parent=styles['Normal'],
        fontSize=12,
        alignment=2  # Right
    )
    elements.append(Paragraph(f"<b>TOTAL: ${transaction.total_price:.2f}</b>", total_style))
    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.black))
    elements.append(Spacer(1, 15))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        alignment=1,
        textColor=colors.grey
    )
    elements.append(Paragraph("Thank you for your purchase!", center_style))
    elements.append(Spacer(1, 5))
    elements.append(Paragraph("Intelligent POS System", footer_style))
    elements.append(Paragraph("www.intelligent-pos.com", footer_style))
    
    doc.build(elements)
    buffer.seek(0)
    
    filename = f"receipt_{transaction_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# Get receipt data as JSON (for frontend rendering)
@router.get("/{transaction_id}/receipt-data")
def get_receipt_data(transaction_id: int, db: Session = Depends(get_db)):
    """
    Get receipt data as JSON for frontend rendering.
    
    - **transaction_id**: The ID of the transaction
    """
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    product = db.query(Product).filter(Product.id == transaction.product_id).first()
    vendor = db.query(Vendor).filter(Vendor.id == transaction.vendor_id).first()
    
    return {
        "receipt_number": transaction.id,
        "transaction_date": transaction.transaction_date.isoformat(),
        "vendor": {
            "id": vendor.id if vendor else None,
            "name": vendor.name if vendor else "N/A"
        },
        "item": {
            "id": product.id if product else None,
            "name": product.name if product else "Unknown",
            "quantity": transaction.quantity,
            "unit_price": product.price if product else 0
        },
        "total_price": transaction.total_price,
        "company": {
            "name": "Intelligent POS System",
            "website": "www.intelligent-pos.com"
        }
    }