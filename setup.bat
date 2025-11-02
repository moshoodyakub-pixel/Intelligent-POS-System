@echo off
REM =============================================
REM Intelligent POS System - Windows Setup
REM =============================================
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Intelligent POS System Setup
echo ========================================
echo.

REM Create directories
echo [*] Creating directory structure...
if not exist backend\app\models mkdir backend\app\models
if not exist backend\app\api mkdir backend\app\api
if not exist backend\database mkdir backend\database
if not exist frontend\web\src mkdir frontend\web\src
if not exist frontend\web\public mkdir frontend\web\public
if not exist frontend\mobile mkdir frontend\mobile
if not exist scripts mkdir scripts
if not exist datasets\synthetic mkdir datasets\synthetic
if not exist datasets\transformed mkdir datasets\transformed
if not exist assets\barcodes mkdir assets\barcodes
echo [OK] Directories created!
echo.

REM Create Python init files
echo [*] Creating Python __init__ files...
(echo """Backend application package""") > backend\app\__init__.py
(echo """Models package""") > backend\app\models\__init__.py
(echo """API package initialization""") > backend\app\api\__init__.py
echo [OK] Init files created!
echo.

REM Create database.py
echo [*] Creating database.py...
(
echo from sqlalchemy import create_engine
echo from sqlalchemy.orm import sessionmaker, Session
echo from app.config import settings
echo.
echo engine = create_engine(
echo     settings.database_url,
echo     echo=False,
echo     pool_pre_ping=True,
echo     pool_size=20,
echo     max_overflow=40
echo )
echo.
echo SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
echo.
echo def get_db():
echo     db = SessionLocal()
echo     try:
echo         yield db
echo     finally:
echo         db.close()
) > backend\app\database.py
echo [OK] database.py created!
echo.

REM Create schemas.py
echo [*] Creating schemas.py...
(
echo from pydantic import BaseModel
echo from typing import Optional, List
echo from datetime import datetime
echo.
echo class ProductBase(BaseModel):
echo     name: str
echo     description: Optional[str] = None
echo     price: float
echo     vendor_id: int
echo.
echo class ProductCreate(ProductBase):
echo     pass
echo.
echo class Product(ProductBase):
echo     id: int
echo     class Config:
echo         from_attributes = True
echo.
echo class VendorBase(BaseModel):
echo     name: str
echo     contact_info: Optional[str] = None
echo.
echo class VendorCreate(VendorBase):
echo     pass
echo.
echo class Vendor(VendorBase):
echo     id: int
echo     class Config:
echo         from_attributes = True
echo.
echo class CustomerBase(BaseModel):
echo     name: str
echo     email: Optional[str] = None
echo     phone: Optional[str] = None
echo.
echo class CustomerCreate(CustomerBase):
echo     pass
echo.
echo class Customer(CustomerBase):
echo     id: int
echo     class Config:
echo         from_attributes = True
echo.
echo class TransactionItemSchema(BaseModel):
echo     product_id: int
echo     quantity: int
echo     price: float
echo.
echo class TransactionBase(BaseModel):
echo     customer_id: Optional[int] = None
echo     total_amount: float
echo.
echo class TransactionCreate(TransactionBase):
echo     items: List[TransactionItemSchema]
echo.
echo class Transaction(TransactionBase):
echo     id: int
echo     date: datetime
echo     class Config:
echo         from_attributes = True
echo.
echo class UserBase(BaseModel):
echo     username: str
echo     email: Optional[str] = None
echo.
echo class UserCreate(UserBase):
echo     password: str
echo.
echo class User(UserBase):
echo     id: int
echo     class Config:
echo         from_attributes = True
echo.
echo class TokenResponse(BaseModel):
echo     access_token: str
echo     token_type: str = "bearer"
echo     expires_in: int
echo.
echo class LoginRequest(BaseModel):
echo     username: str
echo     password: str
) > backend\app\models\schemas.py
echo [OK] schemas.py created!
echo.

