"""
Tests for the Vendors API endpoints.
"""
import pytest


class TestVendorsAPI:
    """Test suite for Vendors CRUD operations."""

    def test_get_vendors_empty(self, client):
        """Test getting vendors when database is empty."""
        response = client.get("/api/vendors/")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_vendor(self, client, sample_vendor_data):
        """Test creating a new vendor."""
        response = client.post("/api/vendors/", json=sample_vendor_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == sample_vendor_data["name"]
        assert data["email"] == sample_vendor_data["email"]
        assert data["phone"] == sample_vendor_data["phone"]
        assert data["address"] == sample_vendor_data["address"]
        assert "id" in data
        assert "created_at" in data

    def test_get_vendors_list(self, client, sample_vendor_data):
        """Test getting list of vendors."""
        # Create a vendor first
        client.post("/api/vendors/", json=sample_vendor_data)
        
        response = client.get("/api/vendors/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == sample_vendor_data["name"]

    def test_get_vendor_by_id(self, client, created_vendor):
        """Test getting a specific vendor by ID."""
        vendor_id = created_vendor["id"]
        response = client.get(f"/api/vendors/{vendor_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == vendor_id
        assert data["name"] == created_vendor["name"]

    def test_get_vendor_not_found(self, client):
        """Test getting a non-existent vendor returns 404."""
        response = client.get("/api/vendors/99999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Vendor not found"

    def test_update_vendor(self, client, created_vendor):
        """Test updating a vendor."""
        vendor_id = created_vendor["id"]
        update_data = {
            "name": "Updated Vendor Name",
            "email": "updated@vendor.com"
        }
        response = client.put(f"/api/vendors/{vendor_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Vendor Name"
        assert data["email"] == "updated@vendor.com"
        # Original fields should remain
        assert data["phone"] == created_vendor["phone"]

    def test_update_vendor_not_found(self, client):
        """Test updating a non-existent vendor returns 404."""
        update_data = {"name": "New Name"}
        response = client.put("/api/vendors/99999", json=update_data)
        assert response.status_code == 404
        assert response.json()["detail"] == "Vendor not found"

    def test_delete_vendor(self, client, created_vendor):
        """Test deleting a vendor."""
        vendor_id = created_vendor["id"]
        response = client.delete(f"/api/vendors/{vendor_id}")
        assert response.status_code == 200
        assert response.json()["message"] == "Vendor deleted successfully"
        
        # Verify vendor is deleted
        get_response = client.get(f"/api/vendors/{vendor_id}")
        assert get_response.status_code == 404

    def test_delete_vendor_not_found(self, client):
        """Test deleting a non-existent vendor returns 404."""
        response = client.delete("/api/vendors/99999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Vendor not found"

    def test_get_vendors_pagination(self, client):
        """Test vendor list pagination."""
        # Create multiple vendors
        for i in range(5):
            vendor_data = {
                "name": f"Vendor {i}",
                "email": f"vendor{i}@test.com",
                "phone": f"123-456-000{i}",
                "address": f"Address {i}"
            }
            client.post("/api/vendors/", json=vendor_data)
        
        # Test with limit
        response = client.get("/api/vendors/?limit=2")
        assert response.status_code == 200
        assert len(response.json()) == 2
        
        # Test with skip
        response = client.get("/api/vendors/?skip=2&limit=2")
        assert response.status_code == 200
        assert len(response.json()) == 2
