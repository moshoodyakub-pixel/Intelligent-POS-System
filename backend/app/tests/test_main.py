"""
Tests for the main application endpoints (health checks, root).
"""
import pytest


class TestHealthEndpoints:
    """Test suite for health check and root endpoints."""

    def test_root_endpoint(self, client):
        """Test the root endpoint returns welcome message."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Welcome to Intelligent POS System"
        assert data["version"] == "1.0.0"
        assert data["status"] == "running"

    def test_health_check(self, client):
        """Test the health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["message"] == "API is running"


class TestAPIDocumentation:
    """Test that API documentation endpoints are accessible."""

    def test_openapi_schema(self, client):
        """Test OpenAPI schema is accessible."""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert data["info"]["title"] == "Intelligent POS System"
        assert data["info"]["version"] == "1.0.0"

    def test_swagger_docs(self, client):
        """Test Swagger UI is accessible."""
        response = client.get("/docs")
        assert response.status_code == 200

    def test_redoc_docs(self, client):
        """Test ReDoc is accessible."""
        response = client.get("/redoc")
        assert response.status_code == 200
