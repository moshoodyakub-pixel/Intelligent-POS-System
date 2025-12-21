"""
Tests for the Products API endpoints.
"""
import pytest


class TestProductsAPI:
    """Test suite for Products CRUD operations."""

    def test_get_products_empty(self, client):
        """Test getting products when database is empty."""
        response = client.get("/api/products/")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_product(self, client, created_vendor, sample_product_data):
        """Test creating a new product."""
        sample_product_data["vendor_id"] = created_vendor["id"]
        response = client.post("/api/products/", json=sample_product_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == sample_product_data["name"]
        assert data["description"] == sample_product_data["description"]
        assert data["price"] == sample_product_data["price"]
        assert data["quantity"] == sample_product_data["quantity"]
        assert data["vendor_id"] == created_vendor["id"]
        assert "id" in data
        assert "created_at" in data

    def test_get_products_list(self, client, created_product):
        """Test getting list of products."""
        response = client.get("/api/products/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == created_product["name"]

    def test_get_product_by_id(self, client, created_product):
        """Test getting a specific product by ID."""
        product_id = created_product["id"]
        response = client.get(f"/api/products/{product_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == product_id
        assert data["name"] == created_product["name"]

    def test_get_product_not_found(self, client):
        """Test getting a non-existent product returns 404."""
        response = client.get("/api/products/99999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Product not found"

    def test_update_product(self, client, created_product):
        """Test updating a product."""
        product_id = created_product["id"]
        update_data = {
            "name": "Updated Product Name",
            "price": 149.99
        }
        response = client.put(f"/api/products/{product_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Product Name"
        assert data["price"] == 149.99
        # Original fields should remain
        assert data["description"] == created_product["description"]

    def test_update_product_not_found(self, client):
        """Test updating a non-existent product returns 404."""
        update_data = {"name": "New Name"}
        response = client.put("/api/products/99999", json=update_data)
        assert response.status_code == 404
        assert response.json()["detail"] == "Product not found"

    def test_delete_product(self, client, created_product):
        """Test deleting a product."""
        product_id = created_product["id"]
        response = client.delete(f"/api/products/{product_id}")
        assert response.status_code == 200
        assert response.json()["message"] == "Product deleted successfully"
        
        # Verify product is deleted
        get_response = client.get(f"/api/products/{product_id}")
        assert get_response.status_code == 404

    def test_delete_product_not_found(self, client):
        """Test deleting a non-existent product returns 404."""
        response = client.delete("/api/products/99999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Product not found"

    def test_get_products_pagination(self, client, created_vendor):
        """Test product list pagination."""
        # Create multiple products
        for i in range(5):
            product_data = {
                "name": f"Product {i}",
                "description": f"Description {i}",
                "price": 10.0 * (i + 1),
                "quantity": 10 * (i + 1),
                "vendor_id": created_vendor["id"]
            }
            client.post("/api/products/", json=product_data)
        
        # Test with limit
        response = client.get("/api/products/?limit=2")
        assert response.status_code == 200
        assert len(response.json()) == 2
        
        # Test with skip
        response = client.get("/api/products/?skip=2&limit=2")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_create_product_with_all_fields(self, client, created_vendor):
        """Test creating a product with all required fields."""
        product_data = {
            "name": "Complete Product",
            "description": "Full description with all details",
            "price": 299.99,
            "quantity": 50,
            "vendor_id": created_vendor["id"]
        }
        response = client.post("/api/products/", json=product_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == product_data["name"]
        assert data["description"] == product_data["description"]
        assert data["price"] == product_data["price"]
        assert data["quantity"] == product_data["quantity"]
