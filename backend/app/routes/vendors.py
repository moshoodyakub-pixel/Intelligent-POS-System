from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Vendor
from ..schemas import VendorCreate, VendorUpdate, Vendor as VendorSchema

router = APIRouter(prefix="/api/vendors", tags=["vendors"])

# Get all vendors
@router.get("/", response_model=list[VendorSchema])
def get_vendors(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    vendors = db.query(Vendor).offset(skip).limit(limit).all()
    return vendors

# Create vendor
@router.post("/", response_model=VendorSchema)
def create_vendor(vendor: VendorCreate, db: Session = Depends(get_db)):
    db_vendor = Vendor(**vendor.dict())
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

# Get vendor by ID
@router.get("/{vendor_id}", response_model=VendorSchema)
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor

# Update vendor
@router.put("/{vendor_id}", response_model=VendorSchema)
def update_vendor(vendor_id: int, vendor: VendorUpdate, db: Session = Depends(get_db)):
    db_vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    update_data = vendor.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_vendor, key, value)
    
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

# Delete vendor
@router.delete("/{vendor_id}")
def delete_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    db.delete(vendor)
    db.commit()
    return {"message": "Vendor deleted successfully"}