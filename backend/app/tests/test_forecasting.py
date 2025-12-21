"""
Tests for the Forecasting API endpoints.
"""
import pytest


class TestForecastingAPI:
    """Test suite for Sales Forecasting CRUD operations."""

    def test_get_forecasts_empty(self, client):
        """Test getting forecasts when database is empty."""
        response = client.get("/api/forecasting/sales")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_forecast(self, client, created_product, sample_forecast_data):
        """Test creating a new forecast."""
        sample_forecast_data["product_id"] = created_product["id"]
        response = client.post("/api/forecasting/sales", json=sample_forecast_data)
        assert response.status_code == 200
        data = response.json()
        assert data["product_id"] == sample_forecast_data["product_id"]
        assert data["forecasted_quantity"] == sample_forecast_data["forecasted_quantity"]
        assert data["forecasted_price"] == sample_forecast_data["forecasted_price"]
        assert "id" in data
        assert "forecast_date" in data

    def test_get_forecasts_list(self, client, created_product, sample_forecast_data):
        """Test getting list of forecasts."""
        sample_forecast_data["product_id"] = created_product["id"]
        client.post("/api/forecasting/sales", json=sample_forecast_data)
        
        response = client.get("/api/forecasting/sales")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    def test_get_forecast_by_id(self, client, created_product, sample_forecast_data):
        """Test getting a specific forecast by ID."""
        sample_forecast_data["product_id"] = created_product["id"]
        create_response = client.post("/api/forecasting/sales", json=sample_forecast_data)
        forecast_id = create_response.json()["id"]
        
        response = client.get(f"/api/forecasting/sales/{forecast_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == forecast_id

    def test_get_forecast_not_found(self, client):
        """Test getting a non-existent forecast returns 404."""
        response = client.get("/api/forecasting/sales/99999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Forecast not found"

    def test_update_forecast(self, client, created_product, sample_forecast_data):
        """Test updating a forecast."""
        sample_forecast_data["product_id"] = created_product["id"]
        create_response = client.post("/api/forecasting/sales", json=sample_forecast_data)
        forecast_id = create_response.json()["id"]
        
        update_data = {
            "forecasted_quantity": 200,
            "forecasted_price": 79.99
        }
        response = client.put(f"/api/forecasting/sales/{forecast_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["forecasted_quantity"] == 200
        assert data["forecasted_price"] == 79.99

    def test_update_forecast_not_found(self, client):
        """Test updating a non-existent forecast returns 404."""
        update_data = {"forecasted_quantity": 200}
        response = client.put("/api/forecasting/sales/99999", json=update_data)
        assert response.status_code == 404
        assert response.json()["detail"] == "Forecast not found"

    def test_delete_forecast(self, client, created_product, sample_forecast_data):
        """Test deleting a forecast."""
        sample_forecast_data["product_id"] = created_product["id"]
        create_response = client.post("/api/forecasting/sales", json=sample_forecast_data)
        forecast_id = create_response.json()["id"]
        
        response = client.delete(f"/api/forecasting/sales/{forecast_id}")
        assert response.status_code == 200
        assert response.json()["message"] == "Forecast deleted successfully"
        
        # Verify forecast is deleted
        get_response = client.get(f"/api/forecasting/sales/{forecast_id}")
        assert get_response.status_code == 404

    def test_delete_forecast_not_found(self, client):
        """Test deleting a non-existent forecast returns 404."""
        response = client.delete("/api/forecasting/sales/99999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Forecast not found"

    def test_get_forecasts_pagination(self, client, created_product):
        """Test forecast list pagination."""
        # Create multiple forecasts
        for i in range(5):
            forecast_data = {
                "product_id": created_product["id"],
                "forecasted_quantity": 100 + (i * 10),
                "forecasted_price": 50.0 + (i * 5)
            }
            client.post("/api/forecasting/sales", json=forecast_data)
        
        # Test with limit
        response = client.get("/api/forecasting/sales?limit=2")
        assert response.status_code == 200
        assert len(response.json()) == 2
        
        # Test with skip
        response = client.get("/api/forecasting/sales?skip=2&limit=2")
        assert response.status_code == 200
        assert len(response.json()) == 2
