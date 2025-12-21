"""
Tests for the Transactions API endpoints.
"""
import pytest


class TestTransactionsAPI:
    """Test suite for Transactions CRUD operations."""

    def test_get_transactions_empty(self, client):
        """Test getting transactions when database is empty."""
        response = client.get("/api/transactions/")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_transaction(self, client, created_product, sample_transaction_data):
        """Test creating a new transaction."""
        sample_transaction_data["vendor_id"] = created_product["vendor_id"]
        sample_transaction_data["product_id"] = created_product["id"]
        response = client.post("/api/transactions/", json=sample_transaction_data)
        assert response.status_code == 200
        data = response.json()
        assert data["vendor_id"] == sample_transaction_data["vendor_id"]
        assert data["product_id"] == sample_transaction_data["product_id"]
        assert data["quantity"] == sample_transaction_data["quantity"]
        assert data["total_price"] == sample_transaction_data["total_price"]
        assert "id" in data
        assert "transaction_date" in data

    def test_get_transactions_list(self, client, created_product, sample_transaction_data):
        """Test getting list of transactions."""
        # Create a transaction
        sample_transaction_data["vendor_id"] = created_product["vendor_id"]
        sample_transaction_data["product_id"] = created_product["id"]
        client.post("/api/transactions/", json=sample_transaction_data)
        
        response = client.get("/api/transactions/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    def test_get_transaction_by_id(self, client, created_product, sample_transaction_data):
        """Test getting a specific transaction by ID."""
        sample_transaction_data["vendor_id"] = created_product["vendor_id"]
        sample_transaction_data["product_id"] = created_product["id"]
        create_response = client.post("/api/transactions/", json=sample_transaction_data)
        transaction_id = create_response.json()["id"]
        
        response = client.get(f"/api/transactions/{transaction_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == transaction_id

    def test_get_transaction_not_found(self, client):
        """Test getting a non-existent transaction returns 404."""
        response = client.get("/api/transactions/99999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Transaction not found"

    def test_update_transaction(self, client, created_product, sample_transaction_data):
        """Test updating a transaction."""
        sample_transaction_data["vendor_id"] = created_product["vendor_id"]
        sample_transaction_data["product_id"] = created_product["id"]
        create_response = client.post("/api/transactions/", json=sample_transaction_data)
        transaction_id = create_response.json()["id"]
        
        update_data = {
            "quantity": 10,
            "total_price": 999.90
        }
        response = client.put(f"/api/transactions/{transaction_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["quantity"] == 10
        assert data["total_price"] == 999.90

    def test_update_transaction_not_found(self, client):
        """Test updating a non-existent transaction returns 404."""
        update_data = {"quantity": 10}
        response = client.put("/api/transactions/99999", json=update_data)
        assert response.status_code == 404
        assert response.json()["detail"] == "Transaction not found"

    def test_delete_transaction(self, client, created_product, sample_transaction_data):
        """Test deleting a transaction."""
        sample_transaction_data["vendor_id"] = created_product["vendor_id"]
        sample_transaction_data["product_id"] = created_product["id"]
        create_response = client.post("/api/transactions/", json=sample_transaction_data)
        transaction_id = create_response.json()["id"]
        
        response = client.delete(f"/api/transactions/{transaction_id}")
        assert response.status_code == 200
        assert response.json()["message"] == "Transaction deleted successfully"
        
        # Verify transaction is deleted
        get_response = client.get(f"/api/transactions/{transaction_id}")
        assert get_response.status_code == 404

    def test_delete_transaction_not_found(self, client):
        """Test deleting a non-existent transaction returns 404."""
        response = client.delete("/api/transactions/99999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Transaction not found"

    def test_get_transactions_pagination(self, client, created_product):
        """Test transaction list pagination."""
        # Create multiple transactions
        for i in range(5):
            transaction_data = {
                "vendor_id": created_product["vendor_id"],
                "product_id": created_product["id"],
                "quantity": i + 1,
                "total_price": 100.0 * (i + 1)
            }
            client.post("/api/transactions/", json=transaction_data)
        
        # Test with limit
        response = client.get("/api/transactions/?limit=2")
        assert response.status_code == 200
        assert len(response.json()) == 2
        
        # Test with skip
        response = client.get("/api/transactions/?skip=2&limit=2")
        assert response.status_code == 200
        assert len(response.json()) == 2
