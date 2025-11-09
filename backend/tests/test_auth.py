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

class TestAuth(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.client = TestClient(app)

    def tearDown(self):
        Base.metadata.drop_all(bind=engine)

    def test_register(self):
        response = self.client.post("/api/auth/register", json={"username": "testuser", "password": "testpassword"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertEqual(response.json()["token_type"], "bearer")

    def test_login(self):
        self.client.post("/api/auth/register", json={"username": "testuser", "password": "testpassword"})
        response = self.client.post("/api/auth/login", json={"username": "testuser", "password": "testpassword"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertEqual(response.json()["token_type"], "bearer")

if __name__ == "__main__":
    unittest.main()
