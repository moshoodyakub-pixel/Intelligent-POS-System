from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc
from typing import Optional
from ..database import get_db
from ..models import Vendor
from ..schemas import VendorCreate, VendorUpdate, Vendor as VendorSchema, PaginatedResponse, PaginationMeta
from ..config import settings

router = APIRouter(prefix="/api/vendors", tags=["vendors"])


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


# Get all vendors with pagination, search, and sorting
@router.get("/", response_model=PaginatedResponse[VendorSchema])
def get_vendors(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(None, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search in name, email, and address"),
    sort_by: Optional[str] = Query(None, enum=["name", "email", "created_at"], description="Sort field"),
    sort_order: Optional[str] = Query("asc", enum=["asc", "desc"], description="Sort order"),
    db: Session = Depends(get_db)
):
    """
    Get vendors with pagination, search, and sorting.
    
    - **page**: Page number (default: 1)
    - **page_size**: Number of items per page (default: 10, max: 100)
    - **search**: Search term for vendor name, email, and address
    - **sort_by**: Field to sort by
    - **sort_order**: Sort direction (asc/desc)
    """
    # Default page size
    if page_size is None:
        page_size = settings.DEFAULT_PAGE_SIZE
    
    # Base query
    query = db.query(Vendor)
    
    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Vendor.name.ilike(search_term),
                Vendor.email.ilike(search_term),
                Vendor.address.ilike(search_term)
            )
        )
    
    # Get total count before pagination
    total = query.count()
    
    # Apply sorting
    if sort_by:
        sort_column = getattr(Vendor, sort_by, Vendor.id)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
    
    # Apply pagination
    offset = (page - 1) * page_size
    vendors = query.offset(offset).limit(page_size).all()
    
    return PaginatedResponse(
        items=vendors,
        pagination=calculate_pagination(total, page, page_size)
    )


# Create vendor
@router.post("/", response_model=VendorSchema)
def create_vendor(vendor: VendorCreate, db: Session = Depends(get_db)):
    """Create a new vendor."""
    # Check if email already exists
    existing_vendor = db.query(Vendor).filter(Vendor.email == vendor.email).first()
    if existing_vendor:
        raise HTTPException(status_code=400, detail="Vendor with this email already exists")
    
    db_vendor = Vendor(**vendor.dict())
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor


# Get vendor by ID
@router.get("/{vendor_id}", response_model=VendorSchema)
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    """Get a vendor by ID."""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


# Update vendor
@router.put("/{vendor_id}", response_model=VendorSchema)
def update_vendor(vendor_id: int, vendor: VendorUpdate, db: Session = Depends(get_db)):
    """Update a vendor."""
    db_vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    update_data = vendor.dict(exclude_unset=True)
    
    # Check if updating email and it already exists
    if "email" in update_data:
        existing = db.query(Vendor).filter(
            Vendor.email == update_data["email"],
            Vendor.id != vendor_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Vendor with this email already exists")
    
    for key, value in update_data.items():
        setattr(db_vendor, key, value)
    
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor


# Delete vendor
@router.delete("/{vendor_id}")
def delete_vendor(vendor_id: int, db: Session = Depends(get_db)):
    """Delete a vendor."""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    db.delete(vendor)
    db.commit()
    return {"message": "Vendor deleted successfully"}