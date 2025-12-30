"""
Test configuration and fixtures for the Intelligent POS System backend tests.
"""
import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set testing environment before importing app modules
os.environ["TESTING"] = "1"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database import get_db
from app.models import Base, Vendor, Product, Transaction, SalesForecast, User
from app.auth import get_password_hash

# Create test database engine
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database override."""
    app.dependency_overrides[get_db] = lambda: db_session
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_vendor_data():
    """Sample vendor data for testing."""
    return {
        "name": "Test Vendor",
        "email": "test@vendor.com",
        "phone": "123-456-7890",
        "address": "123 Test Street"
    }


@pytest.fixture
def sample_product_data():
    """Sample product data for testing."""
    return {
        "name": "Test Product",
        "description": "A test product description",
        "price": 99.99,
        "quantity": 100,
        "vendor_id": 1
    }


@pytest.fixture
def sample_transaction_data():
    """Sample transaction data for testing."""
    return {
        "vendor_id": 1,
        "product_id": 1,
        "quantity": 5,
        "total_price": 499.95
    }


@pytest.fixture
def sample_forecast_data():
    """Sample forecast data for testing."""
    return {
        "product_id": 1,
        "forecasted_quantity": 150,
        "forecasted_price": 89.99
    }


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }


@pytest.fixture
def sample_admin_data():
    """Sample admin user data for testing."""
    return {
        "username": "adminuser",
        "email": "admin@example.com",
        "password": "adminpassword123",
        "full_name": "Admin User",
        "role": "admin"
    }


@pytest.fixture
def sample_vendor_user_data():
    """Sample vendor user data for testing."""
    return {
        "username": "vendoruser",
        "email": "vendor@example.com",
        "password": "vendorpassword123",
        "full_name": "Vendor User",
        "role": "vendor"
    }


@pytest.fixture
def sample_cashier_user_data():
    """Sample cashier user data for testing."""
    return {
        "username": "cashieruser",
        "email": "cashier@example.com",
        "password": "cashierpassword123",
        "full_name": "Cashier User",
        "role": "cashier"
    }


@pytest.fixture
def created_vendor(client, sample_vendor_data):
    """Create a vendor and return the response data."""
    response = client.post("/api/vendors/", json=sample_vendor_data)
    return response.json()


@pytest.fixture
def created_product(client, created_vendor, sample_product_data):
    """Create a product (requires vendor) and return the response data."""
    sample_product_data["vendor_id"] = created_vendor["id"]
    response = client.post("/api/products/", json=sample_product_data)
    return response.json()


@pytest.fixture
def registered_user(client, sample_user_data):
    """Register a user and return the response data."""
    response = client.post("/api/auth/register", json=sample_user_data)
    return response.json()


@pytest.fixture
def registered_admin(client, sample_admin_data):
    """Register an admin user and return the response data."""
    response = client.post("/api/auth/register", json=sample_admin_data)
    return response.json()


@pytest.fixture
def auth_headers(client, sample_user_data):
    """Get authentication headers for a regular user."""
    # Register user first
    client.post("/api/auth/register", json=sample_user_data)
    # Login and get token
    response = client.post(
        "/api/auth/login",
        data={"username": sample_user_data["username"], "password": sample_user_data["password"]}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers(client, sample_admin_data):
    """Get authentication headers for an admin user."""
    # Register admin first
    client.post("/api/auth/register", json=sample_admin_data)
    # Login and get token
    response = client.post(
        "/api/auth/login",
        data={"username": sample_admin_data["username"], "password": sample_admin_data["password"]}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def vendor_auth_headers(client, sample_vendor_user_data):
    """Get authentication headers for a vendor user."""
    # Register vendor first
    client.post("/api/auth/register", json=sample_vendor_user_data)
    # Login and get token
    response = client.post(
        "/api/auth/login",
        data={"username": sample_vendor_user_data["username"], "password": sample_vendor_user_data["password"]}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def cashier_auth_headers(client, sample_cashier_user_data):
    """Get authentication headers for a cashier user."""
    # Register cashier first
    client.post("/api/auth/register", json=sample_cashier_user_data)
    # Login and get token
    response = client.post(
        "/api/auth/login",
        data={"username": sample_cashier_user_data["username"], "password": sample_cashier_user_data["password"]}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