REM Create main.py (FastAPI application)
echo [*] Creating main.py...
(
echo from fastapi import FastAPI
echo from fastapi.middleware.cors import CORSMiddleware
echo from fastapi.responses import JSONResponse
echo from app.config import settings
echo from app.api import products, transactions, auth
echo from app.database import engine
echo from app.models.db import Base
echo.
echo Base.metadata.create_all(bind=engine)
echo.
echo app = FastAPI(
echo     title="Intelligent POS System",
echo     version="1.0.0",
echo     description="Intelligent Multi-Vendor POS System",
echo     docs_url="/api/docs",
echo     openapi_url="/api/openapi.json"
echo )
echo.
echo cors_origins = getattr(settings, 'cors_origins', ["http://localhost:3000", "http://localhost:8081"])
echo app.add_middleware(
echo     CORSMiddleware,
echo     allow_origins=cors_origins,
echo     allow_credentials=True,
echo     allow_methods=["*"],
echo     allow_headers=["*"],
echo )
echo.
echo app.include_router(auth.router)
echo app.include_router(products.router)
echo app.include_router(transactions.router)
echo.
echo @app.get("/")
echo def root():
echo     return {
echo         "message": "Welcome to Intelligent POS System API",
echo         "version": "1.0.0",
echo         "status": "running",
echo         "docs": "/api/docs"
echo     }
echo.
echo @app.get("/health")
echo def health_check():
echo     return {
echo         "status": "healthy",
echo         "app": "Intelligent POS System",
echo         "environment": "development"
echo     }
echo.
echo @app.exception_handler(Exception)
echo async def general_exception_handler(request, exc):
echo     return JSONResponse(
echo         status_code=500,
echo         content={"detail": "Internal server error", "error": str(exc)}
echo     )
echo.
echo if __name__ == "__main__":
echo     import uvicorn
echo     uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
) > backend\app\main.py
echo [OK] main.py created!
echo.

REM Create auth.py
echo [*] Creating auth.py...
(
echo from fastapi import APIRouter, Depends, HTTPException, status
echo from sqlalchemy.orm import Session
echo from datetime import timedelta
echo from jose import JWTError, jwt
echo from passlib.context import CryptContext
echo from fastapi.security import HTTPBearer, HTTPAuthCredentials
echo from app.database import get_db
echo from app.models import db as models
echo from app.models.schemas import User, UserCreate, LoginRequest, TokenResponse
echo from app.config import settings
echo.
echo router = APIRouter(prefix="/api/auth", tags=["authentication"])
echo pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
echo security = HTTPBearer()
echo.
echo def verify_password(plain_password: str, hashed_password: str) ^> bool:
echo     return pwd_context.verify(plain_password, hashed_password)
echo.
echo def get_password_hash(password: str) ^> str:
echo     return pwd_context.hash(password)
echo.
echo def create_access_token(data: dict, expires_delta: timedelta = None) ^> str:
echo     to_encode = data.copy()
echo     if expires_delta:
echo         expire = timedelta(hours=settings.jwt_expiration_hours)
echo     else:
echo         expire = timedelta(hours=24)
echo     to_encode.update({"exp": expire})
echo     encoded_jwt = jwt.encode(to_encode, str(settings.jwt_secret), algorithm=settings.jwt_algorithm)
echo     return encoded_jwt
echo.
echo @router.post("/register", response_model=User)
echo def register(user: UserCreate, db: Session = Depends(get_db)):
echo     db_user = db.query(models.User).filter(models.User.username == user.username).first()
echo     if db_user:
echo         raise HTTPException(status_code=400, detail="Username already registered")
echo     hashed_password = get_password_hash(user.password)
echo     db_user = models.User(username=user.username, password=hashed_password)
echo     db.add(db_user)
echo     db.commit()
echo     db.refresh(db_user)
echo     return db_user
echo.
echo @router.post("/login", response_model=TokenResponse)
echo def login(credentials: LoginRequest, db: Session = Depends(get_db)):
echo     user = db.query(models.User).filter(models.User.username == credentials.username).first()
echo     if not user or not verify_password(credentials.password, user.password):
echo         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
echo     access_token = create_access_token(data={"sub": user.username, "user_id": user.id})
echo     return TokenResponse(access_token=access_token, expires_in=settings.jwt_expiration_hours * 3600)
echo.
echo @router.get("/me", response_model=User)
echo def get_current_user(credentials: HTTPAuthCredentials = Depends(security), db: Session = Depends(get_db)):
echo     token = credentials.credentials
echo     try:
echo         payload = jwt.decode(token, str(settings.jwt_secret), algorithms=[settings.jwt_algorithm])
echo         username: str = payload.get("sub")
echo         if username is None:
echo             raise HTTPException(status_code=401, detail="Invalid token")
echo     except JWTError:
echo         raise HTTPException(status_code=401, detail="Invalid token")
echo     user = db.query(models.User).filter(models.User.username == username).first()
echo     if user is None:
echo         raise HTTPException(status_code=401, detail="User not found")
echo     return user
) > backend\app\api\auth.py
echo [OK] auth.py created!
echo.

