"""
Tests for the Authentication API endpoints.
"""
import pytest


class TestAuthRegistration:
    """Test suite for user registration."""

    def test_register_user(self, client, sample_user_data):
        """Test successful user registration."""
        response = client.post("/api/auth/register", json=sample_user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == sample_user_data["username"]
        assert data["email"] == sample_user_data["email"]
        assert data["full_name"] == sample_user_data["full_name"]
        assert data["role"] == "cashier"  # Default role is now cashier
        assert data["is_active"] == True
        assert "id" in data
        assert "created_at" in data
        # Password should not be returned
        assert "password" not in data
        assert "hashed_password" not in data

    def test_register_admin_user(self, client, sample_admin_data):
        """Test registering an admin user."""
        response = client.post("/api/auth/register", json=sample_admin_data)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"

    def test_register_vendor_user(self, client, sample_vendor_user_data):
        """Test registering a vendor user."""
        response = client.post("/api/auth/register", json=sample_vendor_user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "vendor"

    def test_register_cashier_user(self, client, sample_cashier_user_data):
        """Test registering a cashier user."""
        response = client.post("/api/auth/register", json=sample_cashier_user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "cashier"

    def test_register_duplicate_username(self, client, sample_user_data):
        """Test registration fails with duplicate username."""
        # Register first user
        client.post("/api/auth/register", json=sample_user_data)
        
        # Try to register with same username
        duplicate_data = sample_user_data.copy()
        duplicate_data["email"] = "different@example.com"
        response = client.post("/api/auth/register", json=duplicate_data)
        assert response.status_code == 400
        assert "Username already registered" in response.json()["detail"]

    def test_register_duplicate_email(self, client, sample_user_data):
        """Test registration fails with duplicate email."""
        # Register first user
        client.post("/api/auth/register", json=sample_user_data)
        
        # Try to register with same email
        duplicate_data = sample_user_data.copy()
        duplicate_data["username"] = "differentuser"
        response = client.post("/api/auth/register", json=duplicate_data)
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]


class TestAuthLogin:
    """Test suite for user login."""

    def test_login_success(self, client, registered_user, sample_user_data):
        """Test successful login."""
        response = client.post(
            "/api/auth/login",
            data={"username": sample_user_data["username"], "password": sample_user_data["password"]}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, registered_user, sample_user_data):
        """Test login fails with wrong password."""
        response = client.post(
            "/api/auth/login",
            data={"username": sample_user_data["username"], "password": "wrongpassword"}
        )
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]

    def test_login_nonexistent_user(self, client):
        """Test login fails for non-existent user."""
        response = client.post(
            "/api/auth/login",
            data={"username": "nonexistent", "password": "password"}
        )
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]


class TestAuthProfile:
    """Test suite for user profile operations."""

    def test_get_current_user_profile(self, client, auth_headers, sample_user_data):
        """Test getting current user profile."""
        response = client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == sample_user_data["username"]
        assert data["email"] == sample_user_data["email"]

    def test_get_profile_unauthorized(self, client):
        """Test getting profile without authentication fails."""
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_update_current_user_profile(self, client, auth_headers):
        """Test updating current user profile."""
        update_data = {"full_name": "Updated Name"}
        response = client.put("/api/auth/me", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Name"

    def test_update_profile_change_username(self, client, auth_headers):
        """Test changing username."""
        update_data = {"username": "newusername"}
        response = client.put("/api/auth/me", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "newusername"


class TestAuthAdminOperations:
    """Test suite for admin-only operations."""

    def test_get_all_users_as_admin(self, client, admin_auth_headers):
        """Test admin can get all users."""
        response = client.get("/api/auth/users", headers=admin_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # At least the admin user

    def test_get_all_users_as_staff_forbidden(self, client, auth_headers):
        """Test staff cannot get all users."""
        response = client.get("/api/auth/users", headers=auth_headers)
        assert response.status_code == 403
        assert "Insufficient permissions" in response.json()["detail"]

    def test_get_user_by_id_as_admin(self, client, admin_auth_headers, registered_user):
        """Test admin can get user by ID."""
        user_id = registered_user["id"]
        response = client.get(f"/api/auth/users/{user_id}", headers=admin_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id

    def test_get_user_not_found(self, client, admin_auth_headers):
        """Test getting non-existent user returns 404."""
        response = client.get("/api/auth/users/99999", headers=admin_auth_headers)
        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]

    def test_update_user_as_admin(self, client, admin_auth_headers, registered_user):
        """Test admin can update any user."""
        user_id = registered_user["id"]
        update_data = {"full_name": "Admin Updated Name"}
        response = client.put(
            f"/api/auth/users/{user_id}",
            json=update_data,
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Admin Updated Name"

    def test_delete_user_as_admin(self, client, admin_auth_headers, registered_user):
        """Test admin can delete users."""
        user_id = registered_user["id"]
        response = client.delete(f"/api/auth/users/{user_id}", headers=admin_auth_headers)
        assert response.status_code == 200
        assert "User deleted successfully" in response.json()["message"]
        
        # Verify user is deleted
        get_response = client.get(f"/api/auth/users/{user_id}", headers=admin_auth_headers)
        assert get_response.status_code == 404

    def test_admin_cannot_delete_self(self, client, admin_auth_headers, sample_admin_data):
        """Test admin cannot delete their own account."""
        # Get admin's user ID from profile
        profile_response = client.get("/api/auth/me", headers=admin_auth_headers)
        admin_id = profile_response.json()["id"]
        
        response = client.delete(f"/api/auth/users/{admin_id}", headers=admin_auth_headers)
        assert response.status_code == 400
        assert "Cannot delete your own account" in response.json()["detail"]

    def test_staff_cannot_delete_users(self, client, auth_headers, registered_admin):
        """Test staff cannot delete users."""
        admin_id = registered_admin["id"]
        response = client.delete(f"/api/auth/users/{admin_id}", headers=auth_headers)
        assert response.status_code == 403


class TestTokenValidation:
    """Test suite for token validation."""

    def test_invalid_token(self, client):
        """Test request with invalid token fails."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/auth/me", headers=headers)
        assert response.status_code == 401

    def test_expired_token_format(self, client):
        """Test malformed token fails."""
        headers = {"Authorization": "Bearer"}
        response = client.get("/api/auth/me", headers=headers)
        assert response.status_code == 401
