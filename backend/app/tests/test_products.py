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
        data = response.json()
        assert data["items"] == []
        assert data["pagination"]["total"] == 0

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
        assert len(data["items"]) == 1
        assert data["items"][0]["name"] == created_product["name"]
        assert data["pagination"]["total"] == 1

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
        
        # Test with page_size
        response = client.get("/api/products/?page_size=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["pagination"]["total"] == 5
        assert data["pagination"]["total_pages"] == 3
        
        # Test with page
        response = client.get("/api/products/?page=2&page_size=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["pagination"]["page"] == 2

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

    def test_search_products(self, client, created_vendor):
        """Test searching products."""
        # Create products with different names
        for name in ["Apple iPhone", "Samsung Galaxy", "Apple Watch"]:
            product_data = {
                "name": name,
                "description": "Test description",
                "price": 999.99,
                "quantity": 10,
                "vendor_id": created_vendor["id"]
            }
            client.post("/api/products/", json=product_data)
        
        # Search for "Apple"
        response = client.get("/api/products/?search=Apple")
        assert response.status_code == 200
        data = response.json()
        assert data["pagination"]["total"] == 2

    def test_filter_products_by_vendor(self, client, created_vendor, sample_vendor_data):
        """Test filtering products by vendor."""
        # Create another vendor
        vendor2_data = {**sample_vendor_data, "name": "Vendor 2", "email": "vendor2@test.com"}
        vendor2_response = client.post("/api/vendors/", json=vendor2_data)
        vendor2 = vendor2_response.json()
        
        # Create products for each vendor
        for vendor_id in [created_vendor["id"], vendor2["id"]]:
            product_data = {
                "name": f"Product for vendor {vendor_id}",
                "description": "Test",
                "price": 99.99,
                "quantity": 10,
                "vendor_id": vendor_id
            }
            client.post("/api/products/", json=product_data)
        
        # Filter by first vendor
        response = client.get(f"/api/products/?vendor_id={created_vendor['id']}")
        assert response.status_code == 200
        data = response.json()
        assert data["pagination"]["total"] == 1