REM Create products.py
echo [*] Creating products.py...
(
echo from fastapi import APIRouter, Depends, HTTPException
echo from sqlalchemy.orm import Session
echo from app.database import get_db
echo from app.models import db as models
echo from app.models.schemas import Product, ProductCreate
echo.
echo router = APIRouter(prefix="/api/products", tags=["products"])
echo.
echo @router.get("/", response_model=list)
echo def list_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
echo     products = db.query(models.Product).offset(skip).limit(limit).all()
echo     return products
echo.
echo @router.get("/{product_id}")
echo def get_product(product_id: int, db: Session = Depends(get_db)):
echo     product = db.query(models.Product).filter(models.Product.id == product_id).first()
echo     if not product:
echo         raise HTTPException(status_code=404, detail="Product not found")
echo     return product
echo.
echo @router.post("/")
echo def create_product(product: ProductCreate, db: Session = Depends(get_db)):
echo     db_product = models.Product(**product.dict())
echo     db.add(db_product)
echo     db.commit()
echo     db.refresh(db_product)
echo     return db_product
echo.
echo @router.put("/{product_id}")
echo def update_product(product_id: int, product: ProductCreate, db: Session = Depends(get_db)):
echo     db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
echo     if not db_product:
echo         raise HTTPException(status_code=404, detail="Product not found")
echo     for key, value in product.dict().items():
echo         setattr(db_product, key, value)
echo     db.commit()
echo     db.refresh(db_product)
echo     return db_product
echo.
echo @router.delete("/{product_id}")
echo def delete_product(product_id: int, db: Session = Depends(get_db)):
echo     db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
echo     if not db_product:
echo         raise HTTPException(status_code=404, detail="Product not found")
echo     db.delete(db_product)
echo     db.commit()
echo     return {"message": "Product deleted successfully"}
echo.
echo @router.get("/search/{query}")
echo def search_products(query: str, db: Session = Depends(get_db)):
echo     products = db.query(models.Product).filter(
echo         (models.Product.name.ilike(f"%{query}%")) ^|
echo         (models.Product.description.ilike(f"%{query}%"))
echo     ).all()
echo     return products
) > backend\app\api\products.py
echo [OK] products.py created!
echo.

