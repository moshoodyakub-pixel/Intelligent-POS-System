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

    def test_health_check_includes_environment(self, client):
        """Test the health check endpoint includes environment."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "environment" in data


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


class TestMetricsEndpoint:
    """Test suite for Prometheus metrics endpoint."""

    def test_metrics_endpoint_accessible(self, client):
        """Test the metrics endpoint is accessible."""
        response = client.get("/metrics")
        assert response.status_code == 200
        assert "text/plain" in response.headers.get("content-type", "")

    def test_metrics_contains_http_metrics(self, client):
        """Test that metrics endpoint includes HTTP request metrics."""
        # Make a request first to generate some metrics
        client.get("/health")
        
        response = client.get("/metrics")
        assert response.status_code == 200
        
        content = response.text
        # Check for our custom metrics
        assert "http_requests_total" in content
        assert "http_request_duration_seconds" in content
        assert "http_5xx_errors_total" in content
        assert "http_requests_active" in content

    def test_metrics_contains_process_metrics(self, client):
        """Test that metrics endpoint includes process metrics."""
        response = client.get("/metrics")
        assert response.status_code == 200
        
        content = response.text
        # Check for default process metrics
        assert "process_resident_memory_bytes" in content or "python_info" in content
