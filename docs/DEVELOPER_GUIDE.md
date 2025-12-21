# Developer Guide - Intelligent POS System

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Backend Development](#backend-development)
5. [Frontend Development](#frontend-development)
6. [Database](#database)
7. [Testing](#testing)
8. [API Development](#api-development)
9. [Deployment](#deployment)
10. [Contributing](#contributing)

---

## Architecture Overview

The Intelligent POS System follows a modern three-tier architecture:

```
┌─────────────────────────────────────────────┐
│         Frontend (React 18)                 │
│  • Single Page Application                  │
│  • Components: Dashboard, Products, etc.    │
│  • State Management: React Context          │
│  • HTTP Client: Axios                       │
└─────────────────┬───────────────────────────┘
                  │ REST API (JSON)
┌─────────────────▼───────────────────────────┐
│         Backend (FastAPI)                   │
│  • RESTful API                              │
│  • JWT Authentication                       │
│  • Rate Limiting                            │
│  • ARIMA Forecasting                        │
└─────────────────┬───────────────────────────┘
                  │ SQLAlchemy ORM
┌─────────────────▼───────────────────────────┐
│         Database (SQLite/PostgreSQL)        │
│  • Products, Vendors, Transactions          │
│  • Users, Forecasts, Customers              │
└─────────────────────────────────────────────┘
```

### Key Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 | UI Framework |
| Frontend | React Router | Client-side routing |
| Frontend | Axios | HTTP client |
| Frontend | Chart.js | Data visualization |
| Backend | FastAPI | Web framework |
| Backend | SQLAlchemy | ORM |
| Backend | Pydantic | Data validation |
| Backend | statsmodels | ARIMA forecasting |
| Backend | JWT (python-jose) | Authentication |
| Database | SQLite/PostgreSQL | Data persistence |
| DevOps | Docker | Containerization |

---

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git
- Docker (optional)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Unix/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Run the development server
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Docker Setup

```bash
# Build and run all services
docker compose up --build

# Run in background
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

---

## Project Structure

```
Intelligent-POS-System/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application entry
│   │   ├── config.py            # Configuration settings
│   │   ├── database.py          # Database setup
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # Authentication utilities
│   │   ├── middleware.py        # Custom middleware
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── products.py      # Products CRUD
│   │   │   ├── vendors.py       # Vendors CRUD
│   │   │   ├── transactions.py  # Transactions CRUD
│   │   │   ├── forecasting.py   # ARIMA forecasting
│   │   │   └── reports.py       # Reports & analytics
│   │   └── tests/
│   │       ├── conftest.py      # Test configuration
│   │       └── test_*.py        # Test files
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── contexts/            # React contexts
│   │   ├── services/            # API services
│   │   ├── App.js               # Main App component
│   │   └── index.js             # Entry point
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── USER_MANUAL.md
│   ├── DEVELOPER_GUIDE.md
│   └── DATABASE_SCHEMA.md
├── docker-compose.yml
└── README.md
```

---

## Backend Development

### Adding a New Endpoint

1. **Define the Schema** (`schemas.py`):

```python
class NewFeatureBase(BaseModel):
    name: str
    value: int

class NewFeatureCreate(NewFeatureBase):
    pass

class NewFeature(NewFeatureBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
```

2. **Create the Model** (`models.py`):

```python
class NewFeature(Base):
    __tablename__ = "new_features"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    value = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
```

3. **Create the Router** (`routes/new_feature.py`):

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import NewFeature
from ..schemas import NewFeatureCreate, NewFeature as NewFeatureSchema

router = APIRouter(prefix="/api/new-features", tags=["new-features"])

@router.get("/", response_model=list[NewFeatureSchema])
def get_all(db: Session = Depends(get_db)):
    return db.query(NewFeature).all()

@router.post("/", response_model=NewFeatureSchema)
def create(data: NewFeatureCreate, db: Session = Depends(get_db)):
    db_item = NewFeature(**data.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
```

4. **Register the Router** (`main.py`):

```python
from .routes import new_feature
app.include_router(new_feature.router)
```

### Configuration Management

Environment variables are managed through `config.py`:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./pos_system.db"
    SECRET_KEY: str = "your-secret-key"
    RATE_LIMIT_REQUESTS: int = 100
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### Middleware

Custom middleware is defined in `middleware.py`:

- **RateLimitMiddleware** - Limits requests per IP
- **ErrorHandlingMiddleware** - Global error handling
- **RequestLoggingMiddleware** - Request/response logging

### Authentication

JWT-based authentication is handled in `auth.py`:

```python
from .auth import get_current_user, require_admin

@router.get("/protected")
async def protected_route(user = Depends(get_current_user)):
    return {"message": f"Hello, {user.username}"}

@router.delete("/admin-only")
async def admin_route(user = Depends(require_admin)):
    return {"message": "Admin action completed"}
```

---

## Frontend Development

### Component Structure

Components follow a consistent pattern:

```jsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './ComponentName.css';

export default function ComponentName() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/endpoint');
      setData(response.data.items);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="component-container">
      {/* Component content */}
    </div>
  );
}
```

### API Service

The API service (`services/api.js`) handles all HTTP requests:

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);
```

### State Management

Global state is managed using React Context:

```jsx
// contexts/AuthContext.js
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  const login = async (credentials) => { /* ... */ };
  const logout = () => { /* ... */ };
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Styling

CSS follows BEM-like naming conventions:

```css
.component-container { /* Container styles */ }
.component-header { /* Header styles */ }
.component-list { /* List styles */ }
.component-list__item { /* List item styles */ }
.component-list__item--active { /* Active state */ }
```

---

## Database

### Models

SQLAlchemy models are defined in `models.py`:

```python
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    quantity = Column(Integer)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    
    vendor = relationship("Vendor", back_populates="products")
```

### Migrations

For production, use Alembic for database migrations:

```bash
# Initialize Alembic
alembic init migrations

# Create migration
alembic revision --autogenerate -m "Add new feature"

# Apply migrations
alembic upgrade head
```

### Query Examples

```python
# Basic queries
products = db.query(Product).all()
product = db.query(Product).filter(Product.id == 1).first()

# With filtering and pagination
products = db.query(Product)\
    .filter(Product.price >= 10)\
    .order_by(Product.name)\
    .offset(0)\
    .limit(10)\
    .all()

# Aggregations
from sqlalchemy import func
total = db.query(func.sum(Transaction.total_price)).scalar()
```

---

## Testing

### Backend Tests

```bash
cd backend
pytest

# With coverage
pytest --cov=app --cov-report=html

# Run specific test
pytest app/tests/test_products.py -v
```

### Writing Tests

```python
# tests/test_products.py
def test_create_product(client, created_vendor):
    product_data = {
        "name": "Test Product",
        "price": 29.99,
        "quantity": 100,
        "vendor_id": created_vendor["id"]
    }
    response = client.post("/api/products/", json=product_data)
    assert response.status_code == 200
    assert response.json()["name"] == "Test Product"
```

### Frontend Tests

```bash
cd frontend
npm test

# With coverage
npm test -- --coverage
```

---

## API Development

### Adding Pagination

Use the shared pagination helper:

```python
from ..schemas import PaginatedResponse, PaginationMeta

def calculate_pagination(total: int, page: int, page_size: int) -> PaginationMeta:
    total_pages = (total + page_size - 1) // page_size
    return PaginationMeta(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )
```

### Error Handling

Use HTTPException for consistent error responses:

```python
from fastapi import HTTPException

if not item:
    raise HTTPException(status_code=404, detail="Item not found")

if not authorized:
    raise HTTPException(status_code=403, detail="Insufficient permissions")
```

---

## Deployment

### Docker Production Build

```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Deploy
docker compose -f docker-compose.prod.yml up -d
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | Database connection string | sqlite:///./pos_system.db |
| SECRET_KEY | JWT secret key | (required) |
| CORS_ORIGINS | Allowed origins | * |
| RATE_LIMIT_REQUESTS | Requests per window | 100 |
| DEBUG | Enable debug mode | false |

### Health Checks

The application provides health check endpoints:

- `GET /` - Basic status
- `GET /health` - Detailed health check

---

## Contributing

### Code Style

- **Python**: Follow PEP 8, use type hints
- **JavaScript**: Follow ESLint configuration
- **Commits**: Use conventional commit messages

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit PR with description

### Code Review Checklist

- [ ] Tests pass
- [ ] No linting errors
- [ ] Documentation updated
- [ ] No security vulnerabilities

---

*Last Updated: December 2025*