REM Create transactions.py
echo [*] Creating transactions.py...
(
echo from fastapi import APIRouter, Depends, HTTPException
echo from sqlalchemy.orm import Session
echo from datetime import datetime
echo from app.database import get_db
echo from app.models import db as models
echo from app.models.schemas import Transaction, TransactionCreate
echo.
echo router = APIRouter(prefix="/api/transactions", tags=["transactions"])
echo.
echo @router.get("/", response_model=list)
echo def list_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
echo     transactions = db.query(models.Transaction).offset(skip).limit(limit).all()
echo     return transactions
echo.
echo @router.get("/{transaction_id}")
echo def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
echo     transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
echo     if not transaction:
echo         raise HTTPException(status_code=404, detail="Transaction not found")
echo     return transaction
echo.
echo @router.post("/")
echo def create_transaction(transaction_data: TransactionCreate, db: Session = Depends(get_db)):
echo     db_transaction = models.Transaction(
echo         customer_id=transaction_data.customer_id,
echo         total_amount=transaction_data.total_amount,
echo         date=datetime.utcnow()
echo     )
echo     db.add(db_transaction)
echo     db.commit()
echo     db.refresh(db_transaction)
echo.
echo     for item in transaction_data.items:
echo         db_item = models.TransactionItem(
echo             transaction_id=db_transaction.id,
echo             product_id=item.product_id,
echo             quantity=item.quantity,
echo             price=item.price
echo         )
echo         db.add(db_item)
echo.
echo     db.commit()
echo     db.refresh(db_transaction)
echo     return db_transaction
echo.
echo @router.get("/{transaction_id}/receipt")
echo def get_receipt(transaction_id: int, db: Session = Depends(get_db)):
echo     transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
echo     if not transaction:
echo         raise HTTPException(status_code=404, detail="Transaction not found")
echo     items = db.query(models.TransactionItem).filter(
echo         models.TransactionItem.transaction_id == transaction_id
echo     ).all()
echo     return {
echo         "transaction_id": transaction.id,
echo         "date": transaction.date,
echo         "total_amount": transaction.total_amount,
echo         "items": items
echo     }
) > backend\app\api\transactions.py
echo [OK] transactions.py created!
echo.

REM Create pytest.ini
echo [*] Creating pytest.ini...
(
echo [pytest]
echo minversion = 7.0
echo testpaths = tests
echo python_files = test_*.py
echo python_classes = Test*
echo python_functions = test_*
echo addopts = -v --strict-markers --tb=short
echo markers =
echo     unit: Unit tests
echo     integration: Integration tests
echo     slow: Slow running tests
echo     api: API endpoint tests
echo asyncio_mode = auto
) > pytest.ini
echo [OK] pytest.ini created!
echo.

REM Create React frontend files
echo [*] Creating React web frontend...
(
echo {
echo   "name": "intelligent-pos-web",
echo   "version": "1.0.0",
echo   "description": "React web application for Intelligent POS System",
echo   "private": true,
echo   "dependencies": {
echo     "react": "^18.2.0",
echo     "react-dom": "^18.2.0",
echo     "axios": "^1.6.0",
echo     "react-scripts": "5.0.1"
echo   },
echo   "scripts": {
echo     "start": "react-scripts start",
echo     "build": "react-scripts build",
echo     "test": "react-scripts test",
echo     "eject": "react-scripts eject"
echo   }
echo }
) > frontend\web\package.json
echo [OK] React package.json created!
echo.

REM Create React Native frontend
echo [*] Creating React Native mobile...
(
echo {
echo   "name": "IntelligentPOS",
echo   "version": "1.0.0",
echo   "description": "Intelligent Multi-Vendor POS System Mobile App",
echo   "main": "node_modules/expo/AppEntry.js",
echo   "scripts": {
echo     "start": "expo start",
echo     "android": "expo start --android",
echo     "ios": "expo start --ios",
echo     "web": "expo start --web"
echo   },
echo   "dependencies": {
echo     "react": "18.2.0",
echo     "react-native": "0.72.0",
echo     "expo": "~49.0.0",
echo     "axios": "^1.6.0"
echo   }
echo }
) > frontend\mobile\package.json
echo [OK] React Native package.json created!
echo.

echo.
echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo Files created:
echo   - backend\app\*.py (7 files)
echo   - frontend\web\package.json
echo   - frontend\mobile\package.json
echo   - pytest.ini
echo.
echo Next Steps:
echo   1. cd backend
echo   2. pip install -r requirements.txt
echo   3. cd ..
echo   4. docker-compose up -d
echo   5. cd backend
echo   6. python -m uvicorn app.main:app --reload
echo.
pause