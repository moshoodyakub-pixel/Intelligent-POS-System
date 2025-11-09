import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

class TestVendors(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.client = TestClient(app)
        self.client.post("/api/auth/register", json={"username": "testuser", "password": "testpassword"})
        response = self.client.post("/api/auth/login", json={"username": "testuser", "password": "testpassword"})
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self):
        Base.metadata.drop_all(bind=engine)

    def test_create_vendor(self):
        response = self.client.post("/api/vendors/", headers=self.headers, json={"name": "Test Vendor", "email": "test@vendor.com", "phone": "1234567890", "address": "Test Address"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Test Vendor")

    def test_get_vendors(self):
        response = self.client.get("/api/vendors/", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

if __name__ == "__main__":
    unittest.main()
