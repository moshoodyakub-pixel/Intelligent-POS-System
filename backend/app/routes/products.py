from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc
from typing import Optional
from ..database import get_db
from ..models import Product, Vendor
from ..schemas import ProductCreate, ProductUpdate, Product as ProductSchema, PaginatedResponse, PaginationMeta
from ..config import settings

router = APIRouter(prefix="/api/products", tags=["products"])


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


# Get all products with pagination, search, filtering, and sorting
@router.get("/", response_model=PaginatedResponse[ProductSchema])
def get_products(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(None, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    vendor_id: Optional[int] = Query(None, description="Filter by vendor ID"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    min_quantity: Optional[int] = Query(None, ge=0, description="Minimum quantity filter"),
    sort_by: Optional[str] = Query(None, enum=["name", "price", "quantity", "created_at"], description="Sort field"),
    sort_order: Optional[str] = Query("asc", enum=["asc", "desc"], description="Sort order"),
    db: Session = Depends(get_db)
):
    """
    Get products with pagination, search, filtering, and sorting.
    
    - **page**: Page number (default: 1)
    - **page_size**: Number of items per page (default: 10, max: 100)
    - **search**: Search term for product name and description
    - **vendor_id**: Filter by vendor ID
    - **min_price/max_price**: Price range filter
    - **min_quantity**: Minimum quantity filter
    - **sort_by**: Field to sort by
    - **sort_order**: Sort direction (asc/desc)
    """
    # Default page size
    if page_size is None:
        page_size = settings.DEFAULT_PAGE_SIZE
    
    # Base query
    query = db.query(Product)
    
    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term)
            )
        )
    
    # Apply filters
    if vendor_id:
        query = query.filter(Product.vendor_id == vendor_id)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if min_quantity is not None:
        query = query.filter(Product.quantity >= min_quantity)
    
    # Get total count before pagination
    total = query.count()
    
    # Apply sorting
    if sort_by:
        sort_column = getattr(Product, sort_by, Product.id)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
    
    # Apply pagination
    offset = (page - 1) * page_size
    products = query.offset(offset).limit(page_size).all()
    
    return PaginatedResponse(
        items=products,
        pagination=calculate_pagination(total, page, page_size)
    )


# Get low stock products (inventory alert)
@router.get("/low-stock", response_model=list[ProductSchema])
def get_low_stock_products(
    threshold: int = Query(10, ge=0, description="Stock threshold for alerts"),
    db: Session = Depends(get_db)
):
    """Get products with quantity below the specified threshold."""
    products = db.query(Product).filter(Product.quantity <= threshold).all()
    return products


# Create product
@router.post("/", response_model=ProductSchema)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product."""
    # Verify vendor exists
    vendor = db.query(Vendor).filter(Vendor.id == product.vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


# Get product by ID
@router.get("/{product_id}", response_model=ProductSchema)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# Update product
@router.put("/{product_id}", response_model=ProductSchema)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    """Update a product."""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product.dict(exclude_unset=True)
    
    # Verify vendor exists if updating vendor_id
    if "vendor_id" in update_data:
        vendor = db.query(Vendor).filter(Vendor.id == update_data["vendor_id"]).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
    
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


# Delete product
@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}