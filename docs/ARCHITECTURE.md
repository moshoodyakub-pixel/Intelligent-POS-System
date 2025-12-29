# Intelligent POS System - Architecture Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTELLIGENT POS SYSTEM                          │
│                          Production Architecture                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     React Frontend (Port 3000)                       │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│   │  │  Dashboard  │  │  Products   │  │   Vendors   │  │Transactions│  │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│   │  │ Forecasting │  │    Login    │  │  Register   │  │   Theme    │  │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  Services: AuthContext | ThemeContext | API Service (Axios)         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│                           REST API (HTTP/HTTPS)                              │
│                                     ▼                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                  API LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                   FastAPI Backend (Port 8000)                        │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │                                                                      │   │
│   │  ┌─────────────────────────────────────────────────────────────┐    │   │
│   │  │                      Middleware Layer                        │    │   │
│   │  │  • Rate Limiting (100 req/min)  • CORS Configuration        │    │   │
│   │  │  • JWT Authentication           • Request Logging           │    │   │
│   │  └─────────────────────────────────────────────────────────────┘    │   │
│   │                                                                      │   │
│   │  ┌─────────────────────────────────────────────────────────────┐    │   │
│   │  │                       API Routes                             │    │   │
│   │  │                                                               │    │   │
│   │  │  /api/auth/*        - Authentication (Login, Register, JWT)  │    │   │
│   │  │  /api/products/*    - Product CRUD & Search                  │    │   │
│   │  │  /api/vendors/*     - Vendor CRUD & Search                   │    │   │
│   │  │  /api/transactions/*- Transaction CRUD & Receipts            │    │   │
│   │  │  /api/forecasting/* - ARIMA Sales Forecasting                │    │   │
│   │  │  /api/reports/*     - Reports, Analytics, PDF/Excel Export   │    │   │
│   │  │  /health            - Health Check                           │    │   │
│   │  │  /metrics           - Prometheus Metrics                     │    │   │
│   │  └─────────────────────────────────────────────────────────────┘    │   │
│   │                                                                      │   │
│   │  ┌─────────────────────────────────────────────────────────────┐    │   │
│   │  │                    Business Logic                            │    │   │
│   │  │  • Pydantic Schema Validation    • SQLAlchemy ORM            │    │   │
│   │  │  • ARIMA Forecasting (statsmodels)                          │    │   │
│   │  │  • PDF Generation (ReportLab)   • Excel Export (openpyxl)   │    │   │
│   │  └─────────────────────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│                           SQLAlchemy ORM                                     │
│                                     ▼                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                  PostgreSQL Database (Port 5432)                     │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │                                                                      │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│   │  │    Users    │  │  Products   │  │   Vendors   │  │Transactions│  │   │
│   │  │             │  │             │  │             │  │            │  │   │
│   │  │ • id        │  │ • id        │  │ • id        │  │ • id       │  │   │
│   │  │ • username  │  │ • name      │  │ • name      │  │ • vendor_id│  │   │
│   │  │ • email     │  │ • price     │  │ • email     │  │ • product_id│ │   │
│   │  │ • password  │  │ • quantity  │  │ • phone     │  │ • quantity │  │   │
│   │  │ • role      │  │ • vendor_id │  │ • address   │  │ • total    │  │   │
│   │  │ • is_active │  │ • description│ │ • created_at│  │ • date     │  │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │   │
│   │                                                                      │   │
│   │  ┌─────────────────────────────────┐  ┌────────────────────────────┐ │   │
│   │  │        SalesForecasts           │  │         Customers          │ │   │
│   │  │                                  │  │                            │ │   │
│   │  │ • id                             │  │ • id                       │ │   │
│   │  │ • product_id                     │  │ • name                     │ │   │
│   │  │ • forecasted_quantity            │  │ • email                    │ │   │
│   │  │ • forecasted_price               │  │ • phone                    │ │   │
│   │  │ • forecast_date                  │  │ • created_at               │ │   │
│   │  └─────────────────────────────────┘  └────────────────────────────┘ │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOCKER DEPLOYMENT                                  │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────┐
                    │        Docker Compose           │
                    │     (docker-compose.yml)        │
                    └──────────────┬──────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  pos-frontend   │    │   pos-backend   │    │     pos-db      │
│  (Nginx:80)     │    │  (Uvicorn:8000) │    │ (PostgreSQL:5432)│
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • React Build   │    │ • FastAPI App   │    │ • pos_db        │
│ • Static Files  │────│ • SQLAlchemy    │────│ • user/password │
│ • Reverse Proxy │    │ • ARIMA Engine  │    │ • Volume Mount  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
     Port 3000              Port 8000              Port 5432
                                                       │
                                                       ▼
                                            ┌─────────────────┐
                                            │  postgres_data  │
                                            │    (Volume)     │
                                            └─────────────────┘
```

## CI/CD Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GITHUB ACTIONS CI/CD PIPELINE                         │
└─────────────────────────────────────────────────────────────────────────────┘

    Push/PR to main
          │
          ▼
┌─────────────────┐
│   Checkout      │
│   Code          │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  test-backend   │ │  test-frontend  │ │ security-audit  │
│  (pytest)       │ │  (jest)         │ │ (npm audit)     │
└────────┬────────┘ └────────┬────────┘ └─────────────────┘
         │                   │
         └─────────┬─────────┘
                   │
                   ▼
         ┌─────────────────┐
         │    test-e2e     │
         │  (Playwright)   │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  build-docker   │
         │  (Docker Build) │
         └────────┬────────┘
                  │
          ┌───────┴───────┐
          │               │
          ▼               ▼
┌─────────────────┐ ┌─────────────────┐
│ Backend Image   │ │ Frontend Image  │
│ pos-backend     │ │ pos-frontend    │
└────────┬────────┘ └────────┬────────┘
         │                   │
         └─────────┬─────────┘
                   │
                   ▼ (on main branch)
         ┌─────────────────┐
         │   Deploy to     │
         │   Docker Hub    │
         └─────────────────┘
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        JWT AUTHENTICATION FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

  User                    Frontend                  Backend                 DB
   │                         │                        │                      │
   │  1. Login Request       │                        │                      │
   │  (username, password)   │                        │                      │
   │────────────────────────>│                        │                      │
   │                         │                        │                      │
   │                         │  2. POST /api/auth/login                      │
   │                         │───────────────────────>│                      │
   │                         │                        │                      │
   │                         │                        │  3. Verify User      │
   │                         │                        │─────────────────────>│
   │                         │                        │<─────────────────────│
   │                         │                        │                      │
   │                         │                        │  4. Hash Password    │
   │                         │                        │     Compare bcrypt   │
   │                         │                        │                      │
   │                         │  5. JWT Token          │                      │
   │                         │<───────────────────────│                      │
   │                         │                        │                      │
   │                         │  6. Store in           │                      │
   │                         │     localStorage       │                      │
   │                         │                        │                      │
   │  7. Redirect to         │                        │                      │
   │     Dashboard           │                        │                      │
   │<────────────────────────│                        │                      │
   │                         │                        │                      │
   │  8. Protected Request   │                        │                      │
   │────────────────────────>│                        │                      │
   │                         │                        │                      │
   │                         │  9. API Request with   │                      │
   │                         │     Authorization:     │                      │
   │                         │     Bearer <token>     │                      │
   │                         │───────────────────────>│                      │
   │                         │                        │                      │
   │                         │                        │  10. Validate JWT    │
   │                         │                        │      Check role      │
   │                         │                        │                      │
   │                         │  11. Response          │                      │
   │                         │<───────────────────────│                      │
   │                         │                        │                      │
   │  12. Display Data       │                        │                      │
   │<────────────────────────│                        │                      │
```

## ARIMA Forecasting Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ARIMA FORECASTING PIPELINE                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Historical    │    │     ARIMA       │    │    Forecast     │
│  Transaction    │───>│     Model       │───>│    Results      │
│     Data        │    │   (statsmodels) │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Aggregate daily │    │ Fit ARIMA(p,d,q)│    │ • predictions   │
│ sales data by   │    │ parameters      │    │ • confidence    │
│ product/vendor  │    │ automatically   │    │   intervals     │
└─────────────────┘    └─────────────────┘    │ • trend analysis│
                                              └─────────────────┘
                                                       │
                              ┌─────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Visualization  │
                    │  Bar Charts &   │
                    │  Forecast Table │
                    └─────────────────┘

Fallback Strategy:
┌─────────────────────────────────────────────────────────────────┐
│ If insufficient data (< 7 data points):                         │
│   → Use moving average as fallback prediction method            │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 18.x |
| Routing | React Router | 6.x |
| HTTP Client | Axios | ^1.x |
| Tables | react-table | ^7.x |
| Error Tracking | Sentry | ^7.x |
| Testing | Jest + React Testing Library | - |
| E2E Testing | Playwright | ^1.40 |

### Backend
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | FastAPI | 0.104+ |
| ORM | SQLAlchemy | 2.x |
| Validation | Pydantic | 2.x |
| Auth | python-jose (JWT) + bcrypt | - |
| Forecasting | statsmodels (ARIMA) | - |
| PDF Export | ReportLab | - |
| Excel Export | openpyxl | - |
| ASGI Server | Uvicorn | - |
| Testing | pytest | - |

### Database
| Component | Technology | Version |
|-----------|------------|---------|
| Production | PostgreSQL | 13+ |
| Development | SQLite | 3.x |

### DevOps
| Component | Technology |
|-----------|------------|
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Process Manager | Systemd |
| Reverse Proxy | Nginx (in container) |

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY LAYERS                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          NETWORK LAYER                                       │
│  • CORS Configuration (configurable origins)                                 │
│  • Rate Limiting (100 requests/minute per IP)                               │
│  • HTTPS in production (via reverse proxy)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AUTHENTICATION LAYER                                   │
│  • JWT Token-based authentication                                            │
│  • bcrypt password hashing                                                   │
│  • Token expiration (30 minutes default)                                     │
│  • Secure token storage (localStorage with proper handling)                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AUTHORIZATION LAYER                                    │
│  • Role-Based Access Control (RBAC)                                          │
│    - Admin: Full access (user management, all operations)                    │
│    - Staff: Limited access (CRUD on main entities)                           │
│  • Protected routes on frontend                                              │
│  • Endpoint protection on backend                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER SECURITY                                   │
│  • SQL Injection prevention (SQLAlchemy ORM)                                 │
│  • Input validation (Pydantic schemas)                                       │
│  • Parameterized queries                                                     │
│  • Database credentials via environment variables                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Environment Configuration

### Required Environment Variables

```bash
# Backend (.env)
DATABASE_URL=postgresql://user:password@localhost/pos_db  # Production
DATABASE_URL=sqlite:///./pos_system.db                    # Development

SECRET_KEY=your-secure-random-key-here                    # JWT signing key
ALGORITHM=HS256                                           # JWT algorithm
ACCESS_TOKEN_EXPIRE_MINUTES=30                            # Token lifetime

CORS_ORIGINS=https://your-frontend-domain.com             # Production
CORS_ORIGINS=*                                            # Development

# Optional
DEBUG=false
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60
SENTRY_DSN=your-sentry-dsn                                # Error tracking
```

### Docker Hub Secrets (for CD)
```
DOCKERHUB_USERNAME=your-username
DOCKERHUB_TOKEN=your-access-token
```

---

**Last Updated:** December 29, 2025
**Document Version:** 1.0
