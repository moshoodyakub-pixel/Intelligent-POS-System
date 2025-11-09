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

class TestProducts(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.client = TestClient(app)
        self.client.post("/api/auth/register", json={"username": "testuser", "password": "testpassword"})
        response = self.client.post("/api/auth/login", json={"username": "testuser", "password": "testpassword"})
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self):
        Base.metadata.drop_all(bind=engine)

    def test_create_product(self):
        response = self.client.post("/api/products/", headers=self.headers, json={"name": "Test Product", "description": "Test Description", "price": 10.0, "quantity": 100, "vendor_id": 1})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Test Product")

    def test_get_products(self):
        response = self.client.get("/api/products/", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

if __name__ == "__main__":
    unittest.main()
